import ConfidencePill from "./ConfidencePill";

const FIELDS = [
  ["metrics", "Metrics", "Quantified business impact and success criteria"],
  ["economic_buyer", "Economic Buyer", "Person with final budget authority"],
  ["decision_criteria", "Decision Criteria", "How the customer will evaluate solutions"],
  ["decision_process", "Decision Process", "Steps, sequence, and stakeholders in the decision"],
  ["identify_pain", "Identify Pain", "Business pain that makes this deal real"],
  ["champion", "Champion", "Internal advocate driving the evaluation"],
];

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function EvidenceButton({ turnId, quote, onSelectTurnId }) {
  if (!quote) return null;

  return (
    <button
      type="button"
      onClick={() => turnId && onSelectTurnId?.(turnId)}
      className={cn(
        "mt-4 block w-full rounded-[20px] border border-indigo-100 bg-indigo-50/60 p-4 text-left transition",
        turnId && "hover:border-indigo-200 hover:bg-indigo-50",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
        Evidence quote
      </p>
      <p className="mt-2 text-sm italic leading-6 text-slate-700">“{quote}”</p>
      {turnId && (
        <p className="mt-3 font-mono text-xs text-indigo-600">Jump to {turnId}</p>
      )}
    </button>
  );
}

function MEDDICCard({ fieldKey, title, description, value, evidence, onSelectTurnId }) {
  const hasValue = Boolean(value?.value);
  const verificationTone =
    evidence?.status === "verified_exact"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : evidence?.status === "verified_fuzzy"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="display-font text-xl font-bold tracking-[-0.03em] text-slate-950">
              {title}
            </h3>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                hasValue
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-amber-200 bg-amber-50 text-amber-700",
              )}
            >
              {hasValue ? "Found" : "Gap"}
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <ConfidencePill level={value?.confidence || "missing"} />
      </div>

      <div className="rounded-[22px] border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Extracted value
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          {value?.value || "No qualifying signal was extracted for this MEDDIC field yet."}
        </p>
      </div>

      {(value?.gap_flag || evidence?.status) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {value?.gap_flag && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Gap identified
            </span>
          )}
          {evidence?.status && (
            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", verificationTone)}>
              {evidence.status === "verified_exact"
                ? "Evidence verified"
                : evidence.status === "verified_fuzzy"
                  ? "Evidence loosely matched"
                  : "Evidence unverified"}
            </span>
          )}
        </div>
      )}

      <EvidenceButton
        turnId={value?.turn_id || evidence?.turn_id}
        quote={value?.evidence_anchor || evidence?.matched_text}
        onSelectTurnId={onSelectTurnId}
      />
    </div>
  );
}

export default function MEDDICTab({
  meddic,
  completeness,
  judgeResult,
  verifiedEvidence = [],
  onSelectTurnId,
}) {
  const score = completeness?.score != null ? Math.round(completeness.score) : null;
  const evidenceMap = {};
  verifiedEvidence.forEach((item) => {
    if (item.source_type === "meddic") evidenceMap[item.source_label] = item;
  });

  return (
    <section id="meddic" className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            MEDDIC
          </p>
          <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
            Qualification coverage
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Six qualification pillars with extracted value, confidence, and evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {score != null && (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
              {score}% complete
            </span>
          )}
          {judgeResult?.overall_support_strength && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium capitalize text-slate-600">
              Support: {judgeResult.overall_support_strength}
            </span>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            High confidence
          </p>
          <p className="mt-2 display-font text-3xl font-bold tracking-[-0.04em] text-slate-950">
            {completeness?.high_confidence_count ?? 0}
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Medium or better
          </p>
          <p className="mt-2 display-font text-3xl font-bold tracking-[-0.04em] text-slate-950">
            {completeness?.at_least_medium_count ?? 0}
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Gaps
          </p>
          <p className="mt-2 display-font text-3xl font-bold tracking-[-0.04em] text-slate-950">
            {completeness?.gap_elements?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {FIELDS.map(([fieldKey, title, description]) => (
          <MEDDICCard
            key={fieldKey}
            fieldKey={fieldKey}
            title={title}
            description={description}
            value={meddic?.[fieldKey]}
            evidence={evidenceMap[fieldKey]}
            onSelectTurnId={onSelectTurnId}
          />
        ))}
      </div>
    </section>
  );
}
