"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { WithAuth } from "@/components/WithAuth";
import { Navbar } from "@/components/Navbar";
import { financeApi } from "@/lib/ahorre-api";

type Budget = {
  id: string;
  name: string;
  amount: string;
  period: "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate: string;
};

const PERIOD_LABELS: Record<string, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

const PERIOD_COLORS: Record<string, string> = {
  WEEKLY: "bg-amber-100 text-amber-700",
  MONTHLY: "bg-emerald-100 text-emerald-700",
  YEARLY: "bg-violet-100 text-violet-700",
};

function formatCLP(amount: string | number) {
  return Number(amount).toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

const inputClass =
  "bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-300 text-slate-800";

function BudgetsContent() {
  const { session } = useAuth();
  const token = session!.access_token;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    period: "MONTHLY" as "WEEKLY" | "MONTHLY" | "YEARLY",
    startDate: new Date().toISOString().split("T")[0] ?? "",
  });

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => financeApi.getBudgets(token) as Promise<Budget[]>,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      financeApi.createBudget(token, {
        name: form.name,
        amount: Number(form.amount),
        period: form.period,
        startDate: new Date(form.startDate).toISOString(),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Presupuesto creado");
      setShowForm(false);
      setForm({
        name: "",
        amount: "",
        period: "MONTHLY",
        startDate: new Date().toISOString().split("T")[0] ?? "",
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error al crear presupuesto");
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Presupuestos</h2>
            <p className="text-slate-500 text-sm mt-1">Controlá tus límites de gasto</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm ${
              showForm
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {showForm ? "Cancelar" : "+ Nuevo"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-slate-800 mb-5">Nuevo presupuesto</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nombre (ej: Alimentación)"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Monto (CLP)"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className={inputClass}
              />
              <select
                value={form.period}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    period: e.target.value as "WEEKLY" | "MONTHLY" | "YEARLY",
                  }))
                }
                className={inputClass}
              >
                <option value="WEEKLY">Semanal</option>
                <option value="MONTHLY">Mensual</option>
                <option value="YEARLY">Anual</option>
              </select>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className={inputClass}
              />
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.name || !form.amount}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 mt-1"
              >
                {createMutation.isPending ? "Guardando..." : "Guardar presupuesto"}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-slate-500 text-sm mb-3">No tenés presupuestos todavía.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-emerald-600 text-sm font-medium hover:text-emerald-500 transition-colors"
            >
              Crear el primero →
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {budgets.map((b) => (
              <li
                key={b.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💰</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{b.name}</p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md mt-0.5 inline-block ${PERIOD_COLORS[b.period] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {PERIOD_LABELS[b.period]}
                    </span>
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-800">{formatCLP(b.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <WithAuth>
      <BudgetsContent />
    </WithAuth>
  );
}
