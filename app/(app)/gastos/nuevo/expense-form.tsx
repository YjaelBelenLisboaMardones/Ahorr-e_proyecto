"use client";

import { useActionState } from "react";
import { createExpenseAction, type ExpenseFormState } from "../actions";

const initial: ExpenseFormState = {};

type BudgetOption = {
  id: string;
  amount: number;
  category: string | null;
  remaining: number;
};

type Props = {
  budgets: BudgetOption[];
  defaultDate: string;
};

export function ExpenseForm({ budgets, defaultDate }: Props) {
  const [state, formAction, pending] = useActionState(createExpenseAction, initial);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900"
    >
      <Field label="Presupuesto">
        <select
          name="budgetId"
          required
          defaultValue=""
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        >
          <option value="" disabled>
            Selecciona un presupuesto
          </option>
          {budgets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.category ?? "General"} — quedan {formatCLPInline(b.remaining)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Descripción">
        <input
          type="text"
          name="description"
          required
          maxLength={120}
          placeholder="Ej. Almuerzo"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        />
      </Field>

      <Field label="Monto (CLP)">
        <input
          type="number"
          name="amount"
          min="1"
          step="1"
          required
          inputMode="numeric"
          placeholder="5000"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        />
      </Field>

      <Field label="Fecha del gasto">
        <input
          type="date"
          name="spentAt"
          required
          defaultValue={defaultDate}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        />
      </Field>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {pending ? "Registrando..." : "Registrar gasto"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function formatCLPInline(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}
