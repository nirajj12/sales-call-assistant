"use client";
import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const MAX_CHARS = 50000;
const MIN_CHARS = 50;

const SAMPLE = `Rep: Thanks for joining today. Can you walk me through what's driving the evaluation right now?
Customer: Sure. We're spending about 12 hours a week on manual reporting and our CFO wants that cut in half by Q3.
Rep: That's a clear target. Who else is involved in the final decision?
Customer: Our CFO Sarah has final sign-off. IT will review the security side. I'm championing it internally.
Rep: What would make this a definitive yes for Sarah?
Customer: She needs to see an ROI model and confirmation that it integrates with Salesforce. Price is a concern too — we got a quote from a competitor that's 20% cheaper.
Rep: Understood. We've handled that situation with similar-sized teams. Let me send over a comparison and ROI template by Friday.
Customer: That works. Loop in our IT lead too, she'll want to review the API docs.`;

const STATUS_COLOR = {
  completed: {
    dot: "#22C55E",
    text: "#15803D",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  failed: { dot: "#EF4444", text: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  partial: {
    dot: "#F59E0B",
    text: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  running: {
    dot: "#3B82F6",
    text: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  pending: {
    dot: "#94A3B8",
    text: "#64748B",
    bg: "#F8FAFC",
    border: "#E2E8F0",
  },
};

function Spinner() {
  return (
    <svg
      className="animate-spin-slow"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <circle cx="8" cy="8" r="6" stroke="#BFDBFE" strokeWidth="2" />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}

function Skeleton({ h = 48 }) {
  return <div className="skeleton" style={{ height: h, borderRadius: 8 }} />;
}

function HistoryRow({ row }) {
  const score =
    row.completeness_score != null ? Math.round(row.completeness_score) : null;

  return (
    <tr
      onClick={() =>
        row.job_id && (window.location.href = `/analysis/${row.job_id}`)
      }
      style={{
        borderBottom: "1px solid #F1F5F9",
        cursor: "pointer",
        transition: "background 120ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td style={{ padding: "12px 16px 12px 0", maxWidth: 240 }}>
        <span
          style={{
            fontWeight: 500,
            fontSize: 13,
            color: "#0F172A",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.source_name || "Untitled transcript"}
        </span>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <StatusBadge status={row.status} />
      </td>
      <td style={{ padding: "12px 16px" }}>
        {score != null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 80,
                height: 4,
                background: "#E2E8F0",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${score}%`,
                  height: "100%",
                  background:
                    score >= 67
                      ? "#22C55E"
                      : score >= 34
                        ? "#F59E0B"
                        : "#EF4444",
                  borderRadius: 999,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#64748B" }}>{score}%</span>
          </div>
        ) : (
          <span style={{ color: "#CBD5E1", fontSize: 13 }}>—</span>
        )}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <span
          style={{
            fontSize: 12,
            color: "#64748B",
            textTransform: "capitalize",
          }}
        >
          {row.provider_used || "—"}
        </span>
      </td>
      <td style={{ padding: "12px 0", textAlign: "right" }}>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>
          {row.created_at
            ? new Date(row.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
      </td>
    </tr>
  );
}

export default function HomePage() {
  const [inputMode, setInputMode] = useState("paste");
  const [text, setText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const qc = useQueryClient();

  const { data: analysesData, isLoading: analysesLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: async () => {
      const res = await fetch("/api/proxy/analyses");
      if (!res.ok) throw new Error("Failed to fetch analyses");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      if (inputMode === "paste") {
        if (text.trim().length < MIN_CHARS)
          throw new Error(
            `Transcript must be at least ${MIN_CHARS} characters.`,
          );
        const res = await fetch("/api/proxy/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: text.trim(),
            source_name: sourceName.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e?.error?.message || "Request failed.");
        }
        return res.json();
      } else {
        if (!file) throw new Error("Select a .txt file first.");
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/proxy/upload", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e?.error?.message || "Upload failed.");
        }
        return res.json();
      }
    },
    onSuccess: (data) => {
      if (data?.job_id) {
        qc.invalidateQueries({ queryKey: ["analyses"] });
        window.location.href = `/analysis/${data.job_id}`;
      }
    },
    onError: (err) => setError(err.message),
  });

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".txt")) {
      setFile(f);
      setError(null);
    } else setError("Only .txt files are supported.");
  }, []);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit =
    inputMode === "paste" ? charCount >= MIN_CHARS && !isOverLimit : !!file;
  const analyses = analysesData?.data || [];

  const card = {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };
  const inputStyle = {
    width: "100%",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    color: "#0F172A",
    outline: "none",
    fontFamily: "inherit",
    background: "#FFFFFF",
    transition: "border-color 150ms, box-shadow 150ms",
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: "#2563EB",
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
            <span
              style={{
                background: "#EFF6FF",
                color: "#2563EB",
                borderRadius: 999,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Beta
            </span>
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            Sales Call Intelligence
          </span>
        </div>
      </header>

      <main
        style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}
      >
        {/* Hero */}
        <div style={{ marginBottom: 32 }} className="animate-fadein">
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.03em",
              marginBottom: 8,
            }}
          >
            Analyze your sales call
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#64748B",
              lineHeight: 1.6,
              maxWidth: 540,
            }}
          >
            Paste a transcript or upload a{" "}
            <code
              style={{
                background: "#F1F5F9",
                padding: "1px 6px",
                borderRadius: 4,
                fontSize: 12,
                color: "#475569",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              .txt
            </code>{" "}
            file. The LangGraph pipeline extracts MEDDIC signals, objections,
            deal intelligence, and coaching feedback automatically.
          </p>
        </div>

        {/* Input card */}
        <div style={{ ...card, marginBottom: 24 }} className="animate-fadein">
          {/* Mode tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #F1F5F9",
              padding: "0 24px",
            }}
          >
            {[
              ["paste", "Paste Transcript"],
              ["upload", "Upload File"],
            ].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => {
                  setInputMode(mode);
                  setError(null);
                }}
                style={{
                  padding: "14px 0",
                  marginRight: 24,
                  fontSize: 13,
                  fontWeight: inputMode === mode ? 600 : 400,
                  color: inputMode === mode ? "#2563EB" : "#64748B",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom:
                    inputMode === mode
                      ? "2px solid #2563EB"
                      : "2px solid transparent",
                  marginBottom: -1,
                  transition: "all 120ms",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>
            {inputMode === "paste" ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Transcript
                    </label>
                    <span
                      style={{
                        fontSize: 11,
                        color: isOverLimit ? "#EF4444" : "#94A3B8",
                        fontWeight: isOverLimit ? 600 : 400,
                      }}
                    >
                      {charCount.toLocaleString()} /{" "}
                      {MAX_CHARS.toLocaleString()}
                    </span>
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Rep: Hello, thanks for joining...\nCustomer: Happy to be here...\n\nEach line must be formatted as  Speaker: Text"
                    style={{
                      ...inputStyle,
                      minHeight: 240,
                      resize: "vertical",
                      fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                      fontSize: 12,
                      lineHeight: 1.65,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563EB";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(37,99,235,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E2E8F0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, maxWidth: 340 }}>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Source name{" "}
                      <span
                        style={{
                          color: "#CBD5E1",
                          fontWeight: 400,
                          textTransform: "none",
                        }}
                      >
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="e.g. Q4 Discovery — Acme Corp"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#2563EB";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(37,99,235,0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#E2E8F0";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div style={{ paddingTop: 22 }}>
                    <button
                      onClick={() => setText(SAMPLE)}
                      style={{
                        fontSize: 12,
                        color: "#2563EB",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 500,
                        padding: 0,
                      }}
                    >
                      Load sample ↗
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? "#2563EB" : "#E2E8F0"}`,
                    borderRadius: 10,
                    padding: "48px 24px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: dragOver ? "#EFF6FF" : "#FAFBFC",
                    transition: "all 150ms",
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      setFile(e.target.files[0]);
                      setError(null);
                    }}
                  />
                  {file ? (
                    <div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          background: "#EFF6FF",
                          color: "#2563EB",
                          borderRadius: 999,
                          padding: "6px 14px",
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        <span>📄</span> {file.name}
                      </div>
                      <p style={{ fontSize: 12, color: "#94A3B8" }}>
                        {(file.size / 1024).toFixed(1)} KB · click to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 28, marginBottom: 10 }}>📂</div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#334155",
                          marginBottom: 4,
                        }}
                      >
                        Drop a .txt file here
                      </p>
                      <p style={{ fontSize: 12, color: "#94A3B8" }}>
                        or click to browse · max 1 MB · UTF-8 encoded
                      </p>
                    </div>
                  )}
                </div>
                <ul
                  style={{
                    marginTop: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    listStyle: "none",
                    padding: 0,
                  }}
                >
                  {[
                    "File must be plain text (.txt)",
                    "Each line formatted as Speaker: Text",
                    "Must contain at least one rep and one customer turn",
                  ].map((hint) => (
                    <li
                      key={hint}
                      style={{
                        fontSize: 12,
                        color: "#94A3B8",
                        display: "flex",
                        gap: 6,
                      }}
                    >
                      <span style={{ color: "#CBD5E1" }}>·</span> {hint}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: 16,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "10px 14px",
                }}
              >
                <p style={{ fontSize: 13, color: "#DC2626" }}>{error}</p>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 20,
              }}
            >
              <button
                onClick={() => submitMutation.mutate()}
                disabled={!canSubmit || submitMutation.isPending}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background:
                    canSubmit && !submitMutation.isPending
                      ? "#2563EB"
                      : "#BFDBFE",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 22px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor:
                    canSubmit && !submitMutation.isPending
                      ? "pointer"
                      : "not-allowed",
                  transition: "background 150ms",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (canSubmit && !submitMutation.isPending)
                    e.currentTarget.style.background = "#1D4ED8";
                }}
                onMouseLeave={(e) => {
                  if (canSubmit && !submitMutation.isPending)
                    e.currentTarget.style.background = "#2563EB";
                }}
              >
                {submitMutation.isPending && <Spinner />}
                {submitMutation.isPending ? "Submitting…" : "Run Analysis →"}
              </button>
              {inputMode === "paste" && text.length > 0 && (
                <button
                  onClick={() => {
                    setText("");
                    setSourceName("");
                    setError(null);
                  }}
                  style={{
                    fontSize: 13,
                    color: "#94A3B8",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent analyses */}
        <div className="animate-fadein">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
              Recent Analyses
            </h2>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>
              Last 20 · auto-refreshes
            </span>
          </div>
          <div style={card}>
            {analysesLoading ? (
              <div
                style={{
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} h={44} />
                ))}
              </div>
            ) : analyses.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94A3B8" }}>
                  No analyses yet — submit your first transcript above.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                      {[
                        "Source",
                        "Status",
                        "Completeness",
                        "Provider",
                        "Created",
                      ].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding:
                              "10px 16px 10px " +
                              (i === 0 ? "24px" : i === 4 ? "24px" : "16px"),
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#94A3B8",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            textAlign: i === 4 ? "right" : "left",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((row) => (
                      <HistoryRow key={row.id || row.job_id} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
