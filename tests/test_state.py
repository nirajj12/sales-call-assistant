import operator
from typing import get_type_hints

from app.graph.state import AnalysisState


def test_errors_uses_operator_add_reducer():
    hints = get_type_hints(AnalysisState, include_extras=True)
    metadata = getattr(hints["errors"], "__metadata__", ())
    assert operator.add in metadata
