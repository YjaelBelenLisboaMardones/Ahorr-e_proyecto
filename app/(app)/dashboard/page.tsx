import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { findProfileById } from "@/services/auth/profile-repository";
import { listBudgetsByProfile } from "@/services/budget/budget-repository";
import { formatCLP } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const [profile, budgets] = await Promise.all([
    findProfileById(user.id),
    listBudgetsByProfile(user.id),
  ]);

  const totalActivo = budgets.reduce((acc, b) => acc + Number(b.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Hola{profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Presupuestos activos
        </p>
        <p className="mt-1 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          {formatCLP(totalActivo)}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {budgets.length === 0
            ? "Aún no tienes presupuestos."
            : `${budgets.length} presupuesto${budgets.length === 1 ? "" : "s"} configurado${budgets.length === 1 ? "" : "s"}.`}
        </p>
        <Link
          href="/presupuestos"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {budgets.length === 0 ? "Crear el primero" : "Ver presupuestos"}
        </Link>
      </section>

      <section className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Próximamente: registro de gastos, ofertas de Falabella y recomendaciones
        de Ahorr-E.
      </section>
    </div>
  );
}
