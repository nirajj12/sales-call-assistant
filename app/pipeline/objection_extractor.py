from pathlib import Path

from app.core.exceptions import ExtractionException, ValidationException
from app.core.logging_config import get_logger
from app.schemas.common import ConfidenceLevel
from app.schemas.objection import Objection, ObjectionResult
from app.schemas.objection import ObjectionResult
from app.schemas.transcript import CanonicalTranscript
from app.services.llm_client import LLMClient


logger = get_logger("app.pipeline.objection")
PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "objection.txt"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def validate_objections(raw_list: list[dict]) -> list[Objection]:
    result: list[Objection] = []
    for idx, item in enumerate(raw_list):
        try:
            result.append(
                Objection(
                    objection_id=item.get("objection_id", f"obj-{idx+1}"),
                    text=item["text"],
                    category=item.get("category", "need"),
                    explicitness=item.get("explicitness", "explicit"),
                    handling_quality=item.get("handling_quality", item.get("rep_handling", "needs_follow_up")),
                    suggested_response=item.get("suggested_response", ""),
                    confidence=item.get("confidence", ConfidenceLevel.MEDIUM.value),
                    evidence_anchor=item.get("evidence_anchor"),
                    turn_id=item.get("turn_id"),
                )
            )
        except Exception as exc:
            raise ValidationException(f"Objection {idx} failed validation: {exc}") from exc
    return result


class ObjectionExtractor:
    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client
        self.system_prompt = _load_prompt()

    async def extract(self, analysis_id: str, transcript: CanonicalTranscript) -> ObjectionResult:
        logger.info("objection_extraction_started analysis_id=%s", analysis_id)
        try:
            result = await self.llm_client.extract_objections(transcript)
            logger.info(
                "objection_extraction_completed analysis_id=%s objections=%s",
                analysis_id,
                len(result.objections),
            )
            return result
        except Exception as exc:
            logger.error("objection_extraction_failed analysis_id=%s error=%s", analysis_id, exc)
            if isinstance(exc, ExtractionException):
                raise
            raise ExtractionException("Objection extraction failed.") from exc

    async def extract_raw(self, transcript: CanonicalTranscript, analysis_id: str) -> list[dict]:
        logger.info("objection_extractor_raw_started analysis_id=%s", analysis_id)
        raw = await self.llm_client.complete_json(
            system_prompt=self.system_prompt,
            user_message=f"Extract all objections from this transcript:\n\n{transcript.raw_text}",
            analysis_id=analysis_id,
            node_name="objection_extractor",
            schema_cls=ObjectionResult,
        )
        if isinstance(raw, list):
            return raw
        if isinstance(raw, dict):
            if isinstance(raw.get("objections"), list):
                return raw["objections"]
            for value in raw.values():
                if isinstance(value, list):
                    return value
        raise ExtractionException("Objection extractor expected a JSON array or objections list.")
