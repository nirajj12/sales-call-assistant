import re
from difflib import SequenceMatcher


QUESTION_PREFIXES = ("what", "how", "why", "when", "who", "where", "walk me", "tell me")


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def word_count(text: str) -> int:
    return len([token for token in normalize_whitespace(text).split(" ") if token])


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def is_open_question(text: str) -> bool:
    lowered = text.lower().strip()
    return lowered.endswith("?") and lowered.startswith(QUESTION_PREFIXES)


def is_question(text: str) -> bool:
    return text.strip().endswith("?")

