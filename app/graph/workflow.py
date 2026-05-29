from langgraph.graph import END, START, StateGraph

from app.graph.nodes import (
    coaching_deal_node,
    extraction_gate_node,
    judge_node,
    meddic_extractor_node,
    meddic_validator_node,
    normaliser_node,
    objection_extractor_node,
    objection_validator_node,
    persist_node,
    quote_verifier_node,
    transcript_loader_node,
)
from app.graph.routes import route_after_loader, route_after_normaliser
from app.graph.state import AnalysisState


def build_graph() -> StateGraph:
    graph = StateGraph(AnalysisState)

    graph.add_node("transcript_loader", transcript_loader_node)
    graph.add_node("normaliser", normaliser_node)
    graph.add_node("extraction_gate", extraction_gate_node)
    graph.add_node("meddic_extractor", meddic_extractor_node)
    graph.add_node("objection_extractor", objection_extractor_node)
    graph.add_node("meddic_validator", meddic_validator_node)
    graph.add_node("objection_validator", objection_validator_node)
    graph.add_node("quote_verifier", quote_verifier_node)
    graph.add_node("judge_llm", judge_node)
    graph.add_node("coaching_deal", coaching_deal_node)
    graph.add_node("persist", persist_node)

    graph.add_edge(START, "transcript_loader")
    graph.add_conditional_edges(
        "transcript_loader",
        route_after_loader,
        {"normaliser": "normaliser", "persist": "persist"},
    )
    graph.add_conditional_edges(
        "normaliser",
        route_after_normaliser,
        {"extraction_gate": "extraction_gate", "persist": "persist"},
    )

    graph.add_edge("extraction_gate", "meddic_extractor")
    graph.add_edge("extraction_gate", "objection_extractor")
    graph.add_edge("meddic_extractor", "meddic_validator")
    graph.add_edge("objection_extractor", "objection_validator")

    graph.add_edge("meddic_validator", "quote_verifier")
    graph.add_edge("objection_validator", "quote_verifier")

    graph.add_edge("quote_verifier", "judge_llm")
    graph.add_edge("quote_verifier", "coaching_deal")

    graph.add_edge("judge_llm", "persist")
    graph.add_edge("coaching_deal", "persist")

    graph.add_edge("persist", END)
    return graph


compiled_graph = build_graph().compile()
