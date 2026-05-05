"use client";

import { useActionState } from "react";
import { updateBudgetAction, type BudgetFormState } from "../actions";

const initial: BudgetFormState = {};

type Props = {
  id: string;
  defaults: {
    amount: number;
    periodStart: string;
    periodEnd: string;
    category: string;
  };
};

export function EditBudgetForm({ id, defaults }: Props) {
  const action = updateBudgetAction.bind(null, id);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900"
    >
      <Field label="Monto (CLP)">
        <input
          type="number"
          name="amount"
          min="1"
          step="1"
          required
          inputMode="numeric"
          defaultValue={defaults.amount}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        />
      </Field>

      <Field label="Inicio del período">
        <input
          type="date"
          name="periodStart"
          required
          defaultValue={defaults.periodStart}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        />
      </Field>

      <Field label="Fin del período">
        <input
          type="date"
          name="periodEnd"
          required
          defaultValue={defaults.periodEnd}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        />
      </Field>

      <Field label="Categoría (opcional)">
        <input
          type="text"
          name="category"
          defaultValue={defaults.category}
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
        {pending ? "Guardando..." : "Guardar cambios"}
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
