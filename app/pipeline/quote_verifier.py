from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.schemas.analysis import VerifiedEvidence
from app.schemas.common import VerificationStatus
from app.schemas.meddic import MEDDICResult
from app.schemas.objection import ObjectionResult
from app.schemas.transcript import CanonicalTranscript
from app.utils.text_utils import similarity


logger = get_logger("app.pipeline.quote_verifier")


class QuoteVerifier:
    def __init__(self) -> None:
        self.settings = get_settings()

    def verify_all(
        self,
        analysis_id: str,
        transcript: CanonicalTranscript,
        meddic: MEDDICResult,
        objections: ObjectionResult,
    ) -> list[VerifiedEvidence]:
        evidences: list[VerifiedEvidence] = []
        unmatched = 0

        for label, element in meddic.model_dump().items():
            anchor = element.get("evidence_anchor")
            if anchor:
                verified = self._match_anchor(
                    transcript=transcript,
                    source_type="meddic",
                    source_label=label,
                    anchor_text=anchor,
                )
                if verified.status == VerificationStatus.UNVERIFIED:
                    unmatched += 1
                evidences.append(verified)

        for objection in objections.objections:
            anchor = objection.evidence_anchor or objection.text
            verified = self._match_anchor(
                transcript=transcript,
                source_type="objection",
                source_label=objection.objection_id,
                anchor_text=anchor,
            )
            if verified.status == VerificationStatus.UNVERIFIED:
                unmatched += 1
            evidences.append(verified)

        if unmatched:
            logger.warning(
                "quote_verification_warning analysis_id=%s unmatched=%s",
                analysis_id,
                unmatched,
            )
        else:
            logger.info(
                "quote_verification_completed analysis_id=%s matched=%s",
                analysis_id,
                len(evidences),
            )
        return evidences

    def _match_anchor(
        self,
        transcript: CanonicalTranscript,
        source_type: str,
        source_label: str,
        anchor_text: str,
    ) -> VerifiedEvidence:
        for turn in transcript.turns:
            if anchor_text.lower() in turn.text.lower():
                return VerifiedEvidence(
                    source_type=source_type,
                    source_label=source_label,
                    anchor_text=anchor_text,
                    matched_text=turn.text,
                    turn_id=turn.turn_id,
                    status=VerificationStatus.VERIFIED_EXACT,
                )

        best_turn = None
        best_score = 0.0
        for turn in transcript.turns:
            score = similarity(anchor_text, turn.text)
            if score > best_score:
                best_score = score
                best_turn = turn

        if best_turn and best_score >= self.settings.quote_fuzzy_threshold:
            return VerifiedEvidence(
                source_type=source_type,
                source_label=source_label,
                anchor_text=anchor_text,
                matched_text=best_turn.text,
                turn_id=best_turn.turn_id,
                status=VerificationStatus.VERIFIED_FUZZY,
            )

        return VerifiedEvidence(
            source_type=source_type,
            source_label=source_label,
            anchor_text=anchor_text,
            status=VerificationStatus.UNVERIFIED,
        )

