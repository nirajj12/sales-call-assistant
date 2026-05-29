from pydantic import Field

from app.schemas.common import BaseAppModel


class TalkRatio(BaseAppModel):
    rep_percentage: float = Field(ge=0, le=100)
    customer_percentage: float = Field(ge=0, le=100)
    assessment: str


class QuestionStats(BaseAppModel):
    total_questions: int = 0
    open_questions: list[str] = Field(default_factory=list)
    closed_questions: list[str] = Field(default_factory=list)


class CoachingPoint(BaseAppModel):
    summary: str
    evidence_turn_ids: list[str] = Field(default_factory=list)


class DealSummary(BaseAppModel):
    likely_stage: str
    buying_signals: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list)


class CoachingResult(BaseAppModel):
    talk_ratio: TalkRatio
    question_stats: QuestionStats
    meddic_completeness_score: float = Field(ge=0, le=1)
    coaching_points: list[CoachingPoint] = Field(default_factory=list)
    deal_summary: DealSummary

