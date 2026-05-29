from __future__ import annotations

import operator
from typing import Annotated

from typing_extensions import TypedDict

from app.schemas.analysis import (
    CoachingResult,
    CompletenessScore,
    DealIntelligence,
    JudgeResult,
    VerifiedEvidence,
)
from app.schemas.common import AnalysisStatus
from app.schemas.meddic import MEDDICResult
from app.schemas.objection import Objection
from app.schemas.transcript import CanonicalTranscript


class AnalysisState(TypedDict, total=False):
    analysis_id: str
    job_id: str
    source_name: str | None
    raw_text: str
    transcript: CanonicalTranscript
    meddic: MEDDICResult | None
    meddic_raw: dict | None
    objections: list[Objection] | None
    objections_raw: list[dict] | None
    meddic_validated: bool
    objections_validated: bool
    evidence_index: list[VerifiedEvidence]
    judge_result: JudgeResult | None
    deal_intelligence: DealIntelligence | None
    coaching: CoachingResult | None
    completeness: CompletenessScore | None
    status: AnalysisStatus
    errors: Annotated[list[str], operator.add]
    db_id: int | None
