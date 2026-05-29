"use client";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  MessageSquareQuote,
  Save,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";

const STEPS = [
  { key: "received", label: "Transcript received", icon: FileText },
  { key: "normalized", label: "Transcript normalized", icon: MessageSquareQuote },
  { key: "meddic", label: "MEDDIC extraction completed", icon: Target },
  { key: "objections", label: "Objection extraction completed", icon: Sparkles },
  { key: "verification", label: "Quote verification completed", icon: ShieldCheck },
  { key: "judge", label: "Judge review completed", icon: Scale },
  { key: "coaching", label: "Coaching generated", icon: Sparkles },
  { key: "saved", label: "Results saved", icon: Save },
];

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function resolveStatus(status, index, activeIndex) {
  if (status === "completed" || status === "partial") return "completed";
  if (status === "failed") {
    if (index < activeIndex) return "completed";
    if (index === activeIndex) return "failed";
    return "pending";
  }
  if (index < activeIndex) return "completed";
  if (index === activeIndex) return "running";
  return "pending";
}

export default function WorkflowTimeline({ status = "pending" }) {
  const [activeIndex, setActiveIndex] = useState(status === "pending" ? 0 : 1);

  useEffect(() => {
    if (status !== "running") {
      if (status === "pending") setActiveIndex(0);
      if (status === "failed") {
        setActiveIndex((current) => Math.min(Math.max(current, 1), STEPS.length - 1));
      }
      if (status === "completed" || status === "partial") {
        setActiveIndex(STEPS.length);
      }
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => Math.min(current + 1, STEPS.length - 1));
    }, 1800);

    return () => clearInterval(timer);
  }, [status]);

  const completeCount =
    status === "completed" || status === "partial"
      ? STEPS.length
      : Math.max(Math.min(activeIndex, STEPS.length - 1), 0);

  return (
    <div className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            LangGraph workflow
          </p>
          <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
            Analysis pipeline progress
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Follow each processing stage while the backend moves from transcript
            ingestion to saved results.
          </p>
        </div>
        <div className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
          {completeCount}/{STEPS.length} steps complete
        </div>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 transition-all duration-500"
          style={{
            width: `${Math.max((completeCount / STEPS.length) * 100, status === "pending" ? 8 : 14)}%`,
          }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {STEPS.map((step, index) => {
          const itemStatus = resolveStatus(status, index, activeIndex);
          const Icon = step.icon;
          const statusLabel =
            itemStatus === "running"
              ? "running"
              : itemStatus === "completed"
                ? "completed"
                : itemStatus === "failed"
                  ? "failed"
                  : "pending";

          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-4 rounded-[24px] border p-4 transition",
                itemStatus === "completed" &&
                  "border-emerald-200 bg-emerald-50/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                itemStatus === "running" &&
                  "border-indigo-200 bg-indigo-50/80 shadow-[0_0_0_4px_rgba(99,102,241,0.08)]",
                itemStatus === "failed" &&
                  "border-rose-200 bg-rose-50/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                itemStatus === "pending" && "border-slate-200 bg-white",
              )}
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl",
                  itemStatus === "completed" && "bg-emerald-500 text-white",
                  itemStatus === "running" && "bg-indigo-600 text-white",
                  itemStatus === "failed" && "bg-rose-500 text-white",
                  itemStatus === "pending" && "bg-slate-100 text-slate-500",
                )}
              >
                {itemStatus === "completed" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : itemStatus === "running" ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : itemStatus === "failed" ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                <p
                  className={cn(
                    "mt-1 text-xs font-medium uppercase tracking-[0.18em]",
                    itemStatus === "completed" && "text-emerald-700",
                    itemStatus === "running" && "text-indigo-700",
                    itemStatus === "failed" && "text-rose-700",
                    itemStatus === "pending" && "text-slate-400",
                  )}
                >
                  {statusLabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
