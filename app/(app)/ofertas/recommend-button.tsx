"use client";

import { useState } from "react";

type RecommendationResult = {
  query: string;
  productosUsados: number;
  presupuestoDisponible: number | null;
  recommendation: string;
  source: "cache" | "live" | "stale-fallback" | "no-data";
};

export function RecommendButton({ query }: { query: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/recomendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data: RecommendationResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="self-start rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
      >
        {loading ? "💭 Pensando..." : "💡 Recomendar con IA"}
      </button>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm dark:border-violet-900 dark:bg-violet-950">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Recomendación de Ahorr-E (basada en {result.productosUsados}{" "}
            producto{result.productosUsados === 1 ? "" : "s"}
            {result.presupuestoDisponible !== null &&
              ` y tu presupuesto disponible`}
            )
          </p>
          <p className="whitespace-pre-wrap text-violet-950 dark:text-violet-100">
            {result.recommendation}
          </p>
          <p className="mt-3 text-xs text-violet-600 dark:text-violet-400">
            Grounding: solo se le pasaron al modelo los productos del caché y tu
            saldo de presupuesto. No usa conocimiento general (RF3).
          </p>
        </div>
      )}
    </div>
  );
}
