"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function RootLayout({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <html lang="en">
      <head>
        <title>SalesSignal AI</title>
        <meta
          name="description"
          content="A clean sales-call intelligence workspace for transcript analysis, MEDDIC scoring, coaching, and deal signals."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          :root {
            color-scheme: light;
            --bg: #f4f6fb;
            --panel: rgba(255, 255, 255, 0.82);
            --panel-solid: #ffffff;
            --line: rgba(148, 163, 184, 0.2);
            --line-strong: rgba(71, 85, 105, 0.2);
            --text: #0f172a;
            --muted: #5b6476;
            --subtle: #8c98ab;
            --brand: #4f46e5;
            --brand-strong: #4338ca;
            --brand-soft: rgba(79, 70, 229, 0.12);
            --accent: #7c3aed;
            --shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
          }
          html { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
          body {
            background:
              radial-gradient(circle at top left, rgba(99, 102, 241, 0.16), transparent 30%),
              radial-gradient(circle at top right, rgba(168, 85, 247, 0.12), transparent 26%),
              radial-gradient(circle at bottom left, rgba(56, 189, 248, 0.1), transparent 22%),
              linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
            color: var(--text);
            -webkit-font-smoothing: antialiased;
            margin: 0;
            padding: 0;
          }
          h1, h2, h3, .display-font { font-family: 'Space Grotesk', 'Plus Jakarta Sans', sans-serif; }
          a { color: inherit; }
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 9999px; }
          ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes shimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes floatY {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes pulseSoft {
            0%, 100% { box-shadow: 0 12px 30px rgba(99, 102, 241, 0.18); }
            50% { box-shadow: 0 16px 38px rgba(99, 102, 241, 0.28); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(15, 118, 110, 0.16); }
            50% { box-shadow: 0 0 0 10px rgba(15, 118, 110, 0); }
          }
          .animate-fadein { animation: fadeIn 0.25s ease both; }
          .skeleton { background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%); background-size: 400px 100%; animation: shimmer 1.4s infinite; }
          .surface-card {
            position: relative;
            overflow: hidden;
            transition: transform 180ms ease, box-shadow 220ms ease, border-color 220ms ease, background-color 220ms ease;
          }
          .surface-card::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(135deg, rgba(255,255,255,0.52), transparent 38%, transparent 62%, rgba(99,102,241,0.04));
            opacity: 0.7;
          }
          .interactive-card:hover {
            transform: translateY(-3px);
            border-color: rgba(129, 140, 248, 0.32);
            box-shadow: 0 24px 55px rgba(15, 23, 42, 0.1);
          }
          .brand-orb {
            animation: pulseSoft 3s ease-in-out infinite;
          }
          .micro-float:hover {
            animation: floatY 1.8s ease-in-out infinite;
          }
          .tab-chip {
            transition: transform 160ms ease, background-color 180ms ease, color 180ms ease, box-shadow 200ms ease;
          }
          .tab-chip:hover {
            transform: translateY(-1px);
          }
          .button-elevated {
            transition: transform 180ms ease, box-shadow 220ms ease, background-color 180ms ease, border-color 180ms ease;
          }
          .button-elevated:hover {
            transform: translateY(-1px);
          }
        `}</style>
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
