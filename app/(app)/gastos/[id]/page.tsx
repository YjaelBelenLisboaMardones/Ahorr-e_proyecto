import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { findExpenseById } from "@/services/budget/expense-repository";
import { formatCLP, formatFecha } from "@/lib/format";
import { deleteExpenseAction } from "../actions";

export default async function GastoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const expense = await findExpenseById(id, user.id);

  if (!expense) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/gastos"
          className="text-sm text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Volver
        </Link>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Detalle del gasto
        </h1>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Monto
        </p>
        <p className="mt-1 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          {formatCLP(Number(expense.amount))}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Descripción</dt>
            <dd className="text-zinc-950 dark:text-zinc-50">{expense.description}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Fecha</dt>
            <dd className="text-zinc-950 dark:text-zinc-50">
              {formatFecha(expense.spentAt)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Presupuesto</dt>
            <dd className="text-zinc-950 dark:text-zinc-50">
              <Link
                href={`/presupuestos/${expense.budget.id}`}
                className="underline"
              >
                {expense.budget.category ?? "General"}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Origen</dt>
            <dd className="text-zinc-950 dark:text-zinc-50">
              {expense.source === "AHORRE_PURCHASE" ? "Compra Ahorr-E" : "Manual"}
            </dd>
          </div>
        </dl>
      </section>

      <form
        action={deleteExpenseAction}
        className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950"
      >
        <input type="hidden" name="id" value={expense.id} />
        <input type="hidden" name="budgetId" value={expense.budget.id} />
        <p className="mb-3 text-sm text-red-700 dark:text-red-300">
          Eliminar este gasto. El monto volverá a estar disponible en el
          presupuesto asociado.
        </p>
        <button
          type="submit"
          className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Eliminar gasto
        </button>
      </form>
    </div>
  );
}
