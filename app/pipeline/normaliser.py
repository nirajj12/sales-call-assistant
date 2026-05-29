import re
from uuid import uuid4

from app.core.exceptions import TranscriptParseException
from app.schemas.common import SpeakerRole
from app.schemas.transcript import CanonicalTranscript, CanonicalTurn
from app.utils.text_utils import normalize_whitespace, word_count


SPEAKER_PATTERNS: list[tuple[re.Pattern[str], SpeakerRole]] = [
    (re.compile(r"^(rep|ae|sales|account executive)\b", re.IGNORECASE), SpeakerRole.REP),
    (
        re.compile(r"^(customer|prospect|buyer|client|lead)\b", re.IGNORECASE),
        SpeakerRole.CUSTOMER,
    ),
]


class TranscriptNormaliser:
    def normalize(self, transcript_text: str, source_name: str | None = None) -> CanonicalTranscript:
        lines = [line.strip() for line in transcript_text.splitlines() if line.strip()]
        turns: list[CanonicalTurn] = []

        for idx, line in enumerate(lines, start=1):
            if ":" not in line:
                raise TranscriptParseException(
                    f"Invalid transcript line {idx}. Expected 'Speaker: text' format."
                )
            label, text = line.split(":", 1)
            speaker_label = normalize_whitespace(label)
            turn_text = normalize_whitespace(text)
            if not turn_text:
                continue
            turns.append(
                CanonicalTurn(
                    turn_id=f"t{idx}",
                    speaker_label=speaker_label,
                    speaker_role=self._resolve_role(speaker_label),
                    text=turn_text,
                    word_count=word_count(turn_text),
                )
            )

        if not turns:
            raise TranscriptParseException("No valid transcript turns were found.")

        rep_turn_count = sum(1 for turn in turns if turn.speaker_role == SpeakerRole.REP)
        customer_turn_count = sum(
            1 for turn in turns if turn.speaker_role == SpeakerRole.CUSTOMER
        )
        if rep_turn_count == 0 or customer_turn_count == 0:
            raise TranscriptParseException(
                "Transcript must contain at least one rep turn and one customer turn."
            )

        return CanonicalTranscript(
            transcript_id=str(uuid4()),
            source_name=source_name,
            raw_text=normalize_whitespace(transcript_text),
            turns=turns,
            rep_turn_count=rep_turn_count,
            customer_turn_count=customer_turn_count,
        )

    def _resolve_role(self, speaker_label: str) -> SpeakerRole:
        for pattern, role in SPEAKER_PATTERNS:
            if pattern.match(speaker_label):
                return role
        return SpeakerRole.UNKNOWN

