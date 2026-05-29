"use client";
import { useState } from "react";
import ConfidencePill from "./ConfidencePill";

const FILTERS = ["All", "Pricing", "Security", "Timing", "Authority", "Competitor"];

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function matchesFilter(filter, objection) {
  const text = `${objection.category || ""} ${objection.text || ""}`.toLowerCase();

  if (filter === "All") return true;
  if (filter === "Pricing") return ["price", "budget", "pricing"].some((word) => text.includes(word));
  if (filter === "Security") return text.includes("security");
  if (filter === "Timing") return ["timing", "timeline", "later", "quarter", "change_management"].some((word) => text.includes(word));
  if (filter === "Authority") return ["authority", "buyer", "approval", "economic buyer", "sign-off"].some((word) => text.includes(word));
  if (filter === "Competitor") return ["competition", "competitor", "alternative"].some((word) => text.includes(word));
  return true;
}

function handlingClass(handlingQuality) {
  if (handlingQuality === "handled") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (handlingQuality === "not_addressed") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function categoryClass(category) {
  const value = (category || "").toLowerCase();
  if (["price", "budget"].includes(value)) return "border-amber-200 bg-amber-50 text-amber-700";
  if (value.includes("security")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value.includes("competition")) return "border-indigo-200 bg-indigo-50 text-indigo-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function ObjectionCard({ objection, onSelectTurnId }) {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold capitalize", categoryClass(objection.category))}>
            {objection.category || "General"}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium capitalize text-slate-600">
            {objection.explicitness || "implicit"}
          </span>
          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", handlingClass(objection.handling_quality))}>
            {(objection.handling_quality || "needs_follow_up").replaceAll("_", " ")}
          </span>
        </div>
        <ConfidencePill level={objection.confidence || "medium"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Objection text
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">“{objection.text}”</p>
        </div>

        <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Suggested response
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            {objection.suggested_response || "No response recommendation available."}
          </p>
        </div>
      </div>

      {objection.evidence_anchor && (
        <button
          type="button"
          onClick={() => objection.turn_id && onSelectTurnId?.(objection.turn_id)}
          className={cn(
            "mt-4 block w-full rounded-[20px] border border-indigo-100 bg-indigo-50/60 p-4 text-left transition",
            objection.turn_id && "hover:border-indigo-200 hover:bg-indigo-50",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Evidence quote
          </p>
          <p className="mt-2 text-sm italic leading-6 text-slate-700">“{objection.evidence_anchor}”</p>
          {objection.turn_id && (
            <p className="mt-3 font-mono text-xs text-indigo-600">Jump to {objection.turn_id}</p>
          )}
        </button>
      )}
    </div>
  );
}

export default function ObjectionsTab({ objections = [], onSelectTurnId }) {
  const list =
    objections?.objections || (Array.isArray(objections) ? objections : []);
  const [activeFilter, setActiveFilter] = useState("All");

  if (!list.length) {
    return (
      <section id="objections" className="rounded-[32px] border border-slate-200/70 bg-white/90 p-10 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
        <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
          Objections
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          No objection signals were extracted from this transcript.
        </p>
      </section>
    );
  }

  const filteredList = list.filter((objection) => matchesFilter(activeFilter, objection));

  return (
    <section id="objections" className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Objections
          </p>
          <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
            Friction points and handling quality
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review buyer concerns, how clearly they were stated, and how well they were handled.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          {filteredList.length} of {list.length} objections
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              activeFilter === filter
                ? "bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.14)]"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredList.map((objection) => (
          <ObjectionCard
            key={objection.objection_id}
            objection={objection}
            onSelectTurnId={onSelectTurnId}
          />
        ))}
      </div>
    </section>
  );
}
