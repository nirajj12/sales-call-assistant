from app.graph.state import AnalysisState
from app.schemas.common import AnalysisStatus


def route_after_loader(state: AnalysisState) -> str:
    if state.get("status") == AnalysisStatus.FAILED:
        return "persist"
    return "normaliser"


def route_after_normaliser(state: AnalysisState) -> str:
    if state.get("status") == AnalysisStatus.FAILED:
        return "persist"
    return "extraction_gate"
