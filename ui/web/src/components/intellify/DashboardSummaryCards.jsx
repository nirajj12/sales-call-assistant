import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  MessageSquareWarning,
  Sparkles,
} from "lucide-react";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function getDealHealth(riskScore) {
  if (riskScore == null) return { label: "Pending", tone: "slate" };
  if (riskScore <= 3) return { label: "Healthy", tone: "emerald" };
  if (riskScore <= 6) return { label: "Watchlist", tone: "amber" };
  return { label: "At Risk", tone: "rose" };
}

function getConfidence(analysis) {
  const exactMatches =
    analysis?.verified_evidence?.filter((item) => item.status === "verified_exact")
      .length || 0;
  const totalEvidence = analysis?.verified_evidence?.length || 0;

  if (!totalEvidence) return { label: "Building", tone: "slate" };

  const ratio = exactMatches / totalEvidence;
  if (ratio >= 0.7) return { label: "High", tone: "emerald" };
  if (ratio >= 0.4) return { label: "Medium", tone: "amber" };
  return { label: "Low", tone: "rose" };
}

function toneClasses(tone) {
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (tone === "amber") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (tone === "rose") return "bg-rose-50 text-rose-700 ring-rose-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function SummaryCard({ icon: Icon, label, value, hint, tone = "indigo" }) {
  const toneClass =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
      : toneClasses(tone);

  return (
    <div className="surface-card interactive-card rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-center gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl ring-1", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <p className="display-font text-3xl font-bold tracking-[-0.05em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

export default function DashboardSummaryCards({ analysis }) {
  const health = getDealHealth(analysis?.deal_intelligence?.risk_score);
  const confidence = getConfidence(analysis);
  const meddic = analysis?.completeness?.score != null
    ? `${Math.round(analysis.completeness.score)}%`
    : "N/A";
  const objections = analysis?.objections?.objections?.length ?? 0;
  const coachingItems = analysis?.coaching?.coaching_points?.length ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        icon={BarChart3}
        label="Deal Health"
        value={health.label}
        hint="Risk-adjusted deal outlook"
        tone={health.tone}
      />
      <SummaryCard
        icon={BadgeCheck}
        label="MEDDIC Completeness"
        value={meddic}
        hint="Qualification coverage score"
      />
      <SummaryCard
        icon={MessageSquareWarning}
        label="Objections Found"
        value={String(objections)}
        hint="Signals needing response or follow-up"
        tone={objections > 0 ? "amber" : "emerald"}
      />
      <SummaryCard
        icon={Sparkles}
        label="Coaching Items"
        value={String(coachingItems)}
        hint="Moments to reinforce or improve"
        tone={coachingItems > 0 ? "indigo" : "slate"}
      />
      <SummaryCard
        icon={AlertTriangle}
        label="Confidence"
        value={confidence.label}
        hint="Evidence verification quality"
        tone={confidence.tone}
      />
    </div>
  );
}
