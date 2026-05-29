"use client";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowLeft, History, Sparkles } from "lucide-react";
import AnalysisHistoryTable from "@/components/intellify/AnalysisHistoryTable";
import AppFooter from "@/components/intellify/AppFooter";

function getDealHealth(riskScore) {
  if (riskScore == null) return "—";
  if (riskScore <= 3) return "Healthy";
  if (riskScore <= 6) return "Watchlist";
  return "At Risk";
}

export default function HistoryPage() {
  const { data: analysesData, isLoading } = useQuery({
    queryKey: ["analyses", "history"],
    queryFn: async () => {
      const response = await fetch("/api/proxy/analyses?limit=20");
      if (!response.ok) throw new Error("Failed to load analysis history.");
      return response.json();
    },
  });

  const analyses = analysesData?.data || [];
  const detailQueries = useQueries({
    queries: analyses.map((row) => ({
      queryKey: ["analysis-history-detail", row.id],
      queryFn: async () => {
        const response = await fetch(`/api/proxy/analysis/${row.id}`);
        if (!response.ok) throw new Error("Failed to load analysis detail.");
        return response.json();
      },
      enabled: Boolean(row.id),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const rows = analyses.map((row, index) => {
    const detail = detailQueries[index]?.data?.data;
    return {
      ...row,
      completenessScore:
        row.completeness_score != null ? Math.round(row.completeness_score) : null,
      objectionsCount: detail?.objections?.objections?.length,
      dealHealth: getDealHealth(detail?.deal_intelligence?.risk_score),
    };
  });

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-4 no-underline">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-[0_14px_34px_rgba(99,102,241,0.24)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="display-font text-lg font-bold tracking-[-0.04em]">
                SalesSignal AI
              </p>
              <p className="text-sm text-slate-500">Analysis history</p>
            </div>
          </a>

          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,255,255,0.76))] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
            <History className="h-3.5 w-3.5" />
            Recent analyses
          </div>
          <h1 className="display-font text-4xl font-bold tracking-[-0.05em] text-slate-950">
            Review past transcript analyses
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Browse recent runs, compare outcomes, and reopen any dashboard to inspect MEDDIC, objections, coaching, and evidence in detail.
          </p>
        </section>

        <section className="mt-8">
          <AnalysisHistoryTable
            rows={rows}
            loading={isLoading}
            emptyText="No saved analyses were found yet."
          />
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
