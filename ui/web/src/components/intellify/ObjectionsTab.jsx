const CAT = {
  price: { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", label: "Price" },
  budget: {
    bg: "#FFF7ED",
    border: "#FED7AA",
    color: "#C2410C",
    label: "Budget",
  },
  competition: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    color: "#1D4ED8",
    label: "Competition",
  },
  change_management: {
    bg: "#F5F3FF",
    border: "#DDD6FE",
    color: "#6D28D9",
    label: "Change Mgmt",
  },
  security: {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    color: "#15803D",
    label: "Security",
  },
  need: { bg: "#F8FAFC", border: "#E2E8F0", color: "#475569", label: "Need" },
};

const HANDLING = {
  handled: {
    dot: "#22C55E",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    color: "#15803D",
    label: "Handled",
  },
  needs_follow_up: {
    dot: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    color: "#B45309",
    label: "Needs follow-up",
  },
  not_addressed: {
    dot: "#EF4444",
    bg: "#FEF2F2",
    border: "#FECACA",
    color: "#DC2626",
    label: "Not addressed",
  },
};

function ObjectionCard({ objection, index }) {
  const cat = CAT[objection.category] || {
    bg: "#F8FAFC",
    border: "#E2E8F0",
    color: "#475569",
    label: objection.category,
  };
  const h = HANDLING[objection.handling_quality] || HANDLING.needs_follow_up;

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94A3B8",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            #{String(index + 1).padStart(2, "0")}
          </span>
          <span
            style={{
              background: cat.bg,
              border: `1px solid ${cat.border}`,
              color: cat.color,
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {cat.label}
          </span>
          <span
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              color: "#64748B",
              borderRadius: 999,
              padding: "3px 10px",
              fontSize: 11,
            }}
          >
            {objection.explicitness === "explicit" ? "Explicit" : "Implicit"}
          </span>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: h.bg,
            border: `1px solid ${h.border}`,
            color: h.color,
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: h.dot,
              display: "inline-block",
            }}
          />
          {h.label}
        </span>
      </div>

      <div
        style={{
          borderLeft: "3px solid #E2E8F0",
          paddingLeft: 14,
          marginBottom: 16,
          background: "#FAFBFC",
          padding: "10px 14px",
          borderRadius: "0 8px 8px 0",
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "#334155",
            lineHeight: 1.6,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          "{objection.text}"
        </p>
      </div>

      {objection.suggested_response && (
        <div style={{ marginBottom: 12 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Suggested Response
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#475569",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            {objection.suggested_response}
          </p>
        </div>
      )}

      {objection.turn_id && (
        <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10 }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            Turn{" "}
            <span
              style={{
                fontWeight: 600,
                color: "#64748B",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {objection.turn_id}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

export default function ObjectionsTab({ objections = [] }) {
  const list =
    objections?.objections || (Array.isArray(objections) ? objections : []);

  if (!list.length) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: 48,
          textAlign: "center",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 4,
          }}
        >
          No objections detected
        </p>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>
          The pipeline found no objection signals in this transcript.
        </p>
      </div>
    );
  }

  const handled = list.filter((o) => o.handling_quality === "handled").length;
  const followUp = list.filter(
    (o) => o.handling_quality === "needs_follow_up",
  ).length;
  const unaddressed = list.filter(
    (o) => o.handling_quality === "not_addressed",
  ).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          gap: 12,
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
            Objections Detected
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            {list.length} objection{list.length !== 1 ? "s" : ""} extracted and
            categorized from the call.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { count: handled, dot: "#22C55E", label: "handled" },
            { count: followUp, dot: "#F59E0B", label: "follow-up" },
            { count: unaddressed, dot: "#EF4444", label: "unaddressed" },
          ].map(
            ({ count, dot, label }) =>
              count > 0 && (
                <span
                  key={label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontSize: 12,
                    color: "#475569",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: dot,
                      display: "inline-block",
                    }}
                  />
                  {count} {label}
                </span>
              ),
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {list.map((obj, i) => (
          <ObjectionCard
            key={obj.objection_id || i}
            objection={obj}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
