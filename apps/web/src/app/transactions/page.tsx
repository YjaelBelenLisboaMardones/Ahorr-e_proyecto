"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { WithAuth } from "@/components/WithAuth";
import { Navbar } from "@/components/Navbar";
import { financeApi } from "@/lib/ahorre-api";

type Transaction = {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  date: string;
  budgetId: string | null;
};

type Budget = {
  id: string;
  name: string;
  amount: string;
  period: "WEEKLY" | "MONTHLY" | "YEARLY";
};

function formatCLP(amount: string | number) {
  return Number(amount).toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

const inputClass =
  "bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 text-slate-800";

function TransactionsContent() {
  const { session } = useAuth();
  const token = session!.access_token;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    description: "",
    budgetId: "",
  });

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => financeApi.getTransactions(token) as Promise<Transaction[]>,
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => financeApi.getBudgets(token) as Promise<Budget[]>,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      financeApi.createTransaction(token, {
        amount: Number(form.amount),
        type: form.type,
        ...(form.description ? { description: form.description } : {}),
        ...(form.budgetId ? { budgetId: form.budgetId } : {}),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transacción registrada");
      setShowForm(false);
      setForm({ amount: "", type: "EXPENSE", description: "", budgetId: "" });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error al registrar transacción");
    },
  });

  const selectedBudget = budgets.find((b) => b.id === form.budgetId);
  const spent = selectedBudget ? getBudgetSpent(transactions, selectedBudget.id) : 0;
  const remaining = selectedBudget ? Number(selectedBudget.amount) - spent : null;

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Transacciones</h2>
            <p className="text-slate-500 text-sm mt-1">Historial de ingresos y gastos</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm ${
              showForm
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                : "bg-[#064E3B] hover:bg-emerald-900 text-white hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {showForm ? "Cancelar" : "+ Nueva"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-slate-800 mb-5">Nueva transacción</h3>
            <div className="flex flex-col gap-3">
              {/* Tipo */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((p) => ({ ...p, type: t, budgetId: "" }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      form.type === t
                        ? t === "EXPENSE"
                          ? "bg-red-500 text-white shadow-sm"
                          : "bg-emerald-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t === "EXPENSE" ? "Gasto" : "Ingreso"}
                  </button>
                ))}
              </div>

              <input
                type="number"
                placeholder="Monto (CLP)"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className={inputClass}
              />

              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className={inputClass}
              />

              {/* Selector de presupuesto — solo para gastos */}
              {form.type === "EXPENSE" && budgets.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <select
                    value={form.budgetId}
                    onChange={(e) => setForm((p) => ({ ...p, budgetId: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Sin presupuesto asignado</option>
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} — límite {formatCLP(b.amount)}
                      </option>
                    ))}
                  </select>

                  {/* Saldo restante del presupuesto seleccionado */}
                  {selectedBudget && remaining !== null && (
                    <div
                      className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                        remaining <= 0
                          ? "bg-red-50 text-red-600"
                          : remaining < Number(selectedBudget.amount) * 0.2
                            ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <span>Disponible en "{selectedBudget.name}"</span>
                      <span className="font-semibold">
                        {remaining <= 0 ? "Agotado" : formatCLP(remaining)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.amount}
                className={`py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-white mt-1 ${
                  form.type === "EXPENSE"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {createMutation.isPending ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-slate-500 text-sm mb-3">No hay transacciones todavía.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-emerald-600 text-sm font-medium hover:text-emerald-500 transition-colors"
            >
              Registrar la primera →
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((t) => {
              const budget = budgets.find((b) => b.id === t.budgetId);
              return (
                <li
                  key={t.id}
                  className="bg-white border border-slate-100 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        t.type === "INCOME" ? "bg-emerald-50" : "bg-red-50"
                      }`}
                    >
                      <span className="text-base">{t.type === "INCOME" ? "↑" : "↓"}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-800">
                        {t.description ?? (t.type === "INCOME" ? "Ingreso" : "Gasto")}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                        {budget && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                            {budget.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-base font-bold ${
                      t.type === "INCOME" ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCLP(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <WithAuth>
      <TransactionsContent />
    </WithAuth>
  );
}
