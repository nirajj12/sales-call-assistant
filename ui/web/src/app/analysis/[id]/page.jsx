"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import MEDDICTab from "@/components/intellify/MEDDICTab";
import ObjectionsTab from "@/components/intellify/ObjectionsTab";
import DealIntelTab from "@/components/intellify/DealIntelTab";
import CoachingTab from "@/components/intellify/CoachingTab";
import TranscriptTab from "@/components/intellify/TranscriptTab";
import RawJsonTab from "@/components/intellify/RawJsonTab";

const TERMINAL = ["completed", "failed", "partial"];
const TABS = [
  "MEDDIC",
  "Objections",
  "Deal Intel",
  "Coaching",
  "Transcript",
  "Raw JSON",
];

const STEPS = [
  { label: "Loading transcript", icon: "📄" },
  { label: "Normalizing speakers", icon: "🎙" },
  { label: "Extracting MEDDIC", icon: "🔍" },
  { label: "Extracting objections", icon: "💬" },
  { label: "Verifying evidence", icon: "✅" },
  { label: "Judge review", icon: "⚖️" },
  { label: "Building coaching report", icon: "📊" },
  { label: "Saving results", icon: "💾" },
];

function PipelineTracker({ status }) {
  const [step, setStep] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (status === "running") {
      ref.current = setInterval(
        () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
        2400,
      );
    } else {
      clearInterval(ref.current);
      if (status === "completed") setStep(STEPS.length);
    }
    return () => clearInterval(ref.current);
  }, [status]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step && status === "running";
        return (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: done ? "#2563EB" : active ? "#EFF6FF" : "#F1F5F9",
                border: active
                  ? "2px solid #93C5FD"
                  : done
                    ? "none"
                    : "2px solid #E2E8F0",
                transition: "all 0.3s ease",
              }}
            >
              {done ? (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="#fff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              ) : active ? (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#2563EB",
                    display: "block",
                    animation: "pulse 1.2s infinite",
                  }}
                />
              ) : (
                <span style={{ fontSize: 12 }}>{s.icon}</span>
              )}
            </div>
            <span
              style={{
                fontSize: 13,
                color: done ? "#0F172A" : active ? "#2563EB" : "#94A3B8",
                fontWeight: active ? 600 : done ? 500 : 400,
                transition: "color 0.2s",
              }}
            >
              {s.label}
              {active && (
                <span style={{ marginLeft: 4, color: "#93C5FD" }}>…</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 999,
        padding: "4px 12px",
        fontSize: 12,
        color: "#475569",
      }}
    >
      <span style={{ color: "#94A3B8", fontSize: 11 }}>{label}</span>
      <span style={{ fontWeight: 600, color: "#0F172A" }}>{value}</span>
    </span>
  );
}

export default function AnalysisPage({ params }) {
  const jobId = params.id;
  const [activeTab, setActiveTab] = useState(0);
  const [analysisId, setAnalysisId] = useState(null);

  const { data: jobData, isError: jobError } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/jobs/${jobId}`);
      if (!res.ok) throw new Error("Job not found");
      return res.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return TERMINAL.includes(status) ? false : 3000;
    },
    enabled: !!jobId,
  });

  useEffect(() => {
    if (jobData?.analysis_id && !analysisId) setAnalysisId(jobData.analysis_id);
  }, [jobData, analysisId]);

  const { data: analysisData, isLoading: analysisLoading } = useQuery({
    queryKey: ["analysis", analysisId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/analysis/${analysisId}`);
      if (!res.ok) throw new Error("Analysis not found");
      return res.json();
    },
    enabled: !!analysisId,
  });

  const jobStatus = jobData?.status || "pending";
  const analysis = analysisData?.data;
  const isTerminal = TERMINAL.includes(jobStatus);
  const isFailed = jobStatus === "failed";
  const objCount = analysis?.objections?.objections?.length || 0;

  const renderTab = () => {
    if (!analysis) return null;
    switch (activeTab) {
      case 0:
        return (
          <MEDDICTab
            meddic={analysis.meddic}
            completeness={analysis.completeness}
            judgeResult={analysis.judge_result}
            verifiedEvidence={analysis.verified_evidence || []}
          />
        );
      case 1:
        return <ObjectionsTab objections={analysis.objections} />;
      case 2:
        return <DealIntelTab dealIntelligence={analysis.deal_intelligence} />;
      case 3:
        return (
          <CoachingTab
            coaching={analysis.coaching}
            metrics={analysis.metrics}
          />
        );
      case 4:
        return (
          <TranscriptTab
            transcript={analysis}
            verifiedEvidence={analysis.verified_evidence || []}
          />
        );
      case 5:
        return <RawJsonTab data={analysis} />;
      default:
        return null;
    }
  };

  const card = {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Nav */}
      <header
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 56,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
                opacity: 1,
                transition: "opacity 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.7)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "#2563EB",
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1L9.5 5.5H13L9.5 8.5L11 13L7 10L3 13L4.5 8.5L1 5.5H4.5L7 1Z"
                    fill="white"
                  />
                </svg>
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#0F172A",
                  letterSpacing: "-0.02em",
                }}
              >
                Intellify
              </span>
            </a>
            <span style={{ color: "#CBD5E1", fontSize: 16, margin: "0 2px" }}>
              /
            </span>
            <span
              style={{
                fontSize: 13,
                color: "#64748B",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 280,
              }}
            >
              {analysis?.source_name || jobId}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            {analysis?.provider_used && (
              <span
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 11,
                  color: "#64748B",
                  textTransform: "capitalize",
                }}
              >
                via {analysis.provider_used}
              </span>
            )}
            {analysis?.created_at && (
              <span style={{ fontSize: 12, color: "#94A3B8" }}>
                {new Date(analysis.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <a
              href="/"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 7,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                color: "#475569",
                textDecoration: "none",
                transition: "all 120ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F8FAFC";
                e.currentTarget.style.borderColor = "#CBD5E1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFFFF";
                e.currentTarget.style.borderColor = "#E2E8F0";
              }}
            >
              ← New analysis
            </a>
          </div>
        </div>
      </header>

      <main
        style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}
      >
        {/* Loading state */}
        {!isTerminal && (
          <div
            style={{ ...card, padding: 32, marginBottom: 24 }}
            className="animate-fadein"
          >
            <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background:
                        jobStatus === "running" ? "#EFF6FF" : "#F8FAFC",
                      border: `1px solid ${jobStatus === "running" ? "#BFDBFE" : "#E2E8F0"}`,
                      borderRadius: 999,
                      padding: "4px 12px",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background:
                          jobStatus === "running" ? "#3B82F6" : "#CBD5E1",
                        display: "inline-block",
                        animation:
                          jobStatus === "running"
                            ? "pulse 1.5s infinite"
                            : "none",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: jobStatus === "running" ? "#2563EB" : "#64748B",
                      }}
                    >
                      {jobStatus === "running" ? "Running analysis" : "Queued"}
                    </span>
                  </div>
                </div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#0F172A",
                    letterSpacing: "-0.02em",
                    marginBottom: 6,
                  }}
                >
                  {jobStatus === "pending"
                    ? "Your transcript is in the queue"
                    : "Processing your transcript"}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "#64748B",
                    marginBottom: 28,
                    lineHeight: 1.6,
                  }}
                >
                  {jobStatus === "pending"
                    ? "The Celery worker will pick this up shortly. This page refreshes every 3 seconds."
                    : "The LangGraph pipeline is running. MEDDIC, objections, and deal intel are being extracted in parallel."}
                </p>
                <PipelineTracker status={jobStatus} />
              </div>
              <div
                style={{
                  flexShrink: 0,
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#94A3B8",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Job ID
                </span>
                <code
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 6,
                    padding: "4px 8px",
                  }}
                >
                  {jobId}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Failed state */}
        {isFailed && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 12,
              padding: 32,
            }}
            className="animate-fadein"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#EF4444",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#991B1B" }}>
                Analysis failed
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 12 }}>
              {jobData?.message ||
                "The pipeline encountered an unrecoverable error."}
            </p>
            <a
              href="/"
              style={{
                fontSize: 13,
                color: "#2563EB",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              ← Try again with a new transcript
            </a>
          </div>
        )}

        {/* Job not found */}
        {jobError && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#991B1B",
                marginBottom: 6,
              }}
            >
              Could not load job status
            </p>
            <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 16 }}>
              Make sure your FastAPI backend is running at the configured URL.
            </p>
            <a
              href="/"
              style={{
                fontSize: 13,
                color: "#2563EB",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              ← Go home
            </a>
          </div>
        )}

        {/* Results */}
        {isTerminal && !isFailed && (
          <div className="animate-fadein">
            {/* Partial warning */}
            {(jobStatus === "partial" || analysis?.errors?.length > 0) && (
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13 }}>⚠️</span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}
                  >
                    Partial analysis
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#A16207", marginBottom: 4 }}>
                  Some pipeline nodes encountered errors. Displayed results may
                  be incomplete.
                </p>
                {analysis?.errors?.map((err, i) => (
                  <p key={i} style={{ fontSize: 12, color: "#CA8A04" }}>
                    · {err}
                  </p>
                ))}
              </div>
            )}

            {/* Header stats */}
            {analysis && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#0F172A",
                    letterSpacing: "-0.03em",
                    marginRight: 4,
                  }}
                >
                  {analysis.source_name || "Transcript Analysis"}
                </h1>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    color: "#15803D",
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#22C55E",
                      display: "inline-block",
                    }}
                  />
                  {analysis.status}
                </span>
                {analysis.completeness?.score != null && (
                  <StatPill
                    label="MEDDIC"
                    value={`${Math.round(analysis.completeness.score)}%`}
                  />
                )}
                {analysis.metrics?.rep_talk_ratio != null && (
                  <StatPill
                    label="Rep talk"
                    value={`${Math.round(analysis.metrics.rep_talk_ratio * 100)}%`}
                  />
                )}
                {analysis.metrics?.total_questions != null && (
                  <StatPill
                    label="Questions"
                    value={analysis.metrics.total_questions}
                  />
                )}
                {analysis.deal_intelligence?.risk_score != null && (
                  <StatPill
                    label="Risk"
                    value={`${analysis.deal_intelligence.risk_score}/10`}
                  />
                )}
              </div>
            )}

            {/* Tabs */}
            <div
              style={{ borderBottom: "1px solid #E2E8F0", marginBottom: 24 }}
            >
              <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
                {TABS.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    style={{
                      padding: "12px 18px",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      fontWeight: activeTab === i ? 600 : 400,
                      color: activeTab === i ? "#0F172A" : "#64748B",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      borderBottom:
                        activeTab === i
                          ? "2px solid #2563EB"
                          : "2px solid transparent",
                      marginBottom: -1,
                      transition: "all 120ms",
                      fontFamily: "inherit",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {tab}
                    {tab === "Objections" && objCount > 0 && (
                      <span
                        style={{
                          background: "#F1F5F9",
                          color: "#64748B",
                          borderRadius: 999,
                          padding: "1px 6px",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {objCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {analysisLoading ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[200, 140, 180].map((h, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: h, borderRadius: 10 }}
                  />
                ))}
              </div>
            ) : (
              <div key={activeTab} className="animate-fadein">
                {renderTab()}
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
}
