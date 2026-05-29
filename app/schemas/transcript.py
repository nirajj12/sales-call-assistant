from pydantic import Field

from app.schemas.common import BaseAppModel, SpeakerRole


class CanonicalTurn(BaseAppModel):
    turn_id: str
    speaker_label: str
    speaker_role: SpeakerRole
    text: str = Field(min_length=1)
    word_count: int = Field(ge=0)


class CanonicalTranscript(BaseAppModel):
    transcript_id: str
    source_name: str | None = None
    raw_text: str
    turns: list[CanonicalTurn]
    rep_turn_count: int = Field(ge=0)
    customer_turn_count: int = Field(ge=0)


class AnalyzeTranscriptRequest(BaseAppModel):
    transcript_text: str | None = None
    transcript_name: str | None = None
    transcript_path: str | None = None
    source_type: str = "inline"


class TranscriptLoadResult(BaseAppModel):
    source_name: str
    transcript_text: str
    source_type: str = "inline"
