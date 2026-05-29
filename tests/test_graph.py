from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.graph.workflow import compiled_graph
from app.schemas.common import AnalysisStatus


SAMPLE_TRANSCRIPT = """Rep: Thanks for joining. What's the biggest challenge right now?
Customer: We spend 20 hours a week on manual reporting and it's killing our team.
Rep: Who's involved when you evaluate a new tool?
Customer: I shortlist, but finance head approves anything above 50k.
Rep: What would good look like?
Customer: Real-time dashboards and integration with our AWS setup."""


@pytest.mark.asyncio
async def test_graph_runs_full_pipeline():
    mock_meddic_raw = {
        "metrics": {"value": "20 hours a week", "confidence": "high", "evidence_anchor": "20 hours a week", "gap_flag": False},
        "economic_buyer": {"value": "finance head", "confidence": "medium", "evidence_anchor": "finance head approves", "gap_flag": False},
        "decision_criteria": {"value": "Real-time dashboards, AWS integration", "confidence": "high", "evidence_anchor": "Real-time dashboards", "gap_flag": False},
        "decision_process": {"value": None, "confidence": "missing", "evidence_anchor": None, "gap_flag": True},
        "identify_pain": {"value": "manual reporting pain", "confidence": "high", "evidence_anchor": "killing our team", "gap_flag": False},
        "champion": {"value": None, "confidence": "missing", "evidence_anchor": None, "gap_flag": True},
    }
    mock_objections_raw = [
        {
            "text": "Budget gate above 50k",
            "category": "authority",
            "explicitness": "explicit",
            "handling_quality": "needs_follow_up",
            "evidence_anchor": "finance head approves",
            "suggested_response": "Build the CFO case together.",
        }
    ]
    mock_judge = {
        "overall_support_strength": "moderate",
        "confidence_review": "Good support overall.",
        "flags": [],
        "should_downgrade": [],
    }
    mock_row = MagicMock()
    mock_row.id = 42

    with patch(
        "app.pipeline.meddic_extractor.MEDDICExtractor.extract_raw",
        new_callable=AsyncMock,
        return_value=mock_meddic_raw,
    ), patch(
        "app.pipeline.objection_extractor.ObjectionExtractor.extract_raw",
        new_callable=AsyncMock,
        return_value=mock_objections_raw,
    ), patch(
        "app.pipeline.judge.JudgeLLM.judge",
        new_callable=AsyncMock,
        return_value=MagicMock(**mock_judge),
    ), patch(
        "app.services.llm_client.LLMClient.extract_deal_intelligence",
        new_callable=AsyncMock,
    ) as mock_deal, patch(
        "app.db.database.AnalysisRepository.save",
        new_callable=AsyncMock,
        return_value=mock_row,
    ):
        mock_deal.return_value = MagicMock(
            risk_score=5,
            risk_factors=["No champion"],
            buying_signals=["Customer shared pain"],
            next_steps=[],
            competitor_mentions=[],
            likely_stage="discovery",
            crm_stage_guess="qualification",
            model_dump=lambda: {
                "risk_score": 5,
                "risk_factors": ["No champion"],
                "buying_signals": ["Customer shared pain"],
                "next_steps": [],
                "competitor_mentions": [],
                "likely_stage": "discovery",
                "crm_stage_guess": "qualification",
            },
        )
        final_state = await compiled_graph.ainvoke(
            {
                "analysis_id": "test-001",
                "job_id": "job-001",
                "raw_text": SAMPLE_TRANSCRIPT,
                "source_name": "Test Call",
                "status": AnalysisStatus.RUNNING,
                "errors": [],
            }
        )

    assert final_state.get("transcript") is not None
    assert final_state.get("meddic") is not None
    assert final_state.get("db_id") == 42


@pytest.mark.asyncio
async def test_graph_fails_gracefully_on_short_transcript():
    mock_row = MagicMock()
    mock_row.id = 1
    with patch(
        "app.db.database.AnalysisRepository.save",
        new_callable=AsyncMock,
        return_value=mock_row,
    ):
        final_state = await compiled_graph.ainvoke(
            {
                "analysis_id": "test-002",
                "job_id": "job-002",
                "raw_text": "Hi.",
                "status": AnalysisStatus.RUNNING,
                "errors": [],
            }
        )
    assert final_state.get("status") in {AnalysisStatus.FAILED, AnalysisStatus.PARTIAL}
