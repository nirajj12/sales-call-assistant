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
import MEDDICTab from "@/components/intellify/MEDDICTab";
import ObjectionsTab from "@/components/intellify/ObjectionsTab";
import DealIntelTab from "@/components/intellify/DealIntelTab";
import CoachingTab from "@/components/intellify/CoachingTab";
import TranscriptTab from "@/components/intellify/TranscriptTab";

const TERMINAL = ["completed", "failed", "partial"];

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

function SectionNav() {
  const items = [
    ["overview", "Overview"],
    ["meddic", "MEDDIC"],
    ["objections", "Objections"],
    ["coaching", "Coaching"],
    ["deal-intel", "Deal Intel"],
    ["evidence", "Evidence"],
  ];

  return (
    <div className="sticky top-[72px] z-30 mb-6 overflow-x-auto rounded-[24px] border border-white/60 bg-white/80 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="flex gap-2">
        {items.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function AnalysisPage({ params }) {
  const jobId = params.id;
  const [analysisId, setAnalysisId] = useState(null);
  const [selectedTurnId, setSelectedTurnId] = useState(null);

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
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-[0_14px_34px_rgba(99,102,241,0.24)]">
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
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
            <div className="rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,255,255,0.76))] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
                <Clock3 className="h-3.5 w-3.5" />
                {jobStatus === "pending" ? "Queued analysis" : "Analysis running"}
              </div>
              <h1 className="display-font text-4xl font-bold tracking-[-0.05em] text-slate-950">
                {jobStatus === "pending"
                  ? "Your transcript has entered the queue."
                  : "Your SalesSignal AI report is being prepared."}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                The page refreshes automatically while the backend moves through
                transcript normalization, extraction, evidence verification, judging,
                coaching, and persistence.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Job ID
                  </p>
                  <p className="mt-2 font-mono text-sm text-slate-700">{jobId}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Polling
                  </p>
                  <p className="mt-2 text-sm text-slate-700">Every 3 seconds</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
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
          <section className="rounded-[36px] border border-rose-200 bg-rose-50/80 p-8 shadow-[0_24px_60px_rgba(244,63,94,0.08)]">
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
          <section className="rounded-[36px] border border-rose-200 bg-rose-50/80 p-8 shadow-[0_24px_60px_rgba(244,63,94,0.08)]">
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
              <div className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-5 text-amber-900 shadow-[0_16px_32px_rgba(245,158,11,0.08)]">
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
              className="rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,255,255,0.76))] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]"
            >
              <div className="mb-5 flex flex-wrap items-center gap-3">
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

              <h1 className="display-font text-4xl font-bold tracking-[-0.06em] text-slate-950">
                {analysis?.source_name || "Sales call analysis"}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                Review MEDDIC qualification, buyer objections, coaching signals,
                forecast indicators, and transcript evidence in one polished report.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Created
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {analysis?.created_at
                      ? new Date(analysis.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown"}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Job ID
                  </p>
                  <p className="mt-2 font-mono text-sm text-slate-700">{jobId}</p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Analysis ID
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{analysis?.id || "Pending"}</p>
                </div>
              </div>
            </section>

            <DashboardSummaryCards analysis={analysis} />
            <SectionNav />

            {analysisLoading ? (
              <div className="grid gap-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="skeleton h-52 rounded-[28px]" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <MEDDICTab
                  meddic={analysis?.meddic}
                  completeness={analysis?.completeness}
                  judgeResult={analysis?.judge_result}
                  verifiedEvidence={analysis?.verified_evidence || []}
                  onSelectTurnId={setSelectedTurnId}
                />

                <ObjectionsTab
                  objections={analysis?.objections}
                  onSelectTurnId={setSelectedTurnId}
                />

                <CoachingTab
                  coaching={analysis?.coaching}
                  onSelectTurnId={setSelectedTurnId}
                />

                <DealIntelTab dealIntelligence={analysis?.deal_intelligence} />

                <TranscriptTab
                  transcript={analysis}
                  verifiedEvidence={analysis?.verified_evidence || []}
                  selectedTurnId={selectedTurnId}
                  onSelectTurnId={setSelectedTurnId}
                />
              </div>
            )}
          </section>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
