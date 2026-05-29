from app.schemas.analysis import AnalysisMetrics, VerifiedEvidence
from app.schemas.coaching import CoachingPoint, CoachingResult, DealSummary, QuestionStats, TalkRatio
from app.schemas.common import VerificationStatus
from app.schemas.meddic import MEDDICResult
from app.schemas.objection import ObjectionResult
from app.schemas.transcript import CanonicalTranscript
from app.utils.text_utils import is_open_question, is_question


class CoachingEngine:
    def build(
        self,
        transcript: CanonicalTranscript,
        meddic: MEDDICResult,
        objections: ObjectionResult,
        verified_evidence: list[VerifiedEvidence],
        metrics: AnalysisMetrics,
    ) -> CoachingResult:
        rep_percentage = round(metrics.rep_talk_ratio * 100, 2)
        customer_percentage = round(metrics.customer_talk_ratio * 100, 2)
        assessment = self._talk_ratio_assessment(rep_percentage)
        rep_questions = [
            turn.text for turn in transcript.turns if turn.speaker_role.value == "rep" and is_question(turn.text)
        ]
        open_questions = [question for question in rep_questions if is_open_question(question)]
        closed_questions = [question for question in rep_questions if question not in open_questions]

        coaching_points = self._coaching_points(meddic, objections, verified_evidence)
        deal_summary = self._deal_summary(transcript, objections)

        return CoachingResult(
            talk_ratio=TalkRatio(
                rep_percentage=rep_percentage,
                customer_percentage=customer_percentage,
                assessment=assessment,
            ),
            question_stats=QuestionStats(
                total_questions=len(rep_questions),
                open_questions=open_questions,
                closed_questions=closed_questions,
            ),
            meddic_completeness_score=metrics.meddic_completeness_score,
            coaching_points=coaching_points,
            deal_summary=deal_summary,
        )

    def _talk_ratio_assessment(self, rep_percentage: float) -> str:
        if rep_percentage <= 45:
            return "Good for discovery. The customer had room to share context."
        if rep_percentage <= 60:
            return "Balanced, but the rep could invite more customer detail."
        return "Rep-heavy conversation. Add more discovery and confirmation questions."

    def _coaching_points(
        self,
        meddic: MEDDICResult,
        objections: ObjectionResult,
        verified_evidence: list[VerifiedEvidence],
    ) -> list[CoachingPoint]:
        points: list[CoachingPoint] = []
        meddic_dump = meddic.model_dump()
        missing = [
            label.replace("_", " ")
            for label, value in meddic_dump.items()
            if value.get("confidence") in {"missing", "low"} and not value.get("value")
        ]
        if missing:
            points.append(
                CoachingPoint(
                    summary=f"Strengthen qualification around: {', '.join(missing[:3])}.",
                    evidence_turn_ids=[],
                )
            )
        if objections.objections:
            points.append(
                CoachingPoint(
                    summary="Slow down on objections and confirm the root concern before pitching.",
                    evidence_turn_ids=[obj.turn_id for obj in objections.objections if obj.turn_id],
                )
            )
        unverified_turns = [ev.turn_id for ev in verified_evidence if ev.status == VerificationStatus.UNVERIFIED]
        if unverified_turns:
            points.append(
                CoachingPoint(
                    summary="Tighten evidence extraction prompts; some anchors could not be grounded.",
                    evidence_turn_ids=[],
                )
            )
        if not points:
            points.append(
                CoachingPoint(
                    summary="Good structure overall. Keep reinforcing business impact and next-step ownership.",
                    evidence_turn_ids=[],
                )
            )
        return points[:3]

    def _deal_summary(self, transcript: CanonicalTranscript, objections: ObjectionResult) -> DealSummary:
        buying_signals: list[str] = []
        next_steps: list[str] = []
        for turn in transcript.turns:
            lower = turn.text.lower()
            if "next week" in lower or "send" in lower or "follow up" in lower:
                next_steps.append(turn.text)
            if "loop in" in lower or "share" in lower or "review" in lower:
                buying_signals.append(turn.text)

        risks = [objection.text for objection in objections.objections[:3]]
        likely_stage = "discovery"
        if next_steps and buying_signals:
            likely_stage = "evaluation"
        return DealSummary(
            likely_stage=likely_stage,
            buying_signals=buying_signals[:3],
            risks=risks,
            next_steps=next_steps[:3],
        )

