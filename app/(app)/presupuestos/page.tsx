import Link from "next/link";
import { requireUser } from "@/app/lib/supabase/auth";
import { listBudgetsByProfile } from "@/services/budget/budget-repository";
import { formatCLP, formatFecha } from "@/app/lib/format";

export default async function PresupuestosPage() {
  const user = await requireUser();
  const budgets = await listBudgetsByProfile(user.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Presupuestos
        </h1>
        <Link
          href="/presupuestos/nuevo"
          className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          + Nuevo
        </Link>
      </div>

      {budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Aún no tienes presupuestos. Crea el primero para empezar a registrar
          gastos.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {budgets.map((b) => (
            <li key={b.id}>
              <Link
                href={`/presupuestos/${b.id}`}
                className="block rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                    {formatCLP(Number(b.amount))}
                  </span>
                  {b.category && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {b.category}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatFecha(b.periodStart)} → {formatFecha(b.periodEnd)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
