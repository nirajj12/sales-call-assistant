const ROLE = {
  rep: { bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8", label: "Rep" },
  customer: {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    color: "#15803D",
    label: "Customer",
  },
  unknown: {
    bg: "#F8FAFC",
    border: "#E2E8F0",
    color: "#64748B",
    label: "Unknown",
  },
};

const VERIFY_BADGE = {
  verified_exact: {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    color: "#15803D",
    label: "Exact",
  },
  verified_fuzzy: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    color: "#1D4ED8",
    label: "Fuzzy",
  },
  unverified: {
    bg: "#FEF2F2",
    border: "#FECACA",
    color: "#DC2626",
    label: "Unverified",
  },
};

export default function TranscriptTab({ transcript, verifiedEvidence = [] }) {
  const turns = transcript?.normalized_turns || transcript?.turns || [];
  const repWords = transcript?.metrics?.rep_word_count;
  const custWords = transcript?.metrics?.customer_word_count;
  const total = (repWords || 0) + (custWords || 0);

  if (!turns.length) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: 48,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 4,
          }}
        >
          Transcript unavailable
        </p>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>
          No normalized turns were found in this analysis.
        </p>
      </div>
    );
  }

  const evMap = {};
  verifiedEvidence.forEach((ev) => {
    if (ev.turn_id) {
      if (!evMap[ev.turn_id]) evMap[ev.turn_id] = [];
      evMap[ev.turn_id].push(ev);
    }
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
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
            Transcript
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            {turns.length} turn{turns.length !== 1 ? "s" : ""} · normalized
            speaker-labelled conversation.
          </p>
        </div>
        {total > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {[
              { dot: "#2563EB", label: "Rep", val: repWords },
              { dot: "#22C55E", label: "Customer", val: custWords },
            ].map(({ dot, label, val }) =>
              val != null ? (
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
                  {label} · {val}w
                </span>
              ) : null,
            )}
          </div>
        )}
      </div>

      {total > 0 && repWords != null && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              height: 5,
              background: "#F1F5F9",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round((repWords / total) * 100)}%`,
                background: "#2563EB",
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {turns.map((turn, i) => {
          const role = turn.speaker_role || "unknown";
          const r = ROLE[role] || ROLE.unknown;
          const evidence = evMap[turn.turn_id] || [];
          return (
            <div
              key={turn.turn_id || i}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "14px 18px",
                transition: "border-color 120ms, box-shadow 120ms",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#CBD5E1";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.03)";
              }}
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
                    background: r.bg,
                    border: `1px solid ${r.border}`,
                    color: r.color,
                    borderRadius: 999,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {r.label}
                </span>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>
                  {turn.speaker_label}
                </span>
                <span style={{ color: "#E2E8F0" }}>·</span>
                <span style={{ fontSize: 11, color: "#CBD5E1" }}>
                  {turn.word_count}w
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#E2E8F0",
                    marginLeft: "auto",
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {turn.turn_id}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "#334155",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {turn.text}
              </p>
              {evidence.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {evidence.map((ev, ei) => {
                    const vb =
                      VERIFY_BADGE[ev.status] || VERIFY_BADGE.unverified;
                    return (
                      <span
                        key={ei}
                        style={{
                          background: vb.bg,
                          border: `1px solid ${vb.border}`,
                          color: vb.color,
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {ev.source_label} · {vb.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
