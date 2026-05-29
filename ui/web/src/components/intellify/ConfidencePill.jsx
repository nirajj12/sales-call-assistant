const CONFIG = {
  high: {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    color: "#15803D",
    dot: "#22C55E",
    label: "High",
  },
  medium: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    color: "#B45309",
    dot: "#F59E0B",
    label: "Medium",
  },
  low: {
    bg: "#FFF7ED",
    border: "#FED7AA",
    color: "#C2410C",
    dot: "#F97316",
    label: "Low",
  },
  missing: {
    bg: "#F8FAFC",
    border: "#E2E8F0",
    color: "#64748B",
    dot: "#CBD5E1",
    label: "Missing",
  },
};

export default function ConfidencePill({ level }) {
  const c = CONFIG[level] || CONFIG.missing;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: c.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}
