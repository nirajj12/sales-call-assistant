import ConfidencePill from "./ConfidencePill";

const MEDDIC_FIELDS = [
  ["metrics", "Metrics"],
  ["economic_buyer", "Economic Buyer"],
  ["decision_criteria", "Decision Criteria"],
  ["decision_process", "Decision Process"],
  ["identify_pain", "Identify Pain"],
  ["champion", "Champion"],
];

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={cn(
        "surface-card interactive-card rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      <div className="mb-4">
        <h3 className="display-font text-xl font-bold tracking-[-0.03em] text-slate-950">
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function BulletList({ items, empty }) {
  const list = items?.length ? items : [empty];
  return (
    <div className="space-y-3">
      {list.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="rounded-[18px] border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function MEDDICSnapshot({ meddic }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {MEDDIC_FIELDS.map(([key, label]) => {
        const item = meddic?.[key];
        const found = Boolean(item?.value);

        return (
          <div
            key={key}
            className="surface-card interactive-card rounded-[20px] border border-slate-100 bg-slate-50/80 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <span
                  className={cn(
                    "mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    found
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                  )}
                >
                  {found ? "Found" : "Gap"}
                </span>
              </div>
              <ConfidencePill level={item?.confidence || "missing"} />
            </div>
            <p className="line-clamp-3 text-sm leading-6 text-slate-600">
              {item?.value || "No clear signal captured yet."}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ObjectionPreview({ objections, onSelectTurnId }) {
  const list = objections?.objections || [];
  const top = list.slice(0, 3);

  if (!top.length) {
    return <BulletList empty="No objections were detected in this call." />;
  }

  return (
    <div className="space-y-3">
      {top.map((item) => (
        <div
          key={item.objection_id}
          className="surface-card interactive-card rounded-[20px] border border-slate-100 bg-slate-50/80 p-4"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-semibold capitalize text-white">
              {item.category || "general"}
            </span>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600">
              {(item.handling_quality || "needs_follow_up").replaceAll("_", " ")}
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-700">“{item.text}”</p>
          {item.turn_id && (
            <button
              type="button"
              onClick={() => onSelectTurnId?.(item.turn_id)}
              className="mt-3 font-mono text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
            >
              Jump to {item.turn_id}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function CoachingPreview({ coaching }) {
  const points = coaching?.coaching_points?.slice(0, 3) || [];
  const nextSteps = coaching?.deal_summary?.next_steps?.slice(0, 3) || [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Coaching highlights
        </p>
        <BulletList
          items={points.map((item) => item.summary)}
          empty="No coaching highlights were generated."
        />
      </div>
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Next steps
        </p>
        <BulletList
          items={nextSteps}
          empty="No next steps were extracted from this call."
        />
      </div>
    </div>
  );
}

function DealSnapshot({ dealIntelligence }) {
  const riskScore = dealIntelligence?.risk_score;
  const riskTone =
    riskScore == null
      ? "bg-slate-100 text-slate-600"
      : riskScore <= 3
        ? "bg-emerald-50 text-emerald-700"
        : riskScore <= 6
          ? "bg-amber-50 text-amber-700"
          : "bg-rose-50 text-rose-700";

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="surface-card interactive-card rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Deal Health
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", riskTone)}>
            {riskScore != null ? `${riskScore}/10 risk` : "Pending"}
          </span>
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p>Stage: {dealIntelligence?.likely_stage || "Unknown"}</p>
          <p>CRM: {dealIntelligence?.crm_stage_guess || "Unknown"}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Buying signals
          </p>
          <BulletList
            items={dealIntelligence?.buying_signals?.slice(0, 3)}
            empty="No strong buying signals detected."
          />
        </div>
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Risks
          </p>
          <BulletList
            items={dealIntelligence?.risk_factors?.slice(0, 3)}
            empty="No major risks identified."
          />
        </div>
      </div>
    </div>
  );
}

export default function OverviewTab({
  analysis,
  onSelectTurnId,
}) {
  return (
    <div className="grid gap-5">
      <Panel
        title="Deal snapshot"
        subtitle="The fastest read on deal health, stage, and momentum."
      >
        <DealSnapshot dealIntelligence={analysis?.deal_intelligence} />
      </Panel>

      <Panel
        title="MEDDIC snapshot"
        subtitle="Qualification coverage at a glance before drilling into full detail."
      >
        <MEDDICSnapshot meddic={analysis?.meddic} />
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel
          title="Top objections"
          subtitle="The most important pushback surfaced from the conversation."
        >
          <ObjectionPreview
            objections={analysis?.objections}
            onSelectTurnId={onSelectTurnId}
          />
        </Panel>

        <Panel
          title="Coaching summary"
          subtitle="A compact view of rep improvement and follow-up direction."
        >
          <CoachingPreview coaching={analysis?.coaching} />
        </Panel>
      </div>
    </div>
  );
}
