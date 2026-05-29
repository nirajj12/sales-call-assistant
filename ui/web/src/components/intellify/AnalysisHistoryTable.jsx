import { ArrowRight, ChevronRight } from "lucide-react";

function cn(...values) {
  return values.filter(Boolean).join(" ");
}

function statusClasses(status) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "partial") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "failed") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "running") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function formatHealth(row) {
  if (!row?.dealHealth) return "—";
  return row.dealHealth;
}

export default function AnalysisHistoryTable({
  rows = [],
  loading = false,
  emptyText = "No analyses available yet.",
  compact = false,
}) {
  if (loading) {
    return (
      <div className="grid gap-4">
        {[0, 1, 2].map((item) => (
          <div key={item} className="skeleton h-28 rounded-[24px]" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
        <p className="display-font text-2xl font-bold tracking-[-0.04em] text-slate-900">
          Nothing here yet
        </p>
        <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id || row.job_id}
            className="rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">
                  {row.source_name || "Untitled transcript"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {row.created_at
                    ? new Date(row.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Unknown date"}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                  statusClasses(row.status),
                )}
              >
                {row.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Deal health
                </p>
                <p className="mt-1 font-medium text-slate-700">{formatHealth(row)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  MEDDIC
                </p>
                <p className="mt-1 font-medium text-slate-700">
                  {row.completenessScore != null ? `${row.completenessScore}%` : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Objections
                </p>
                <p className="mt-1 font-medium text-slate-700">
                  {row.objectionsCount != null ? row.objectionsCount : "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Provider
                </p>
                <p className="mt-1 font-medium capitalize text-slate-700">
                  {row.provider_used || "—"}
                </p>
              </div>
            </div>

            <a
              href={`/analysis/${row.job_id}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {[
                "Date",
                "Status",
                "Deal Health",
                "Objections",
                "MEDDIC Completeness",
                "Open",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id || row.job_id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-6 py-5">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Unknown"}
                    </p>
                    {!compact && (
                      <p className="mt-1 text-sm text-slate-500">
                        {row.source_name || "Untitled transcript"}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                      statusClasses(row.status),
                    )}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm font-medium text-slate-700">
                  {formatHealth(row)}
                </td>
                <td className="px-6 py-5 text-sm font-medium text-slate-700">
                  {row.objectionsCount != null ? row.objectionsCount : "—"}
                </td>
                <td className="px-6 py-5 text-sm font-medium text-slate-700">
                  {row.completenessScore != null ? `${row.completenessScore}%` : "—"}
                </td>
                <td className="px-6 py-5">
                  <a
                    href={`/analysis/${row.job_id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 transition hover:text-indigo-900"
                  >
                    Open dashboard
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
