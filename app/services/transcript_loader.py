from pathlib import Path

from app.core.config import get_settings
from app.core.exceptions import TranscriptParseException
from app.schemas.transcript import AnalyzeTranscriptRequest, TranscriptLoadResult


class TranscriptLoader:
    def __init__(self) -> None:
        self.settings = get_settings()

    def load(self, request: AnalyzeTranscriptRequest) -> TranscriptLoadResult:
        if request.transcript_text and request.transcript_text.strip():
            text = request.transcript_text.strip()
            self._validate_length(text)
            return TranscriptLoadResult(
                source_name=request.transcript_name or "inline_transcript",
                transcript_text=text,
                source_type=request.source_type,
            )

        if request.transcript_path:
            path = Path(request.transcript_path)
            if not path.is_absolute():
                path = self.settings.transcript_dir / path
            if not path.exists():
                raise TranscriptParseException(f"Transcript file not found: {path}")
            text = path.read_text(encoding="utf-8").strip()
            self._validate_length(text)
            return TranscriptLoadResult(
                source_name=path.name,
                transcript_text=text,
                source_type="file",
            )

        raise TranscriptParseException(
            "Provide either transcript_text or transcript_path for analysis."
        )

    async def load_upload(self, filename: str, content: bytes) -> TranscriptLoadResult:
        if not filename.lower().endswith(".txt"):
            raise TranscriptParseException("Only .txt transcript uploads are supported right now.")
        try:
            text = content.decode("utf-8").strip()
        except UnicodeDecodeError:
            text = content.decode("latin-1").strip()
        self._validate_length(text)
        return TranscriptLoadResult(
            source_name=filename,
            transcript_text=text,
            source_type="upload",
        )

    def _validate_length(self, text: str) -> None:
        if len(text) > self.settings.max_transcript_chars:
            raise TranscriptParseException(
                f"Transcript exceeds max size of {self.settings.max_transcript_chars} characters."
            )
