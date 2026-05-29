from pathlib import Path

from app.core.exceptions import ExtractionException, ValidationException
from app.core.logging_config import get_logger
from app.schemas.common import ConfidenceLevel
from app.schemas.meddic import MEDDICElement, MEDDICResult
from app.schemas.meddic import MEDDICResult
from app.schemas.transcript import CanonicalTranscript
from app.services.llm_client import LLMClient


logger = get_logger("app.pipeline.meddic")
PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "meddic.txt"
MEDDIC_KEYS = [
    "metrics",
    "economic_buyer",
    "decision_criteria",
    "decision_process",
    "identify_pain",
    "champion",
]


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _parse_element(key: str, raw: dict) -> MEDDICElement:
    try:
        confidence = raw.get("confidence", ConfidenceLevel.MISSING.value)
        if confidence not in {item.value for item in ConfidenceLevel}:
            logger.warning("invalid_confidence key=%s value=%s", key, confidence)
            confidence = ConfidenceLevel.MISSING.value
        return MEDDICElement(
            label=key,
            value=raw.get("value"),
            confidence=confidence,
            evidence_anchor=raw.get("evidence_anchor"),
            gap_flag=bool(raw.get("gap_flag", True)),
        )
    except Exception as exc:
        raise ValidationException(
            f"MEDDIC element '{key}' failed validation: {exc}"
        ) from exc


def validate_meddic(raw: dict) -> MEDDICResult:
    missing = [key for key in MEDDIC_KEYS if key not in raw]
    if missing:
        raise ValidationException(f"MEDDIC missing required keys: {missing}")
    return MEDDICResult(
        metrics=_parse_element("metrics", raw["metrics"]),
        economic_buyer=_parse_element("economic_buyer", raw["economic_buyer"]),
        decision_criteria=_parse_element("decision_criteria", raw["decision_criteria"]),
        decision_process=_parse_element("decision_process", raw["decision_process"]),
        identify_pain=_parse_element("identify_pain", raw["identify_pain"]),
        champion=_parse_element("champion", raw["champion"]),
    )


class MEDDICExtractor:
    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client
        self.system_prompt = _load_prompt()

    async def extract(self, analysis_id: str, transcript: CanonicalTranscript) -> MEDDICResult:
        logger.info("meddic_extraction_started analysis_id=%s", analysis_id)
        try:
            result = await self.llm_client.extract_meddic(transcript)
            high_confidence = len(
                [
                    element
                    for element in result.model_dump().values()
                    if isinstance(element, dict) and element.get("confidence") == "high"
                ]
            )
            logger.info(
                "meddic_extraction_completed analysis_id=%s high_confidence=%s",
                analysis_id,
                high_confidence,
            )
            return result
        except Exception as exc:
            logger.error("meddic_extraction_failed analysis_id=%s error=%s", analysis_id, exc)
            if isinstance(exc, ExtractionException):
                raise
            raise ExtractionException("MEDDIC extraction failed.") from exc

    async def extract_raw(self, transcript: CanonicalTranscript, analysis_id: str) -> dict:
        logger.info("meddic_extractor_raw_started analysis_id=%s", analysis_id)
        raw = await self.llm_client.complete_json(
            system_prompt=self.system_prompt,
            user_message=f"Analyze this transcript for MEDDIC signals:\n\n{transcript.raw_text}",
            analysis_id=analysis_id,
            node_name="meddic_extractor",
            schema_cls=MEDDICResult,
        )
        if not isinstance(raw, dict):
            raise ExtractionException("MEDDIC extractor expected a JSON object.")
        return raw
