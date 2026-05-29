from datetime import datetime
from uuid import uuid4

from pydantic import Field

from app.schemas.coaching import CoachingResult
from app.schemas.common import AnalysisStatus, BaseAppModel, SuccessResponse, VerificationStatus
from app.schemas.meddic import MEDDICResult
from app.schemas.objection import ObjectionResult
from app.schemas.transcript import AnalyzeTranscriptRequest, CanonicalTranscript


class VerifiedEvidence(BaseAppModel):
    evidence_id: str = Field(default_factory=lambda: str(uuid4()))
    source_type: str
    source_label: str
    anchor_text: str
    matched_text: str | None = None
    turn_id: str | None = None
    status: VerificationStatus


class AnalysisMetrics(BaseAppModel):
    rep_word_count: int
    customer_word_count: int
    rep_talk_ratio: float
    customer_talk_ratio: float
    meddic_completeness_score: float
    total_questions: int
    open_question_count: int
    closed_question_count: int


class CompletenessScore(BaseAppModel):
    score: float = Field(ge=0, le=100)
    high_confidence_count: int
    at_least_medium_count: int
    gap_elements: list[str] = Field(default_factory=list)


class JudgeResult(BaseAppModel):
    overall_support_strength: str
    confidence_review: str
    flags: list[str] = Field(default_factory=list)
    should_downgrade: list[str] = Field(default_factory=list)


class DealNextStep(BaseAppModel):
    owner: str
    action: str
    timing: str | None = None


class CompetitorSignal(BaseAppModel):
    name: str
    context: str
    handled_well: bool = False


class DealIntelligence(BaseAppModel):
    risk_score: int = Field(ge=1, le=10)
    risk_factors: list[str] = Field(default_factory=list)
    buying_signals: list[str] = Field(default_factory=list)
    next_steps: list[DealNextStep] = Field(default_factory=list)
    competitor_mentions: list[CompetitorSignal] = Field(default_factory=list)
    likely_stage: str
    crm_stage_guess: str


class AnalysisResult(BaseAppModel):
    id: int | None = None
    job_id: str | None = None
    analysis_id: str
    created_at: datetime
    provider_used: str | None = None
    request: AnalyzeTranscriptRequest
    transcript: CanonicalTranscript
    meddic: MEDDICResult
    completeness: CompletenessScore | None = None
    objections: ObjectionResult
    verified_evidence: list[VerifiedEvidence]
    metrics: AnalysisMetrics
    deal_intelligence: DealIntelligence
    coaching: CoachingResult
    judge_result: JudgeResult | None = None
    status: AnalysisStatus = AnalysisStatus.COMPLETED
    errors: list[str] = Field(default_factory=list)


class AnalyzeResponse(SuccessResponse):
    analysis: AnalysisResult


class AnalyzeRequest(BaseAppModel):
    transcript: str = Field(min_length=50, max_length=50000)
    source_name: str | None = None


class JobResponse(BaseAppModel):
    job_id: str
    analysis_id: int | None = None
    status: AnalysisStatus
    message: str
