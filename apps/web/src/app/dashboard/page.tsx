"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
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
};

type Budget = {
  id: string;
  name: string;
  amount: string;
  period: string;
};

function formatCLP(amount: number) {
  return amount.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

function getMonthlyData(transactions: Transaction[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      mes: d.toLocaleDateString("es-CL", { month: "short" }),
      ingresos: 0,
      gastos: 0,
    };
  });

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) {
      if (t.type === "INCOME") bucket.ingresos += Number(t.amount);
      else bucket.gastos += Number(t.amount);
    }
  }

  return months;
}

// Formatea el eje Y abreviando miles (ej: 500k)
function formatYAxis(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCLP(p.value)}
        </p>
      ))}
    </div>
  );
}

function DashboardContent() {
  const { session, profile } = useAuth();
  const token = session!.access_token;

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: () => financeApi.getTransactions(token) as Promise<Transaction[]>,
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => financeApi.getBudgets(token) as Promise<Budget[]>,
  });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const monthlyData = getMonthlyData(transactions);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            Hola, {profile?.fullName?.split(" ")[0]}
          </h2>
          <p className="text-slate-500 text-sm mt-1">Resumen de tu situación financiera</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Balance
            </p>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {formatCLP(balance)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Ingresos
            </p>
            <p className="text-xl font-bold text-emerald-600">{formatCLP(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Gastos
            </p>
            <p className="text-xl font-bold text-red-500">{formatCLP(totalExpense)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Tasa de ahorro
            </p>
            <p className={`text-xl font-bold ${savingsRate >= 20 ? "text-emerald-600" : savingsRate >= 0 ? "text-amber-500" : "text-red-500"}`}>
              {savingsRate}%
            </p>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-1">Ingresos vs Gastos</h3>
          <p className="text-xs text-slate-400 mb-5">Últimos 6 meses</p>
          {transactions.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Sin datos aún — registrá transacciones para ver el gráfico
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Transacciones recientes */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800">Últimas transacciones</h3>
              <Link
                href="/transactions"
                className="text-xs text-emerald-600 hover:text-emerald-500 font-medium transition-colors duration-200"
              >
                Ver todas →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Sin transacciones aún</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          t.type === "INCOME" ? "bg-emerald-500" : "bg-red-400"
                        }`}
                      />
                      <span className="text-sm text-slate-700 truncate max-w-36">
                        {t.description ?? (t.type === "INCOME" ? "Ingreso" : "Gasto")}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        t.type === "INCOME" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {t.type === "INCOME" ? "+" : "-"}
                      {formatCLP(Number(t.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Presupuestos */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-800">Presupuestos activos</h3>
              <Link
                href="/budgets"
                className="text-xs text-emerald-600 hover:text-emerald-500 font-medium transition-colors duration-200"
              >
                Ver todos →
              </Link>
            </div>
            {budgets.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Sin presupuestos aún</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {budgets.slice(0, 5).map((b) => (
                  <li key={b.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 truncate max-w-36">{b.name}</span>
                    <span className="text-sm font-semibold text-slate-600">
                      {formatCLP(Number(b.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/transactions", label: "+ Transacción", cls: "bg-[#064E3B] hover:bg-emerald-900" },
            { href: "/budgets", label: "+ Presupuesto", cls: "bg-emerald-600 hover:bg-emerald-700" },
            { href: "/offers", label: "Buscar ofertas", cls: "bg-slate-700 hover:bg-slate-800" },
            { href: "/offers", label: "Recomendaciones IA", cls: "bg-violet-600 hover:bg-violet-700" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`${action.cls} text-white text-sm font-medium text-center py-3.5 px-4 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <WithAuth>
      <DashboardContent />
    </WithAuth>
  );
}
