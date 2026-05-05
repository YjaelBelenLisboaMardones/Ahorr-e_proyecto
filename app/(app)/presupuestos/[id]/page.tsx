import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { findBudgetById } from "@/services/budget/budget-repository";
import { listExpensesByBudget } from "@/services/budget/expense-repository";
import { getBudgetStatus } from "@/services/budget/budget-status";
import { formatCLP, formatFecha, toDateInputValue } from "@/lib/format";
import { EditBudgetForm } from "./edit-form";
import { deleteBudgetAction } from "../actions";

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [budget, status, expenses] = await Promise.all([
    findBudgetById(id, user.id),
    getBudgetStatus(id, user.id),
    listExpensesByBudget(id, user.id),
  ]);

  if (!budget || !status) notFound();

  const usedPct = Math.min(100, Math.round(status.usedPercent));
  const tone =
    status.usedPercent >= 100
      ? "bg-red-500"
      : status.usedPercent >= 80
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/presupuestos"
          className="text-sm text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          {budget.category ?? "Presupuesto"}
        </h1>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Gastado / Total
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{usedPct}%</span>
        </div>
        <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {formatCLP(status.spent)}{" "}
          <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">
            / {formatCLP(status.amount)}
          </span>
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className={`h-full ${tone}`} style={{ width: `${usedPct}%` }} />
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {status.remaining > 0
            ? `Te quedan ${formatCLP(status.remaining)} disponibles.`
            : `Te excediste por ${formatCLP(Math.abs(status.remaining))}.`}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Editar presupuesto
        </h2>
        <EditBudgetForm
          id={budget.id}
          defaults={{
            amount: Number(budget.amount),
            periodStart: toDateInputValue(budget.periodStart),
            periodEnd: toDateInputValue(budget.periodEnd),
            category: budget.category ?? "",
          }}
        />
      </section>

      {expenses.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Gastos asociados ({expenses.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm shadow-sm dark:bg-zinc-900"
              >
                <Link href={`/gastos/${e.id}`} className="flex-1">
                  <span className="block text-zinc-950 dark:text-zinc-50">
                    {e.description}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {formatFecha(e.spentAt)}
                  </span>
                </Link>
                <span className="ml-3 font-medium text-zinc-950 dark:text-zinc-50">
                  -{formatCLP(Number(e.amount))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form
        action={deleteBudgetAction}
        className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950"
      >
        <input type="hidden" name="id" value={budget.id} />
        <p className="mb-3 text-sm text-red-700 dark:text-red-300">
          Eliminar este presupuesto. {expenses.length > 0 && "Hay gastos asociados que también se verán afectados."} Esta acción no se puede deshacer.
        </p>
        <button
          type="submit"
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Eliminar presupuesto
        </button>
      </form>
    </div>
  );
}
