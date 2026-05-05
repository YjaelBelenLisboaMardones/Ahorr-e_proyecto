"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createBudgetAction, type BudgetFormState } from "../actions";

const initial: BudgetFormState = {};

export default function NuevoPresupuestoPage() {
  const [state, formAction, pending] = useActionState(createBudgetAction, initial);

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
          Nuevo presupuesto
        </h1>
      </div>

      <form action={formAction} className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
        <Field label="Monto (CLP)">
          <input
            type="number"
            name="amount"
            min="1"
            step="1"
            required
            inputMode="numeric"
            placeholder="500000"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
          />
        </Field>

        <Field label="Inicio del período">
          <input
            type="date"
            name="periodStart"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
          />
        </Field>

        <Field label="Fin del período">
          <input
            type="date"
            name="periodEnd"
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
          />
        </Field>

        <Field label="Categoría (opcional)">
          <input
            type="text"
            name="category"
            placeholder="Alimentación, transporte..."
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
          {pending ? "Guardando..." : "Guardar presupuesto"}
        </button>
      </form>
    </div>
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
