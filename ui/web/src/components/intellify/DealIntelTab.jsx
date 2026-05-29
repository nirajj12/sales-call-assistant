function BulletGroup({ title, items, empty }) {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <h3 className="display-font text-xl font-bold tracking-[-0.03em] text-slate-950">
        {title}
      </h3>
      <div className="mt-4 space-y-3">
        {(items?.length ? items : [empty]).map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4 text-sm leading-7 text-slate-700">
            {typeof item === "string" ? item : item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DealIntelTab({ dealIntelligence }) {
  if (!dealIntelligence) {
    return (
      <section id="deal-intel" className="rounded-[32px] border border-slate-200/70 bg-white/90 p-10 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
        <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
          Deal intelligence
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Deal intelligence becomes available after the full pipeline completes.
        </p>
      </section>
    );
  }

  const riskScore = dealIntelligence.risk_score;
  const riskTone =
    riskScore <= 3
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : riskScore <= 6
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  const forecastNotes = [
    `Likely stage: ${dealIntelligence.likely_stage || "Not inferred"}`,
    `CRM stage guess: ${dealIntelligence.crm_stage_guess || "Not inferred"}`,
    ...(dealIntelligence.competitor_mentions || []).map(
      (item) => `${item.name}: ${item.context}`,
    ),
  ];

  const dealSummary = [
    `Current deal risk is ${riskScore}/10.`,
    `Likely stage sits around ${dealIntelligence.likely_stage || "an undefined stage"}.`,
    `CRM fit looks closest to ${dealIntelligence.crm_stage_guess || "an undefined stage"}.`,
  ];

  return (
    <section id="deal-intel" className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Deal intelligence
          </p>
          <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
            Forecast signals and next actions
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Summarized deal posture, buying momentum, risk signals, and what should happen next.
          </p>
        </div>
        <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${riskTone}`}>
          Risk score {riskScore}/10
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <BulletGroup
          title="Deal summary"
          items={dealSummary}
          empty="No summary available."
        />
        <BulletGroup
          title="Buying signals"
          items={dealIntelligence.buying_signals}
          empty="No buying signals detected."
        />
        <BulletGroup
          title="Risks"
          items={dealIntelligence.risk_factors}
          empty="No major risks identified."
        />
        <BulletGroup
          title="Next best actions"
          items={(dealIntelligence.next_steps || []).map((step) =>
            `${step.owner === "rep" ? "Rep" : "Customer"}: ${step.action}${step.timing ? ` (${step.timing})` : ""}`,
          )}
          empty="No next best actions extracted."
        />
        <div className="xl:col-span-2">
          <BulletGroup
            title="Forecast notes"
            items={forecastNotes}
            empty="No forecast notes available."
          />
        </div>
      </div>
    </section>
  );
}
