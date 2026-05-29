function TalkRatioChart({ repPct, custPct }) {
  const r = 34,
    circ = 2 * Math.PI * r;
  const repDash = circ * (repPct / 100);
  const isHeavy = repPct > 60;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle
            cx="45"
            cy="45"
            r={r}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="6"
          />
          <circle
            cx="45"
            cy="45"
            r={r}
            fill="none"
            stroke="#2563EB"
            strokeWidth="6"
            strokeDasharray={`${repDash} ${circ - repDash}`}
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
            style={{
              transition: "stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            {Math.round(repPct)}%
          </span>
          <span style={{ fontSize: 10, color: "#94A3B8" }}>rep</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { dot: "#2563EB", label: "Rep", val: Math.round(repPct) },
          {
            dot: "#E2E8F0",
            label: "Customer",
            val: Math.round(custPct),
            border: "#CBD5E1",
          },
        ].map(({ dot, label, val, border }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: dot,
                border: border ? `1px solid ${border}` : "none",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: "#475569" }}>{label}</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0F172A",
                marginLeft: "auto",
                paddingLeft: 12,
              }}
            >
              {val}%
            </span>
          </div>
        ))}
        {isHeavy && (
          <div
            style={{
              background: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: 7,
              padding: "5px 10px",
              marginTop: 2,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#C2410C",
                margin: 0,
                fontWeight: 500,
              }}
            >
              ⚠ Rep-heavy conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#0F172A",
          margin: "0 0 14px",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function CoachingPointCard({ point, index }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        gap: 14,
        transition: "border-color 120ms, box-shadow 120ms",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#93C5FD";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E2E8F0";
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
          color: "#2563EB",
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            color: "#334155",
            lineHeight: 1.6,
            margin: "0 0 8px",
          }}
        >
          {point.summary}
        </p>
        {point.evidence_turn_ids?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {point.evidence_turn_ids.map((tid) => (
              <span
                key={tid}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 11,
                  color: "#64748B",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {tid}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BulletList({ items, empty = "None identified" }) {
  if (!items?.length)
    return (
      <p style={{ fontSize: 12, color: "#CBD5E1", fontStyle: "italic" }}>
        {empty}
      </p>
    );
  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{ display: "flex", gap: 7, alignItems: "flex-start" }}
        >
          <span style={{ color: "#CBD5E1", flexShrink: 0 }}>·</span>
          <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function CoachingTab({ coaching }) {
  if (!coaching) {
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
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎙</div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 4,
          }}
        >
          Coaching data unavailable
        </p>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>
          This section requires a completed pipeline run.
        </p>
      </div>
    );
  }

  const { talk_ratio, question_stats, coaching_points, deal_summary } =
    coaching;
  const repPct = talk_ratio?.rep_percentage || 0;
  const custPct = talk_ratio?.customer_percentage || 0;
  const openCount = question_stats?.open_questions?.length || 0;
  const closedCount = question_stats?.closed_questions?.length || 0;
  const totalQ = question_stats?.total_questions || openCount + closedCount;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#0F172A",
            margin: "0 0 4px",
            letterSpacing: "-0.02em",
          }}
        >
          Call Coaching
        </h2>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
          Conversation quality metrics and actionable improvement points.
        </p>
      </div>

      {/* Top row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <Card title="Talk Ratio">
          <TalkRatioChart repPct={repPct} custPct={custPct} />
          {talk_ratio?.assessment && (
            <p
              style={{
                fontSize: 12,
                color: "#64748B",
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid #F1F5F9",
                lineHeight: 1.55,
              }}
            >
              {talk_ratio.assessment}
            </p>
          )}
        </Card>

        <Card title="Question Analysis">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              marginBottom: 14,
            }}
          >
            {[
              { label: "Total asked", val: totalQ },
              { label: "Open questions", val: openCount },
              { label: "Closed questions", val: closedCount },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom:
                    i < arr.length - 1 ? "1px solid #F1F5F9" : "none",
                }}
              >
                <span style={{ fontSize: 13, color: "#64748B" }}>
                  {row.label}
                </span>
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}
                >
                  {row.val}
                </span>
              </div>
            ))}
          </div>
          {totalQ > 0 && (
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: 8,
                height: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(openCount / totalQ) * 100}%`,
                  background: "#2563EB",
                  borderRadius: 999,
                  transition: "width 0.7s ease",
                }}
              />
            </div>
          )}
          {openCount > 0 && question_stats?.open_questions?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                Top open questions asked
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {question_stats.open_questions.slice(0, 3).map((q, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 12,
                      color: "#475569",
                      lineHeight: 1.4,
                      margin: 0,
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "#CBD5E1" }}>·</span> {q}
                  </p>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Coaching points */}
      {coaching_points?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0F172A",
              margin: "0 0 12px",
            }}
          >
            Coaching Points
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {coaching_points.map((pt, i) => (
              <CoachingPointCard key={i} point={pt} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Deal summary */}
      {deal_summary && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "18px 20px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
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
              Deal Summary
            </h3>
            {deal_summary.likely_stage && (
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
                {deal_summary.likely_stage} stage
              </span>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 24,
            }}
          >
            {[
              {
                label: "Buying Signals",
                icon: "📈",
                items: deal_summary.buying_signals,
              },
              { label: "Risks", icon: "⚠️", items: deal_summary.risks },
              {
                label: "Next Steps",
                icon: "➡️",
                items: deal_summary.next_steps,
              },
            ].map(({ label, icon, items }) => (
              <div key={label}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 8,
                  }}
                >
                  {icon} {label}
                </p>
                <BulletList items={items} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
