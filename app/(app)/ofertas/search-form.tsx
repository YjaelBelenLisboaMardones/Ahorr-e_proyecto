"use client";

import { useFormStatus } from "react-dom";
import { searchAction } from "./actions";

export function SearchForm({ defaultQuery }: { defaultQuery: string }) {
  return (
    <form action={searchAction} className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        required
        minLength={2}
        placeholder="Buscar producto (ej. fanta, leche)"
        className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
      />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      {pending ? "Buscando..." : "Buscar"}
    </button>
  );
}
