import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { listExpensesByProfile } from "@/services/budget/expense-repository";
import { listBudgetsByProfile } from "@/services/budget/budget-repository";
import { formatCLP, formatFecha } from "@/lib/format";

export default async function GastosPage() {
  const user = await requireUser();
  const [expenses, budgets] = await Promise.all([
    listExpensesByProfile(user.id),
    listBudgetsByProfile(user.id),
  ]);

  const sinPresupuestos = budgets.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Gastos
        </h1>
        {!sinPresupuestos && (
          <Link
            href="/gastos/nuevo"
            className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            + Nuevo
          </Link>
        )}
      </div>

      {sinPresupuestos ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          <p>Necesitas un presupuesto antes de registrar gastos (RF1).</p>
          <Link
            href="/presupuestos/nuevo"
            className="mt-3 inline-block text-zinc-950 underline dark:text-zinc-50"
          >
            Crear presupuesto
          </Link>
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Aún no has registrado gastos. Toca <strong>+ Nuevo</strong> para empezar.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {expenses.map((e) => (
            <li key={e.id}>
              <Link
                href={`/gastos/${e.id}`}
                className="block rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    {e.description}
                  </span>
                  <span className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    -{formatCLP(Number(e.amount))}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{formatFecha(e.spentAt)}</span>
                  {e.budget.category && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                      {e.budget.category}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
