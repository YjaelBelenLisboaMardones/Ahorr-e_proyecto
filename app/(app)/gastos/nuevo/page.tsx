import Link from "next/link";
import { requireUser } from "@/app/lib/supabase/auth";
import { listBudgetsByProfile } from "@/services/budget/budget-repository";
import { sumExpensesByBudget } from "@/services/budget/expense-repository";
import { toDateInputValue } from "@/app/lib/format";
import { ExpenseForm } from "./expense-form";

export default async function NuevoGastoPage() {
  const user = await requireUser();
  const budgets = await listBudgetsByProfile(user.id);

  // Calculamos saldo restante por presupuesto para mostrar en el dropdown.
  const budgetsWithRemaining = await Promise.all(
    budgets.map(async (b) => {
      const spent = await sumExpensesByBudget(b.id, user.id);
      const amount = Number(b.amount);
      return {
        id: b.id,
        amount,
        category: b.category,
        remaining: amount - spent,
      };
    }),
  );

  // Solo ofrecemos presupuestos con saldo disponible (RF7).
  const disponibles = budgetsWithRemaining.filter((b) => b.remaining > 0);

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
          Nuevo gasto
        </h1>
      </div>

      {disponibles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {budgets.length === 0 ? (
            <>
              <p>No tienes presupuestos. Crea uno antes de registrar gastos.</p>
              <Link
                href="/presupuestos/nuevo"
                className="mt-3 inline-block text-zinc-950 underline dark:text-zinc-50"
              >
                Crear presupuesto
              </Link>
            </>
          ) : (
            <>
              <p>Todos tus presupuestos están agotados.</p>
              <Link
                href="/presupuestos"
                className="mt-3 inline-block text-zinc-950 underline dark:text-zinc-50"
              >
                Revisar presupuestos
              </Link>
            </>
          )}
        </div>
      ) : (
        <ExpenseForm
          budgets={disponibles}
          defaultDate={toDateInputValue(new Date())}
        />
      )}
    </div>
  );
}
