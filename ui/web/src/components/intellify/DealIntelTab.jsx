function RiskGauge({ score }) {
  const r = 36,
    circ = Math.PI * r;
  const offset = circ * (1 - score / 10);
  const color = score <= 3 ? "#22C55E" : score <= 6 ? "#F59E0B" : "#EF4444";
  const label =
    score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : "High Risk";
  const labelColor =
    score <= 3 ? "#15803D" : score <= 6 ? "#B45309" : "#DC2626";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <svg width="100" height="58" viewBox="0 0 90 52">
        <path
          d="M 9 45 A 36 36 0 0 1 81 45"
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 9 45 A 36 36 0 0 1 81 45"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        <text
          x="45"
          y="40"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="#0F172A"
        >
          {score}
        </text>
        <text x="45" y="50" textAnchor="middle" fontSize="8" fill="#94A3B8">
          /10
        </text>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 700, color: labelColor }}>
        {label}
      </span>
    </div>
  );
}

function Card({ title, icon, children }) {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        <h3
          style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, empty = "None identified" }) {
  if (!items?.length)
    return (
      <p style={{ fontSize: 13, color: "#CBD5E1", fontStyle: "italic" }}>
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
        gap: 8,
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
        >
          <span style={{ color: "#CBD5E1", flexShrink: 0, marginTop: 1 }}>
            ·
          </span>
          <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function DealIntelTab({ dealIntelligence }) {
  if (!dealIntelligence) {
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
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: 4,
          }}
        >
          Deal intelligence unavailable
        </p>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>
          This section requires a completed pipeline run.
        </p>
      </div>
    );
  }

  const {
    risk_score,
    risk_factors,
    buying_signals,
    next_steps,
    competitor_mentions,
    likely_stage,
    crm_stage_guess,
  } = dealIntelligence;

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
            Deal Intelligence
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Pipeline stage, risk assessment, and next-step accountability from
            the call.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {likely_stage && (
            <span
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 999,
                padding: "5px 14px",
                fontSize: 12,
                color: "#475569",
              }}
            >
              Stage{" "}
              <span
                style={{
                  fontWeight: 700,
                  color: "#0F172A",
                  textTransform: "capitalize",
                }}
              >
                {likely_stage}
              </span>
            </span>
          )}
          {crm_stage_guess && (
            <span
              style={{
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: 999,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "#1D4ED8",
              }}
            >
              CRM: {crm_stage_guess}
            </span>
          )}
        </div>
      </div>

      {/* Top row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <Card title="Risk Score" icon="🎯">
          <div
            style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}
          >
            <RiskGauge score={risk_score} />
          </div>
        </Card>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Card title="Risk Factors" icon="⚠️">
            <BulletList
              items={risk_factors}
              empty="No risk factors identified"
            />
          </Card>
          <Card title="Buying Signals" icon="✅">
            <BulletList
              items={buying_signals}
              empty="No buying signals detected"
            />
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="Next Steps" icon="📋">
          {!next_steps?.length ? (
            <p style={{ fontSize: 13, color: "#CBD5E1", fontStyle: "italic" }}>
              No next steps identified
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {next_steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    paddingBottom: i < next_steps.length - 1 ? 12 : 0,
                    borderBottom:
                      i < next_steps.length - 1 ? "1px solid #F1F5F9" : "none",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      background: step.owner === "rep" ? "#EFF6FF" : "#F0FDF4",
                      color: step.owner === "rep" ? "#1D4ED8" : "#15803D",
                    }}
                  >
                    {step.owner === "rep" ? "Rep" : "Customer"}
                  </span>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#334155",
                        margin: "0 0 2px",
                        lineHeight: 1.45,
                      }}
                    >
                      {step.action}
                    </p>
                    {step.timing && (
                      <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
                        {step.timing}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Competitor Mentions" icon="🔭">
          {!competitor_mentions?.length ? (
            <p style={{ fontSize: 13, color: "#CBD5E1", fontStyle: "italic" }}>
              No competitors mentioned
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {competitor_mentions.map((c, i) => (
                <div
                  key={i}
                  style={{
                    paddingBottom: i < competitor_mentions.length - 1 ? 12 : 0,
                    borderBottom:
                      i < competitor_mentions.length - 1
                        ? "1px solid #F1F5F9"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0F172A",
                        textTransform: "capitalize",
                      }}
                    >
                      {c.name.replace(/_/g, " ")}
                    </span>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "2px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        background: c.handled_well ? "#F0FDF4" : "#FFF7ED",
                        color: c.handled_well ? "#15803D" : "#C2410C",
                        border: `1px solid ${c.handled_well ? "#BBF7D0" : "#FED7AA"}`,
                      }}
                    >
                      {c.handled_well ? "✓ Handled" : "✗ Not handled"}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#64748B",
                      margin: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    {c.context}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
