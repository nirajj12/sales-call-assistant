from enum import Enum

from pydantic import BaseModel, Field


class SpeakerRole(str, Enum):
    REP = "rep"
    CUSTOMER = "customer"
    UNKNOWN = "unknown"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MISSING = "missing"


class VerificationStatus(str, Enum):
    VERIFIED_EXACT = "verified_exact"
    VERIFIED_FUZZY = "verified_fuzzy"
    UNVERIFIED = "unverified"


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class BaseAppModel(BaseModel):
    model_config = {"populate_by_name": True}


class ErrorResponse(BaseAppModel):
    success: bool = False
    error: dict[str, str]


class SuccessResponse(BaseAppModel):
    success: bool = True


class QuoteAnchor(BaseAppModel):
    text: str = Field(min_length=1)
    speaker_role: SpeakerRole | None = None
