from pathlib import Path

from app.core.logging_config import get_logger
from app.schemas.analysis import JudgeResult, VerifiedEvidence
from app.schemas.meddic import MEDDICResult
from app.services.llm_client import LLMClient


logger = get_logger("app.pipeline.judge")
PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "judge.txt"
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


class JudgeLLM:
    def __init__(self) -> None:
        self.llm = LLMClient()
        self.system_prompt = _load_prompt()

    async def judge(
        self,
        meddic: MEDDICResult,
        evidence_index: list[VerifiedEvidence],
        analysis_id: str,
    ) -> JudgeResult:
        evidence_summary = []
        for key in MEDDIC_KEYS:
            element = getattr(meddic, key)
            evidence = next((item for item in evidence_index if item.source_label == key), None)
            evidence_summary.append(
                {
                    "element": key,
                    "claimed_confidence": element.confidence,
                    "value": element.value,
                    "anchor": element.evidence_anchor,
                    "verification": evidence.status if evidence else "not_found",
                    "matched_text": evidence.matched_text if evidence else None,
                }
            )

        raw = await self.llm.complete_json(
            system_prompt=self.system_prompt,
            user_message=(
                "Review these MEDDIC extractions and verified evidence.\n\n"
                f"{evidence_summary}"
            ),
            analysis_id=analysis_id,
            node_name="judge_llm",
        )
        if not isinstance(raw, dict):
            raise ValueError("Judge LLM expected a JSON object.")
        logger.info("judge_completed analysis_id=%s", analysis_id)
        return JudgeResult(
            overall_support_strength=raw.get("overall_support_strength", "moderate"),
            confidence_review=raw.get("confidence_review", ""),
            flags=raw.get("flags", []),
            should_downgrade=raw.get("should_downgrade", []),
        )
