import ConfidencePill from "./ConfidencePill";

const FIELDS = [
  {
    key: "metrics",
    label: "Metrics",
    desc: "Quantifiable business impact & success criteria",
  },
  {
    key: "economic_buyer",
    label: "Economic Buyer",
    desc: "The person with final budget authority",
  },
  {
    key: "decision_criteria",
    label: "Decision Criteria",
    desc: "How the customer will evaluate the solution",
  },
  {
    key: "decision_process",
    label: "Decision Process",
    desc: "Steps, timeline, and stakeholders in the decision",
  },
  {
    key: "identify_pain",
    label: "Identify Pain",
    desc: "Core business problem the solution addresses",
  },
  {
    key: "champion",
    label: "Champion",
    desc: "Internal advocate driving the deal forward",
  },
];

const VERIFY = {
  verified_exact: {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    color: "#15803D",
    icon: "✓",
    label: "Exact match",
  },
  verified_fuzzy: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    color: "#1D4ED8",
    icon: "≈",
    label: "Fuzzy match",
  },
  unverified: {
    bg: "#FEF2F2",
    border: "#FECACA",
    color: "#DC2626",
    icon: "✗",
    label: "Unverified",
  },
};

const STRENGTH = {
  strong: { bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D" },
  moderate: { bg: "#FFFBEB", border: "#FDE68A", color: "#B45309" },
  weak: { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626" },
};

function RingGauge({ score }) {
  const r = 32,
    circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 67 ? "#22C55E" : score >= 34 ? "#F59E0B" : "#EF4444";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="5"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{
            transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        <text
          x="40"
          y="44"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#0F172A"
        >
          {Math.round(score)}%
        </text>
      </svg>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#64748B",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Completeness
      </span>
    </div>
  );
}

function MEDDICCard({ fieldKey, element, isDowngraded, evidence }) {
  const meta = FIELDS.find((f) => f.key === fieldKey) || {
    label: fieldKey,
    desc: "",
  };
  const v = VERIFY[evidence?.status];
  const conf = element?.confidence || "missing";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "20px 24px",
        transition: "border-color 150ms, box-shadow 150ms",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#CBD5E1";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E2E8F0";
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 2,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
              }}
            >
              {meta.label}
            </h3>
            {isDowngraded && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "#FFF7ED",
                  border: "1px solid #FED7AA",
                  color: "#C2410C",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                ↓ Downgraded
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
            {meta.desc}
          </p>
        </div>
        <ConfidencePill level={conf} />
      </div>

      {/* Value */}
      <div style={{ marginBottom: 12 }}>
        {element?.value ? (
          <p
            style={{
              fontSize: 13,
              color: "#334155",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {element.value}
          </p>
        ) : (
          <p
            style={{
              fontSize: 13,
              color: "#CBD5E1",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            No value extracted
          </p>
        )}
      </div>

      {/* Evidence anchor */}
      {element?.evidence_anchor && (
        <div
          style={{
            borderLeft: "3px solid #BFDBFE",
            paddingLeft: 12,
            marginBottom: 12,
            background: "#F8FAFF",
            borderRadius: "0 6px 6px 0",
            padding: "8px 12px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            Evidence anchor
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#475569",
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            "{element.evidence_anchor}"
          </p>
        </div>
      )}

      {/* Verification */}
      {v && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            background: v.bg,
            border: `1px solid ${v.border}`,
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: v.color,
              flexShrink: 0,
            }}
          >
            {v.icon}
          </span>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: v.color }}>
              {v.label}
            </span>
            {evidence?.matched_text && (
              <p
                style={{
                  fontSize: 11,
                  color: "#64748B",
                  margin: "2px 0 0",
                  lineHeight: 1.4,
                }}
              >
                "{evidence.matched_text.slice(0, 80)}
                {evidence.matched_text.length > 80 ? "…" : ""}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Gap flag */}
      {element?.gap_flag && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "#FFF7ED",
            border: "1px solid #FED7AA",
            color: "#C2410C",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#F97316",
              display: "inline-block",
            }}
          />
          Gap identified
        </span>
      )}
    </div>
  );
}

export default function MEDDICTab({
  meddic,
  completeness,
  judgeResult,
  verifiedEvidence = [],
}) {
  const score = completeness?.score || 0;
  const downgrades = judgeResult?.should_downgrade || [];
  const evidenceMap = {};
  verifiedEvidence.forEach((ev) => {
    if (ev.source_type === "meddic") evidenceMap[ev.source_label] = ev;
  });
  const str = judgeResult
    ? STRENGTH[judgeResult.overall_support_strength] || STRENGTH.moderate
    : null;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0F172A",
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
            }}
          >
            MEDDIC Analysis
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Six-element qualification framework extracted from the transcript.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexShrink: 0,
          }}
        >
          <RingGauge score={score} />
          {completeness && (
            <div
              style={{
                borderLeft: "1px solid #E2E8F0",
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {[
                {
                  dot: "#22C55E",
                  text: `${completeness.high_confidence_count} high confidence`,
                },
                {
                  dot: "#F59E0B",
                  text: `${completeness.at_least_medium_count} medium or above`,
                },
                completeness.gap_elements?.length > 0
                  ? {
                      dot: "#EF4444",
                      text: `${completeness.gap_elements.length} gap${completeness.gap_elements.length !== 1 ? "s" : ""}`,
                    }
                  : null,
              ]
                .filter(Boolean)
                .map((item, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 7 }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: item.dot,
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 12, color: "#475569" }}>
                      {item.text}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Judge review */}
      {judgeResult && str && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              ⚖ Judge Review
            </span>
            <span
              style={{
                background: str.bg,
                border: `1px solid ${str.border}`,
                color: str.color,
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            >
              {judgeResult.overall_support_strength}
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "#334155",
              margin: "0 0 10px",
              lineHeight: 1.55,
            }}
          >
            {judgeResult.confidence_review}
          </p>
          {judgeResult.flags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {judgeResult.flags.map((flag, i) => (
                <span
                  key={i}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 11,
                    color: "#64748B",
                  }}
                >
                  · {flag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
          gap: 14,
        }}
      >
        {FIELDS.map(({ key }) => (
          <MEDDICCard
            key={key}
            fieldKey={key}
            element={meddic?.[key]}
            isDowngraded={downgrades.includes(key)}
            evidence={evidenceMap[key]}
          />
        ))}
      </div>
    </div>
  );
}
