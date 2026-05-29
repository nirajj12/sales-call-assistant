"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import AppFooter from "@/components/intellify/AppFooter";
import WorkflowTimeline from "@/components/intellify/WorkflowTimeline";
import DashboardSummaryCards from "@/components/intellify/DashboardSummaryCards";
import OverviewTab from "@/components/intellify/OverviewTab";
import MEDDICTab from "@/components/intellify/MEDDICTab";
import ObjectionsTab from "@/components/intellify/ObjectionsTab";
import DealIntelTab from "@/components/intellify/DealIntelTab";
import CoachingTab from "@/components/intellify/CoachingTab";
import TranscriptTab from "@/components/intellify/TranscriptTab";

const TERMINAL = ["completed", "failed", "partial"];
const REPORT_TABS = [
  "Overview",
  "MEDDIC",
  "Objections",
  "Coaching",
  "Deal Intel",
  "Evidence",
];

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function statusClasses(status) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "partial") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "running") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function AnalysisPage({ params }) {
  const jobId = params.id;
  const [analysisId, setAnalysisId] = useState(null);
  const [selectedTurnId, setSelectedTurnId] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");

  const { data: jobData, isError: jobError } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const response = await fetch(`/api/proxy/jobs/${jobId}`);
      if (!response.ok) throw new Error("Job not found");
      return response.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return TERMINAL.includes(status) ? false : 3000;
    },
    enabled: Boolean(jobId),
  });

  useEffect(() => {
    if (jobData?.analysis_id && !analysisId) {
      setAnalysisId(jobData.analysis_id);
    }
  }, [jobData, analysisId]);

  const { data: analysisData, isLoading: analysisLoading } = useQuery({
    queryKey: ["analysis", analysisId],
    queryFn: async () => {
      const response = await fetch(`/api/proxy/analysis/${analysisId}`);
      if (!response.ok) throw new Error("Analysis not found");
      return response.json();
    },
    enabled: Boolean(analysisId),
  });

  const jobStatus = jobData?.status || "pending";
  const analysis = analysisData?.data;
  const isTerminal = TERMINAL.includes(jobStatus);
  const isFailed = jobStatus === "failed";

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-4 no-underline">
            <div className="brand-orb flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-[0_14px_34px_rgba(99,102,241,0.24)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="display-font truncate text-lg font-bold tracking-[-0.04em]">
                SalesSignal AI
              </p>
              <p className="truncate text-sm text-slate-500">
                {analysis?.source_name || jobId}
              </p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold capitalize",
                statusClasses(jobStatus),
              )}
            >
              {jobStatus}
            </span>
            <a
              href="/"
              className="button-elevated inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              <ArrowLeft className="h-4 w-4" />
              New analysis
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pt-8 sm:px-6 lg:px-8">
        {!isTerminal && (
          <section className="space-y-6">
            <div className="surface-card rounded-[32px] border border-white/60 bg-white/90 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                <Clock3 className="h-3.5 w-3.5" />
                {jobStatus === "pending" ? "Queued analysis" : "Analysis running"}
              </div>
              <h1 className="display-font text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                {jobStatus === "pending"
                  ? "Your transcript has entered the queue."
                  : "Your analysis report is being prepared."}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                This page refreshes automatically while the job completes.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Job ID
                  </p>
                  <p className="mt-2 font-mono text-sm text-slate-700">{jobId}</p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Polling
                  </p>
                  <p className="mt-2 text-sm text-slate-700">Every 3 seconds</p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Status note
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {jobData?.message || "Waiting for the next backend update."}
                  </p>
                </div>
              </div>
            </div>

            <WorkflowTimeline status={jobStatus} />
          </section>
        )}

        {isFailed && (
            <section className="surface-card rounded-[36px] border border-rose-200 bg-rose-50/80 p-8 shadow-[0_24px_60px_rgba(244,63,94,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="display-font text-3xl font-bold tracking-[-0.04em] text-rose-950">
                  Analysis failed
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-700">
                  {jobData?.message ||
                    "The backend pipeline encountered an unrecoverable error before the report could be saved."}
                </p>
                <a
                  href="/"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rose-800"
                >
                  Try another transcript
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>
        )}

        {jobError && (
            <section className="surface-card rounded-[36px] border border-rose-200 bg-rose-50/80 p-8 shadow-[0_24px_60px_rgba(244,63,94,0.08)]">
            <h2 className="display-font text-3xl font-bold tracking-[-0.04em] text-rose-950">
              Could not load job status
            </h2>
            <p className="mt-3 text-sm leading-6 text-rose-700">
              Make sure the backend is running and the proxy routes are configured correctly.
            </p>
          </section>
        )}

        {isTerminal && !isFailed && (
          <section className="space-y-6">
            {(jobStatus === "partial" || analysis?.errors?.length > 0) && (
              <div className="surface-card rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 text-amber-900 shadow-[0_16px_32px_rgba(245,158,11,0.08)]">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold">Partial analysis</p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Some backend steps returned errors. Results are still available,
                      but parts of the report may be incomplete.
                    </p>
                    {analysis?.errors?.map((error, index) => (
                      <p key={index} className="mt-2 text-sm text-amber-800">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <section
              id="overview"
              className="surface-card rounded-[32px] border border-white/60 bg-white/90 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.06)]"
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold capitalize",
                    statusClasses(analysis?.status || jobStatus),
                  )}
                >
                  {analysis?.status || jobStatus}
                </span>
                {analysis?.provider_used && (
                  <span className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm capitalize text-slate-600">
                    Provider: {analysis.provider_used}
                  </span>
                )}
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Analysis report
              </p>
              <h1 className="display-font text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                {analysis?.source_name || "Sales call analysis"}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Review qualification, objections, coaching, deal signals, and supporting transcript evidence in one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-sm text-slate-500">
                {analysis?.created_at && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                    {new Date(analysis.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-mono">
                  {jobId}
                </span>
                {analysis?.provider_used && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 capitalize">
                    {analysis.provider_used}
                  </span>
                )}
              </div>
            </section>

            <DashboardSummaryCards analysis={analysis} />

            <div className="surface-card rounded-[24px] border border-white/60 bg-white/85 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="flex gap-2 overflow-x-auto">
                {REPORT_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "tab-chip whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium",
                      activeTab === tab
                        ? "bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.14)]"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {analysisLoading ? (
              <div className="grid gap-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="skeleton h-52 rounded-[28px]" />
                ))}
              </div>
            ) : (
              <div className="animate-fadein">
                {activeTab === "Overview" && (
                  <OverviewTab
                    analysis={analysis}
                    onSelectTurnId={(turnId) => {
                      setSelectedTurnId(turnId);
                      setActiveTab("Evidence");
                    }}
                  />
                )}

                {activeTab === "MEDDIC" && (
                  <MEDDICTab
                    meddic={analysis?.meddic}
                    completeness={analysis?.completeness}
                    judgeResult={analysis?.judge_result}
                    verifiedEvidence={analysis?.verified_evidence || []}
                    onSelectTurnId={(turnId) => {
                      setSelectedTurnId(turnId);
                      setActiveTab("Evidence");
                    }}
                  />
                )}

                {activeTab === "Objections" && (
                  <ObjectionsTab
                    objections={analysis?.objections}
                    onSelectTurnId={(turnId) => {
                      setSelectedTurnId(turnId);
                      setActiveTab("Evidence");
                    }}
                  />
                )}

                {activeTab === "Coaching" && (
                  <CoachingTab
                    coaching={analysis?.coaching}
                    onSelectTurnId={(turnId) => {
                      setSelectedTurnId(turnId);
                      setActiveTab("Evidence");
                    }}
                  />
                )}

                {activeTab === "Deal Intel" && (
                  <DealIntelTab dealIntelligence={analysis?.deal_intelligence} />
                )}

                {activeTab === "Evidence" && (
                  <TranscriptTab
                    transcript={analysis}
                    verifiedEvidence={analysis?.verified_evidence || []}
                    selectedTurnId={selectedTurnId}
                    onSelectTurnId={setSelectedTurnId}
                  />
                )}
              </div>
            )}
          </section>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
