from datetime import datetime, timezone

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.graph.state import AnalysisState
from app.pipeline.coaching_engine import CoachingEngine
from app.pipeline.judge import JudgeLLM
from app.pipeline.meddic_extractor import MEDDICExtractor, MEDDIC_KEYS, validate_meddic
from app.pipeline.normaliser import TranscriptNormaliser
from app.pipeline.objection_extractor import ObjectionExtractor, validate_objections
from app.pipeline.quote_verifier import QuoteVerifier
from app.schemas.analysis import (
    AnalysisMetrics,
    AnalysisResult,
    CompletenessScore,
    DealIntelligence,
    JudgeResult,
)
from app.schemas.common import AnalysisStatus, ConfidenceLevel
from app.schemas.meddic import MEDDICResult
from app.schemas.objection import ObjectionResult
from app.schemas.transcript import AnalyzeTranscriptRequest
from app.services.llm_client import LLMClient
from app.services.metrics_service import MetricsService


logger = get_logger("app.graph.nodes")
settings = get_settings()
_normaliser = TranscriptNormaliser()
_llm = LLMClient()
_meddic_extractor = MEDDICExtractor(_llm)
_objection_extractor = ObjectionExtractor(_llm)
_quote_verifier = QuoteVerifier()
_judge = JudgeLLM()
_metrics_service = MetricsService()
_coaching_engine = CoachingEngine()


def transcript_loader_node(state: AnalysisState) -> dict:
    raw_text = state.get("raw_text", "")
    if not raw_text or len(raw_text.strip()) < 50:
        return {
            "status": AnalysisStatus.FAILED,
            "errors": ["Transcript too short — minimum 50 characters required."],
        }
    if len(raw_text) > settings.max_transcript_chars:
        return {
            "status": AnalysisStatus.FAILED,
            "errors": [f"Transcript exceeds max size of {settings.max_transcript_chars} characters."],
        }
    return {}


def normaliser_node(state: AnalysisState) -> dict:
    if state.get("status") == AnalysisStatus.FAILED:
        return {}
    try:
        transcript = _normaliser.normalize(
            transcript_text=state["raw_text"],
            source_name=state.get("source_name"),
        )
        return {"transcript": transcript, "status": AnalysisStatus.RUNNING}
    except Exception as exc:
        return {
            "status": AnalysisStatus.FAILED,
            "errors": [f"Normalisation failed: {exc}"],
        }


def extraction_gate_node(_: AnalysisState) -> dict:
    return {}


async def meddic_extractor_node(state: AnalysisState) -> dict:
    if not state.get("transcript"):
        return {"meddic_raw": None, "errors": ["MEDDIC extraction skipped — transcript missing."]}
    try:
        raw = await _meddic_extractor.extract_raw(state["transcript"], state["analysis_id"])
        return {"meddic_raw": raw}
    except Exception as exc:
        return {"meddic_raw": None, "errors": [f"MEDDIC extraction error: {exc}"]}


async def objection_extractor_node(state: AnalysisState) -> dict:
    if not state.get("transcript"):
        return {"objections_raw": None, "errors": ["Objection extraction skipped — transcript missing."]}
    try:
        raw = await _objection_extractor.extract_raw(state["transcript"], state["analysis_id"])
        return {"objections_raw": raw}
    except Exception as exc:
        return {"objections_raw": None, "errors": [f"Objection extraction error: {exc}"]}


def meddic_validator_node(state: AnalysisState) -> dict:
    raw = state.get("meddic_raw")
    if not raw:
        return {"meddic_validated": False, "errors": ["MEDDIC raw output was empty."]}
    try:
        meddic = validate_meddic(raw)
        return {"meddic": meddic, "meddic_validated": True}
    except Exception as exc:
        return {"meddic_validated": False, "errors": [f"MEDDIC schema validation failed: {exc}"]}


def objection_validator_node(state: AnalysisState) -> dict:
    raw = state.get("objections_raw")
    if raw is None:
        return {"objections_validated": False, "errors": ["Objection raw output was empty."]}
    try:
        objections = validate_objections(raw)
        return {"objections": objections, "objections_validated": True}
    except Exception as exc:
        return {"objections_validated": False, "errors": [f"Objection schema validation failed: {exc}"]}


def quote_verifier_node(state: AnalysisState) -> dict:
    meddic = state.get("meddic")
    transcript = state.get("transcript")
    objections = state.get("objections") or []
    if not meddic or not transcript:
        return {
            "evidence_index": [],
            "errors": ["Quote verification skipped — missing transcript or MEDDIC."],
        }
    evidence = _quote_verifier.verify_all(
        analysis_id=state["analysis_id"],
        transcript=transcript,
        meddic=meddic,
        objections=ObjectionResult(objections=objections),
    )
    return {"evidence_index": evidence}


async def judge_node(state: AnalysisState) -> dict:
    meddic = state.get("meddic")
    if not meddic:
        return {"judge_result": None, "errors": ["Judge skipped — MEDDIC missing."]}
    try:
        result = await _judge.judge(
            meddic=meddic,
            evidence_index=state.get("evidence_index", []),
            analysis_id=state["analysis_id"],
        )
        downgraded = _apply_judge_downgrades(meddic, result)
        return {"meddic": downgraded, "judge_result": result}
    except Exception as exc:
        return {"judge_result": None, "errors": [f"Judge LLM failed: {exc}"]}


async def coaching_deal_node(state: AnalysisState) -> dict:
    transcript = state.get("transcript")
    meddic = state.get("meddic")
    objections = state.get("objections") or []
    if not transcript or not meddic:
        return {"errors": ["Coaching/deal intelligence skipped — transcript or MEDDIC missing."]}
    metrics = _metrics_service.compute(transcript, meddic)
    completeness = _build_completeness(meddic)
    coaching = _coaching_engine.build(
        transcript=transcript,
        meddic=meddic,
        objections=ObjectionResult(objections=objections),
        verified_evidence=state.get("evidence_index", []),
        metrics=metrics,
    )
    try:
        deal_intelligence = await _llm.extract_deal_intelligence(transcript)
    except Exception as exc:
        logger.warning("deal_intelligence_fallback analysis_id=%s error=%s", state["analysis_id"], exc)
        deal_intelligence = _llm._mock_deal_intelligence(transcript)
        return {
            "metrics": metrics,
            "coaching": coaching,
            "completeness": completeness,
            "deal_intelligence": deal_intelligence,
            "errors": [f"Deal intelligence fallback used: {exc}"],
        }
    return {
        "metrics": metrics,
        "coaching": coaching,
        "completeness": completeness,
        "deal_intelligence": deal_intelligence,
    }


async def persist_node(state: AnalysisState) -> dict:
    from app.db.database import AnalysisRepository

    transcript = state.get("transcript")
    if transcript is None:
        return {"status": AnalysisStatus.FAILED, "errors": ["Persistence skipped — transcript missing."]}

    meddic = state.get("meddic") or MEDDICResult()
    completeness = state.get("completeness") or _build_completeness(meddic)
    objections = ObjectionResult(objections=state.get("objections") or [])
    metrics = state.get("metrics") or _metrics_service.compute(transcript, meddic)
    coaching = state.get("coaching") or _coaching_engine.build(
        transcript=transcript,
        meddic=meddic,
        objections=objections,
        verified_evidence=state.get("evidence_index", []),
        metrics=metrics,
    )
    deal_intelligence = state.get("deal_intelligence") or _llm._mock_deal_intelligence(transcript)

    errors = state.get("errors", [])
    if errors and state.get("meddic_validated") is False and state.get("objections_validated") is False:
        final_status = AnalysisStatus.FAILED
    elif errors:
        final_status = AnalysisStatus.PARTIAL
    else:
        final_status = AnalysisStatus.COMPLETED

    result = AnalysisResult(
        analysis_id=state["analysis_id"],
        job_id=state.get("job_id"),
        created_at=datetime.now(timezone.utc),
        provider_used=_llm.active_provider_name(),
        request=AnalyzeTranscriptRequest(
            transcript_text=state.get("raw_text"),
            transcript_name=state.get("source_name"),
            source_type="job",
        ),
        transcript=transcript,
        meddic=meddic,
        completeness=completeness,
        objections=objections,
        verified_evidence=state.get("evidence_index", []),
        metrics=metrics,
        deal_intelligence=deal_intelligence,
        coaching=coaching,
        judge_result=state.get("judge_result"),
        status=final_status,
        errors=errors,
    )
    repo = AnalysisRepository()
    saved = await repo.save(result)
    return {"db_id": saved.id, "status": final_status}


def _build_completeness(meddic: MEDDICResult) -> CompletenessScore:
    entries = [(key, getattr(meddic, key)) for key in MEDDIC_KEYS]
    high_count = sum(1 for _, item in entries if item.confidence == ConfidenceLevel.HIGH)
    medium_or_better = sum(
        1 for _, item in entries if item.confidence in {ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM}
    )
    gap_elements = [key for key, item in entries if item.gap_flag or item.confidence == ConfidenceLevel.MISSING]
    return CompletenessScore(
        score=round((high_count / 6) * 100, 1),
        high_confidence_count=high_count,
        at_least_medium_count=medium_or_better,
        gap_elements=gap_elements,
    )


def _apply_judge_downgrades(meddic: MEDDICResult, judge_result: JudgeResult) -> MEDDICResult:
    updated = meddic.model_copy(deep=True)
    downgrade_map = {
        ConfidenceLevel.HIGH: ConfidenceLevel.MEDIUM,
        ConfidenceLevel.MEDIUM: ConfidenceLevel.LOW,
        ConfidenceLevel.LOW: ConfidenceLevel.MISSING,
        ConfidenceLevel.MISSING: ConfidenceLevel.MISSING,
    }
    for key in judge_result.should_downgrade:
        if hasattr(updated, key):
            element = getattr(updated, key)
            element.confidence = downgrade_map[element.confidence]
            element.gap_flag = element.confidence in {ConfidenceLevel.LOW, ConfidenceLevel.MISSING}
    return updated
