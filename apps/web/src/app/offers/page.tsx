"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { WithAuth } from "@/components/WithAuth";
import { Navbar } from "@/components/Navbar";
import { offersApi, financeApi } from "@/lib/ahorre-api";

type Offer = {
  name: string;
  price: number;
  originalPrice: number | undefined;
  discountPct: number | undefined;
  url: string;
  imageUrl: string | undefined;
};

type Budget = {
  id: string;
  name: string;
  amount: string;
  period: "WEEKLY" | "MONTHLY" | "YEARLY";
};

type Transaction = {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  budgetId: string | null;
  date: string;
};

type RecommendationResult = {
  query: string;
  recommendation: string;
  offersCount: number;
};

function formatCLP(amount: number) {
  return amount.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

function getBudgetSpent(transactions: Transaction[], budgetId: string): number {
  const now = new Date();
  return transactions
    .filter((t) => t.type === "EXPENSE" && t.budgetId === budgetId)
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + Number(t.amount), 0);
}

const selectClass =
  "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 text-slate-800";

function OfferCard({
  offer,
  token,
  budgets,
  transactions,
  qc,
}: {
  offer: Offer;
  token: string;
  budgets: Budget[];
  transactions: Transaction[];
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [showSelector, setShowSelector] = useState(false);
  const [budgetId, setBudgetId] = useState("");

  const selectedBudget = budgets.find((b) => b.id === budgetId);
  const spent = selectedBudget ? getBudgetSpent(transactions, selectedBudget.id) : 0;
  const remaining = selectedBudget ? Number(selectedBudget.amount) - spent : null;

  const registerMutation = useMutation({
    mutationFn: () =>
      financeApi.createTransaction(token, {
        amount: offer.price,
        type: "EXPENSE",
        description: offer.name.slice(0, 80),
        ...(budgetId ? { budgetId } : {}),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Gasto registrado en tu historial");
      setShowSelector(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el gasto");
    },
  });

  return (
    <li className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-all duration-300">
      {offer.imageUrl ? (
        <img
          src={offer.imageUrl}
          alt={offer.name}
          className="w-16 h-16 object-contain rounded-xl flex-shrink-0 bg-slate-50"
        />
      ) : (
        <div className="w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center text-slate-300 text-2xl">
          🛍
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 line-clamp-2 mb-1.5">{offer.name}</p>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-base font-bold text-slate-900">{formatCLP(offer.price)}</span>
          {offer.originalPrice && offer.originalPrice !== offer.price && (
            <span className="text-xs text-slate-400 line-through">
              {formatCLP(offer.originalPrice)}
            </span>
          )}
          {offer.discountPct && offer.discountPct > 0 && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-lg">
              -{offer.discountPct}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap mb-2">
          {offer.url && (
            <a
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
            >
              Buscar en Google Shopping →
            </a>
          )}
          {!registerMutation.isSuccess && (
            <button
              onClick={() => setShowSelector((v) => !v)}
              disabled={registerMutation.isPending}
              className="text-xs font-semibold px-3 py-1 rounded-lg transition-all duration-200 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 disabled:opacity-50"
            >
              {showSelector ? "Cancelar" : "Registrar como gasto"}
            </button>
          )}
          {registerMutation.isSuccess && (
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700">
              ✓ Registrado
            </span>
          )}
        </div>

        {showSelector && !registerMutation.isSuccess && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            {budgets.length > 0 && (
              <>
                <select
                  value={budgetId}
                  onChange={(e) => setBudgetId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Sin presupuesto asignado</option>
                  {budgets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — límite {formatCLP(Number(b.amount))}
                    </option>
                  ))}
                </select>

                {selectedBudget && remaining !== null && (
                  <div
                    className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-lg ${
                      remaining <= 0
                        ? "bg-red-50 text-red-600"
                        : remaining < Number(selectedBudget.amount) * 0.2
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <span>Disponible en &quot;{selectedBudget.name}&quot;</span>
                    <span className="font-semibold">
                      {remaining <= 0 ? "Agotado" : formatCLP(remaining)}
                    </span>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => registerMutation.mutate()}
              disabled={registerMutation.isPending}
              className="py-2 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-all duration-200 disabled:opacity-50"
            >
              {registerMutation.isPending ? "Registrando..." : "Confirmar gasto"}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function OffersContent() {
  const { session } = useAuth();
  const token = session!.access_token;
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => financeApi.getBudgets(token) as Promise<Budget[]>,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => financeApi.getTransactions(token) as Promise<Transaction[]>,
  });

  const searchMutation = useMutation({
    mutationFn: (q: string) => offersApi.searchOffers(token, q) as Promise<Offer[]>,
    onSuccess: (data) => {
      setOffers(data);
      setRecommendation(null);
      if (data.length === 0) toast.info("No se encontraron ofertas para esa búsqueda");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error al buscar ofertas");
    },
  });

  const recommendMutation = useMutation({
    mutationFn: () => offersApi.getRecommendations(token, { query }),
    onSuccess: (data) => setRecommendation(data),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error al generar recomendaciones");
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate(query.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Buscador de ofertas</h2>
          <p className="text-slate-500 text-sm mt-1">
            Buscá productos, comparálos y registrá tus gastos directamente
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: laptop, auriculares, tv..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 text-slate-800 shadow-sm"
          />
          <button
            type="submit"
            disabled={searchMutation.isPending || !query.trim()}
            className="bg-[#064E3B] hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            {searchMutation.isPending ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {/* AI button */}
        {offers.length > 0 && !recommendation && (
          <button
            onClick={() => recommendMutation.mutate()}
            disabled={recommendMutation.isPending}
            className="w-full mb-6 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {recommendMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>✦ Analizar con IA Gemini</>
            )}
          </button>
        )}

        {/* AI recommendation */}
        {recommendation && (
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/60 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                ✦
              </div>
              <span className="text-violet-700 font-semibold text-sm">Recomendación Gemini IA</span>
              <span className="text-xs text-violet-400 ml-auto">
                {recommendation.offersCount} productos analizados
              </span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {recommendation.recommendation}
            </p>
          </div>
        )}

        {/* Results */}
        {offers.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-4">
              {offers.length} resultados — &quot;{query}&quot;
            </p>
            <ul className="flex flex-col gap-3">
              {offers.map((offer, i) => (
                <OfferCard
                  key={i}
                  offer={offer}
                  token={token}
                  budgets={budgets}
                  transactions={transactions}
                  qc={qc}
                />
              ))}
            </ul>
          </div>
        )}

        {!searchMutation.isPending && offers.length === 0 && !searchMutation.isIdle && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Sin resultados. Intentá con otro término.
          </div>
        )}
      </main>
    </div>
  );
}

export default function OffersPage() {
  return (
    <WithAuth>
      <OffersContent />
    </WithAuth>
  );
}
