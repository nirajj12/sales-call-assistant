function toSentence(text) {
  if (!text) return "";
  return text.endsWith(".") ? text : `${text}.`;
}

function listOrFallback(items, fallback) {
  return items?.length ? items : [fallback];
}

function SectionCard({ title, items, accent = "indigo", onSelectTurnId }) {
  const accentClass =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : accent === "amber"
        ? "bg-amber-50 text-amber-700"
        : accent === "rose"
          ? "bg-rose-50 text-rose-700"
          : "bg-indigo-50 text-indigo-700";

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${accentClass}`}>
        {title}
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-sm leading-7 text-slate-700">{item.text}</p>
            {item.turnIds?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.turnIds.map((turnId) => (
                  <button
                    key={turnId}
                    type="button"
                    onClick={() => onSelectTurnId?.(turnId)}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-mono text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
                  >
                    {turnId}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CoachingTab({ coaching, onSelectTurnId }) {
  if (!coaching) {
    return (
      <section id="coaching" className="rounded-[32px] border border-slate-200/70 bg-white/90 p-10 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
        <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
          Coaching
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Coaching output becomes available after the full pipeline completes.
        </p>
      </section>
    );
  }

  const whatWentWell = listOrFallback(
    [
      coaching.talk_ratio?.assessment
        ? { text: toSentence(coaching.talk_ratio.assessment) }
        : null,
      ...(coaching.deal_summary?.buying_signals || []).map((item) => ({ text: toSentence(item) })),
    ].filter(Boolean),
    { text: "No clear strengths were captured in this call." },
  );

  const missedOpportunities = listOrFallback(
    [
      ...(coaching.coaching_points || []).map((item) => ({
        text: toSentence(item.summary),
        turnIds: item.evidence_turn_ids,
      })),
      ...(coaching.deal_summary?.risks || []).map((item) => ({
        text: `Risk to address: ${toSentence(item)}`,
      })),
    ].filter(Boolean),
    { text: "No major missed opportunities were identified." },
  );

  const recommendedNextSteps = listOrFallback(
    (coaching.deal_summary?.next_steps || []).map((item) => ({
      text: toSentence(item),
    })),
    { text: "No explicit next steps were extracted from the call." },
  );

  const suggestedFollowUpPoints = listOrFallback(
    [
      ...(coaching.question_stats?.open_questions || []).slice(0, 4).map((item) => ({
        text: `Follow up on: ${toSentence(item)}`,
      })),
      ...(coaching.question_stats?.closed_questions || []).slice(0, 2).map((item) => ({
        text: `Re-open this area with a deeper question: ${toSentence(item)}`,
      })),
    ],
    { text: "No follow-up prompts were generated." },
  );

  return (
    <section id="coaching" className="rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.05)]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Coaching
          </p>
          <h2 className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-950">
            Rep guidance and follow-up direction
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Convert transcript insights into coaching signals and next-step preparation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            {coaching.question_stats?.total_questions ?? 0} questions
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
            {Math.round(coaching.talk_ratio?.rep_percentage || 0)}% rep talk
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="What went well" items={whatWentWell} accent="emerald" onSelectTurnId={onSelectTurnId} />
        <SectionCard title="Missed opportunities" items={missedOpportunities} accent="amber" onSelectTurnId={onSelectTurnId} />
        <SectionCard title="Recommended next steps" items={recommendedNextSteps} accent="indigo" onSelectTurnId={onSelectTurnId} />
        <SectionCard title="Suggested follow-up points" items={suggestedFollowUpPoints} accent="rose" onSelectTurnId={onSelectTurnId} />
      </div>
    </section>
  );
}
