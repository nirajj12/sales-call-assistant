"use client";
import { useState } from "react";

export default function RawJsonTab({ data }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);
  const kb = (json.length / 1024).toFixed(1);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intellify-${data?.id || data?.source_name?.replace(/\s+/g, "-") || "analysis"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
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
            Raw JSON
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            Full analysis payload as returned by the pipeline. {kb} KB.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#F0FDF4" : "#FFFFFF",
              border: `1px solid ${copied ? "#BBF7D0" : "#E2E8F0"}`,
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              color: copied ? "#15803D" : "#475569",
              cursor: "pointer",
              transition: "all 150ms",
              fontFamily: "inherit",
            }}
          >
            {copied ? "✓ Copied!" : "Copy JSON"}
          </button>
          <button
            onClick={handleDownload}
            style={{
              background: "#2563EB",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#FFFFFF",
              cursor: "pointer",
              transition: "background 150ms",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1D4ED8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2563EB")}
          >
            Download .json
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 5 }}>
            {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
              <span
                key={c}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: c,
                  display: "inline-block",
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#94A3B8", marginLeft: 6 }}>
            application/json
          </span>
          <span style={{ fontSize: 12, color: "#CBD5E1" }}>·</span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{kb} KB</span>
        </div>
        <pre
          style={{
            margin: 0,
            padding: "20px 24px",
            fontSize: 12,
            color: "#334155",
            lineHeight: 1.65,
            fontFamily:
              "ui-monospace, 'Cascadia Code', 'JetBrains Mono', monospace",
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: 580,
          }}
        >
          {json}
        </pre>
      </div>
    </div>
  );
}
