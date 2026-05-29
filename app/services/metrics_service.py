from app.schemas.analysis import AnalysisMetrics
from app.schemas.common import ConfidenceLevel, SpeakerRole
from app.schemas.meddic import MEDDICResult
from app.schemas.transcript import CanonicalTranscript
from app.utils.text_utils import is_open_question, is_question


class MetricsService:
    def compute(self, transcript: CanonicalTranscript, meddic: MEDDICResult) -> AnalysisMetrics:
        rep_words = sum(
            turn.word_count for turn in transcript.turns if turn.speaker_role == SpeakerRole.REP
        )
        customer_words = sum(
            turn.word_count
            for turn in transcript.turns
            if turn.speaker_role == SpeakerRole.CUSTOMER
        )
        total_words = max(rep_words + customer_words, 1)
        rep_ratio = rep_words / total_words
        customer_ratio = customer_words / total_words

        rep_questions = [
            turn.text
            for turn in transcript.turns
            if turn.speaker_role == SpeakerRole.REP and is_question(turn.text)
        ]
        open_questions = [question for question in rep_questions if is_open_question(question)]
        completeness = self._meddic_completeness_score(meddic)

        return AnalysisMetrics(
            rep_word_count=rep_words,
            customer_word_count=customer_words,
            rep_talk_ratio=round(rep_ratio, 4),
            customer_talk_ratio=round(customer_ratio, 4),
            meddic_completeness_score=round(completeness, 4),
            total_questions=len(rep_questions),
            open_question_count=len(open_questions),
            closed_question_count=len(rep_questions) - len(open_questions),
        )

    def _meddic_completeness_score(self, meddic: MEDDICResult) -> float:
        values = meddic.model_dump().values()
        populated = sum(
            1
            for value in values
            if value.get("confidence") in {ConfidenceLevel.HIGH.value, ConfidenceLevel.MEDIUM.value}
        )
        return populated / 6

