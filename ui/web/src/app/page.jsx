"use client";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  FileText,
  History,
  LoaderCircle,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Waves,
} from "lucide-react";
import AnalysisHistoryTable from "@/components/intellify/AnalysisHistoryTable";
import AppFooter from "@/components/intellify/AppFooter";

const MAX_CHARS = 50000;
const MIN_CHARS = 50;

const DEMO_TRANSCRIPT = `Rep: Thanks for joining today. Can you walk me through what's driving the evaluation right now?
Customer: Sure. We're spending about 12 hours a week on manual reporting and our CFO wants that cut in half by Q3.
Rep: That's a clear target. Who else is involved in the final decision?
Customer: Our CFO Sarah has final sign-off. IT will review the security side. I'm championing it internally.
Rep: What would make this a definitive yes for Sarah?
Customer: She needs to see an ROI model and confirmation that it integrates with Salesforce. Price is a concern too because a competitor came in 20 percent cheaper.
Rep: Understood. We can share an ROI model, an integration plan, and security documentation by Friday.
Customer: That helps. Our IT lead also wants the API docs before we move forward.`;

const FEATURES = [
  {
    title: "MEDDIC Extraction",
    description: "Pull metrics, buyer roles, pain, process, and champion signals from every call.",
    icon: Target,
  },
  {
    title: "Objection Detection",
    description: "Surface pricing, security, timing, and competitor pushback in structured form.",
    icon: Waves,
  },
  {
    title: "Evidence Verification",
    description: "Connect key insights back to transcript turns so the output stays grounded.",
    icon: ShieldCheck,
  },
  {
    title: "AI Coaching",
    description: "Turn call moments into practical coaching and better follow-up preparation.",
    icon: BrainCircuit,
  },
  {
    title: "Deal Intelligence",
    description: "Estimate deal risk, buying signals, likely stage, and next best actions.",
    icon: SearchCheck,
  },
  {
    title: "Async Workflow Tracking",
    description: "Make the LangGraph, Celery, and persistence pipeline visible while the job runs.",
    icon: History,
  },
];

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 display-font text-3xl font-bold tracking-[-0.05em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_12px_30px_rgba(99,102,241,0.24)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 display-font text-xl font-bold tracking-[-0.03em] text-slate-950">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}

function HomePage() {
  const [inputMode, setInputMode] = useState("paste");
  const [text, setText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const workspaceRef = useRef(null);
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: analysesData, isLoading: analysesLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/analyses");
      if (!response.ok) throw new Error("Failed to fetch analyses.");
      return response.json();
    },
    refetchInterval: 10000,
  });

  const analyses = analysesData?.data || [];
  const completedAnalyses = analyses.filter((item) => item.status === "completed");
  const latestCompleted = completedAnalyses[0];
  const averageCompleteness = completedAnalyses.length
    ? Math.round(
        completedAnalyses.reduce(
          (sum, item) => sum + (Number(item.completeness_score) || 0),
          0,
        ) / completedAnalyses.length,
      )
    : null;

  const submitMutation = useMutation({
    mutationFn: async () => {
      setError(null);

      if (inputMode === "paste") {
        const trimmed = text.trim();
        if (!trimmed) throw new Error("Please paste a transcript before running analysis.");
        if (trimmed.length < MIN_CHARS) {
          throw new Error(`Transcript must be at least ${MIN_CHARS} characters.`);
        }

        const response = await fetch("/api/proxy/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: trimmed,
            source_name: sourceName.trim() || undefined,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message || "Failed to start analysis.");
        }
        return payload;
      }

      if (!file) throw new Error("Please select a .txt file before running analysis.");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/proxy/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Failed to upload transcript.");
      }
      return payload;
    },
    onSuccess: (payload) => {
      if (payload?.job_id) {
        queryClient.invalidateQueries({ queryKey: ["analyses"] });
        window.location.href = `/analysis/${payload.job_id}`;
      }
    },
    onError: (mutationError) => {
      setError(mutationError.message || "Something went wrong.");
    },
  });

  async function readFilePreview(nextFile) {
    if (!nextFile) {
      setFilePreview("");
      return;
    }

    const contents = await nextFile.text();
    setFilePreview(contents.slice(0, 220));
  }

  async function handleFileSelection(nextFile) {
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith(".txt")) {
      setError("Only .txt files are supported.");
      return;
    }

    setFile(nextFile);
    setError(null);
    await readFilePreview(nextFile);
  }

  const charCount = text.length;
  const canSubmit =
    inputMode === "paste"
      ? text.trim().length >= MIN_CHARS && charCount <= MAX_CHARS
      : Boolean(file);

  const historyRows = analyses.map((row) => ({
    ...row,
    completenessScore:
      row.completeness_score != null ? Math.round(row.completeness_score) : null,
  }));

  function scrollToWorkspace() {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function useDemoTranscript() {
    setInputMode("paste");
    setText(DEMO_TRANSCRIPT);
    setSourceName("Demo discovery call");
    setError(null);
    scrollToWorkspace();
  }

  function handleViewSampleDashboard() {
    if (latestCompleted?.job_id) {
      window.location.href = `/analysis/${latestCompleted.job_id}`;
      return;
    }

    useDemoTranscript();
  }

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-4 no-underline">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-[0_14px_34px_rgba(99,102,241,0.24)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="display-font text-lg font-bold tracking-[-0.04em]">
                SalesSignal AI
              </p>
              <p className="text-sm text-slate-500">Intellify</p>
            </div>
          </a>

          <nav className="hidden items-center gap-2 md:flex">
            {[
              ["features", "Features"],
              ["workspace", "Workspace"],
              ["activity", "Activity"],
              ["history", "History"],
            ].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full px-3 py-2 text-sm text-slate-500 transition hover:bg-white hover:text-slate-900"
              >
                {label}
              </a>
            ))}
            <a
              href="/history"
              className="ml-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
            >
              Open history
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pt-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,255,255,0.74))] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
            <div className="mb-6 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700">
              Sales call intelligence
            </div>
            <h1 className="display-font max-w-4xl text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Turn sales call transcripts into MEDDIC insights, objections, coaching, and deal intelligence.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              Upload or paste a sales transcript and let Intellify analyze buyer pain,
              decision process, risks, objections, and next-best actions using a
              LangGraph-powered AI workflow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToWorkspace}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Analyze Transcript
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleViewSampleDashboard}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                View Sample Dashboard
              </button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Recent runs"
                value={String(analyses.length)}
                hint="Latest transcript analyses"
              />
              <StatCard
                label="Completed"
                value={String(completedAnalyses.length)}
                hint="Finished and ready to review"
              />
              <StatCard
                label="Avg. MEDDIC"
                value={averageCompleteness != null ? `${averageCompleteness}%` : "N/A"}
                hint="Average completeness across completed runs"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/90">
                Pipeline visibility
              </p>
              <h2 className="mt-3 display-font text-2xl font-bold tracking-[-0.04em]">
                Make the backend workflow visible
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Show how LangGraph, Celery, Redis, Postgres, and FastAPI work
                together from transcript submission to saved results.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Why it stands out
              </p>
              <ul className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                {[
                  "A clear first page that explains the product before asking for input.",
                  "A visible async progress experience instead of a generic spinner.",
                  "A structured dashboard that connects insights back to evidence.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-indigo-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="features" className="mt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Features
              </p>
              <h2 className="display-font text-3xl font-bold tracking-[-0.04em] text-slate-950">
                Everything needed for transcript-to-insight review
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-500">
              The interface is designed to make complex backend processing feel simple,
              transparent, and polished.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section
          id="workspace"
          ref={workspaceRef}
          className="mt-14 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]"
        >
          <div className="rounded-[36px] border border-white/60 bg-white/90 p-6 shadow-[0_26px_70px_rgba(15,23,42,0.06)]">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Transcript input
                </p>
                <h2 className="display-font text-3xl font-bold tracking-[-0.04em] text-slate-950">
                  Start a new analysis
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  Paste a transcript or upload a plain-text file. Both routes feed the same analysis workflow.
                </p>
              </div>

              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                {[
                  ["paste", "Paste Transcript"],
                  ["upload", "Upload File"],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setInputMode(mode);
                      setError(null);
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      inputMode === mode
                        ? "bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]"
                        : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {inputMode === "paste" ? (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Paste Transcript
                  </label>
                  <span className="text-xs font-medium text-slate-400">
                    {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={`Rep: Thanks for joining today...
Customer: We are struggling with manual reporting...`}
                  className="min-h-[320px] w-full rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-4 font-mono text-[13px] leading-7 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                />
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span>Minimum required: 50 characters</span>
                  <span>Format: Speaker: message</span>
                </div>
              </div>
            ) : (
              <div>
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={async (event) => {
                    event.preventDefault();
                    setDragOver(false);
                    await handleFileSelection(event.dataTransfer.files[0]);
                  }}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "rounded-[28px] border-2 border-dashed p-10 text-center transition",
                    dragOver
                      ? "border-indigo-400 bg-indigo-50/70"
                      : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white",
                  )}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={async (event) => {
                      await handleFileSelection(event.target.files?.[0]);
                    }}
                  />
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_14px_34px_rgba(99,102,241,0.24)]">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-base font-semibold text-slate-950">
                    {file ? file.name : "Drag and drop a .txt transcript"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB • click to replace`
                      : "Only .txt files are accepted"}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Selected file
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {file ? file.name : "No file selected"}
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Preview
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                      {filePreview || "The beginning of the text file will appear here after selection."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Source name
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(event) => setSourceName(event.target.value)}
                  placeholder="Q2 discovery call - Acme Corp"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                />
              </div>
              <button
                type="button"
                onClick={useDemoTranscript}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Use Demo Transcript
              </button>
              <button
                type="button"
                onClick={() => submitMutation.mutate()}
                disabled={!canSubmit || submitMutation.isPending}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition",
                  canSubmit && !submitMutation.isPending
                    ? "bg-slate-950 shadow-[0_18px_36px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:bg-slate-800"
                    : "cursor-not-allowed bg-slate-300",
                )}
              >
                {submitMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {submitMutation.isPending ? "Starting..." : "Run Analysis"}
              </button>
            </div>

            {error && (
              <div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-white/60 bg-slate-950 p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,0.16)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200/90">
                Workflow
              </p>
              <h3 className="mt-3 display-font text-2xl font-bold tracking-[-0.04em]">
                What happens after submission
              </h3>
              <div className="mt-5 space-y-3">
                {[
                  "Transcript intake and normalization",
                  "MEDDIC and objection extraction",
                  "Evidence verification and judge review",
                  "Coaching synthesis and result persistence",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Input guidance
              </p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>Use speaker-labelled dialogue for the cleanest extraction.</p>
                <p>Short transcripts are validated before the job is submitted.</p>
                <p>File uploads and pasted transcripts share the same backend flow.</p>
              </div>
            </div>
          </aside>
        </section>

        <section id="activity" className="mt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Activity
              </p>
              <h2 className="display-font text-3xl font-bold tracking-[-0.04em] text-slate-950">
                Recent analyses
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Browse the latest runs or jump straight into a finished dashboard.
              </p>
            </div>
            <a
              href="/history"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Full history
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <AnalysisHistoryTable
            rows={historyRows}
            loading={analysesLoading}
            compact
            emptyText="Run your first transcript to populate recent activity."
          />
        </section>
      </main>

      <AppFooter />
    </div>
  );
}

export default HomePage;
