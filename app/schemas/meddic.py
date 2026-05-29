from pydantic import Field

from app.schemas.common import BaseAppModel, ConfidenceLevel


class MEDDICElement(BaseAppModel):
    label: str
    value: str | None = None
    confidence: ConfidenceLevel = ConfidenceLevel.MISSING
    evidence_anchor: str | None = None
    turn_id: str | None = None
    gap_flag: bool = False


class MEDDICResult(BaseAppModel):
    metrics: MEDDICElement = Field(default_factory=lambda: MEDDICElement(label="metrics"))
    economic_buyer: MEDDICElement = Field(
        default_factory=lambda: MEDDICElement(label="economic_buyer")
    )
    decision_criteria: MEDDICElement = Field(
        default_factory=lambda: MEDDICElement(label="decision_criteria")
    )
    decision_process: MEDDICElement = Field(
        default_factory=lambda: MEDDICElement(label="decision_process")
    )
    identify_pain: MEDDICElement = Field(
        default_factory=lambda: MEDDICElement(label="identify_pain")
    )
    champion: MEDDICElement = Field(default_factory=lambda: MEDDICElement(label="champion"))

