const ROLE_STYLES = {
  rep: {
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    marker: "bg-indigo-500",
  },
  customer: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    marker: "bg-emerald-500",
  },
  unknown: {
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    marker: "bg-slate-400",
  },
};

const EVIDENCE_STYLES = {
  verified_exact: "border-emerald-200 bg-emerald-50 text-emerald-700",
  verified_fuzzy: "border-sky-200 bg-sky-50 text-sky-700",
  unverified: "border-rose-200 bg-rose-50 text-rose-700",
};

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export default function TranscriptTab({
  transcript,
  verifiedEvidence = [],
  selectedTurnId = null,
  onSelectTurnId,
}) {
  const turns = transcript?.normalized_turns || transcript?.turns || [];
  const repWords = transcript?.metrics?.rep_word_count || 0;
  const customerWords = transcript?.metrics?.customer_word_count || 0;
  const totalWords = repWords + customerWords;

  if (!turns.length) {
    return (
      <section className="rounded-[32px] border border-slate-200/70 bg-white/90 p-10 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
        <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
          Evidence viewer unavailable
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          No normalized transcript turns were found in this analysis.
        </p>
      </section>
    );
  }

  const evidenceByTurn = {};
  verifiedEvidence.forEach((item) => {
    if (!item.turn_id) return;
    if (!evidenceByTurn[item.turn_id]) evidenceByTurn[item.turn_id] = [];
    evidenceByTurn[item.turn_id].push(item);
  });

  return (
    <section id="evidence" className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Evidence viewer
          </p>
          <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
            Transcript and supporting turns
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Click evidence chips in the dashboard to highlight the matching turn
            here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
            {turns.length} turns
          </span>
          {totalWords > 0 && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
              {repWords} rep words · {customerWords} customer words
            </span>
          )}
        </div>
      </div>

      {totalWords > 0 && (
        <div className="mb-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
            <span>Conversation balance</span>
            <span>{Math.round((repWords / totalWords) * 100)}% rep talk share</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
              style={{ width: `${Math.round((repWords / totalWords) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {turns.map((turn, index) => {
          const role = ROLE_STYLES[turn.speaker_role] || ROLE_STYLES.unknown;
          const evidence = evidenceByTurn[turn.turn_id] || [];
          const isSelected = selectedTurnId && selectedTurnId === turn.turn_id;

          return (
            <button
              key={turn.turn_id || index}
              type="button"
              onClick={() => onSelectTurnId?.(turn.turn_id)}
              className={cn(
                "w-full rounded-[24px] border p-5 text-left transition",
                isSelected
                  ? "border-indigo-300 bg-indigo-50/70 shadow-[0_0_0_4px_rgba(99,102,241,0.08)]"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60",
              )}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                    role.badge,
                  )}
                >
                  {turn.speaker_role || "unknown"}
                </span>
                <span className="text-sm text-slate-500">
                  {turn.speaker_label || "Speaker"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-xs text-slate-400">{turn.turn_id}</span>
                {turn.word_count != null && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{turn.word_count} words</span>
                  </>
                )}
                <span className={cn("ml-auto h-2.5 w-2.5 rounded-full", role.marker)} />
              </div>

              <p className="text-sm leading-7 text-slate-700">{turn.text}</p>

              {evidence.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {evidence.map((item, evidenceIndex) => (
                    <span
                      key={`${turn.turn_id}-${evidenceIndex}`}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        EVIDENCE_STYLES[item.status] || EVIDENCE_STYLES.unverified,
                      )}
                    >
                      {item.source_label}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
