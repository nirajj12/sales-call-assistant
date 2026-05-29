from pydantic import Field

from app.schemas.common import BaseAppModel, ConfidenceLevel


class Objection(BaseAppModel):
    objection_id: str
    text: str
    category: str
    explicitness: str
    handling_quality: str
    suggested_response: str
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    evidence_anchor: str | None = None
    turn_id: str | None = None


class ObjectionResult(BaseAppModel):
    objections: list[Objection] = Field(default_factory=list)

