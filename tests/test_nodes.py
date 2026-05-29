from app.graph.nodes import (
    meddic_validator_node,
    normaliser_node,
    objection_validator_node,
    transcript_loader_node,
)
from app.schemas.common import AnalysisStatus


def test_loader_fails_on_short_text():
    result = transcript_loader_node({"raw_text": "hi", "analysis_id": "t1", "errors": []})
    assert result.get("status") == AnalysisStatus.FAILED


def test_loader_passes_valid_text():
    text = "Rep: Hello.\nCustomer: This is a longer response that clears the minimum length requirement."
    assert transcript_loader_node({"raw_text": text, "analysis_id": "t1", "errors": []}) == {}


def test_normaliser_succeeds():
    state = {
        "analysis_id": "t2",
        "raw_text": (
            "Rep: What is your pain?\n"
            "Customer: We lose 20 hours weekly to reporting.\n"
            "Rep: Who decides?\n"
            "Customer: Finance head."
        ),
        "errors": [],
    }
    result = normaliser_node(state)
    assert "transcript" in result
    assert len(result["transcript"].turns) == 4


def test_meddic_validator_fails_on_missing_keys():
    result = meddic_validator_node(
        {"analysis_id": "t4", "meddic_raw": {"metrics": {"value": "x"}}, "errors": []}
    )
    assert result.get("meddic_validated") is False


def test_objection_validator_succeeds():
    result = objection_validator_node(
        {
            "analysis_id": "t5",
            "objections_raw": [
                {
                    "text": "Price is too high",
                    "category": "price",
                    "explicitness": "explicit",
                    "handling_quality": "needs_follow_up",
                    "evidence_anchor": "price is too high",
                    "suggested_response": "Let's quantify ROI.",
                }
            ],
            "errors": [],
        }
    )
    assert result.get("objections_validated") is True
