from app.core.exceptions import ExtractionException
from app.core.logging_config import get_logger
from app.schemas.analysis import DealIntelligence
from app.schemas.transcript import CanonicalTranscript
from app.services.llm_client import LLMClient


logger = get_logger("app.pipeline.deal_intelligence")


class DealIntelligenceExtractor:
    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client

    async def extract(self, analysis_id: str, transcript: CanonicalTranscript) -> DealIntelligence:
        logger.info("deal_intelligence_started analysis_id=%s", analysis_id)
        try:
            result = await self.llm_client.extract_deal_intelligence(transcript)
            logger.info(
                "deal_intelligence_completed analysis_id=%s risk_score=%s",
                analysis_id,
                result.risk_score,
            )
            return result
        except Exception as exc:
            logger.error("deal_intelligence_failed analysis_id=%s error=%s", analysis_id, exc)
            if isinstance(exc, ExtractionException):
                raise
            raise ExtractionException("Deal intelligence extraction failed.") from exc
