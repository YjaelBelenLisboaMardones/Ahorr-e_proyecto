import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { findBudgetById } from "@/services/budget/budget-repository";
import { toDateInputValue } from "@/lib/format";
import { EditBudgetForm } from "./edit-form";
import { deleteBudgetAction } from "../actions";

export default async function EditarPresupuestoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const budget = await findBudgetById(id, user.id);

  if (!budget) notFound();

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
          Editar presupuesto
        </h1>
      </div>

      <EditBudgetForm
        id={budget.id}
        defaults={{
          amount: Number(budget.amount),
          periodStart: toDateInputValue(budget.periodStart),
          periodEnd: toDateInputValue(budget.periodEnd),
          category: budget.category ?? "",
        }}
      />

      <form action={deleteBudgetAction} className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <input type="hidden" name="id" value={budget.id} />
        <p className="mb-3 text-sm text-red-700 dark:text-red-300">
          Eliminar este presupuesto. Esta acción no se puede deshacer.
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
