import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { findProfileById } from "@/services/auth/profile-repository";
import { listBudgetsByProfile } from "@/services/budget/budget-repository";
import { listExpensesByProfile } from "@/services/budget/expense-repository";
import { formatCLP } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const [profile, budgets, expenses] = await Promise.all([
    findProfileById(user.id),
    listBudgetsByProfile(user.id),
    listExpensesByProfile(user.id),
  ]);

  const totalPresupuestado = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalGastado = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const restante = totalPresupuestado - totalGastado;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Hola{profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card
          label="Presupuestado"
          value={formatCLP(totalPresupuestado)}
          tone="text-zinc-950 dark:text-zinc-50"
        />
        <Card
          label="Gastado"
          value={formatCLP(totalGastado)}
          tone="text-red-600 dark:text-red-400"
        />
        <Card
          label="Restante"
          value={formatCLP(restante)}
          tone={
            restante < 0
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400"
          }
        />
        <Card
          label="Movimientos"
          value={`${expenses.length}`}
          tone="text-zinc-950 dark:text-zinc-50"
        />
      </section>

      <section className="flex gap-3">
        <Link
          href="/presupuestos"
          className="flex-1 rounded-full bg-zinc-950 px-4 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {budgets.length === 0 ? "Crear presupuesto" : "Presupuestos"}
        </Link>
        <Link
          href="/gastos"
          className="flex-1 rounded-full border border-zinc-300 px-4 py-3 text-center text-sm font-medium text-zinc-950 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          Gastos
        </Link>
      </section>

      <section className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Próximamente: ofertas de Falabella y recomendaciones de Ahorr-E.
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-zinc-900">
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
