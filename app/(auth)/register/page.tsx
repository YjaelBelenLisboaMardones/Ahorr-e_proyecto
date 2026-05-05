"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthState } from "../actions";

const initial: AuthState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Nombre completo</span>
        <input
          type="text"
          name="fullName"
          autoComplete="name"
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">
          Contraseña <span className="text-zinc-400">(mín. 8 caracteres)</span>
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100"
        />
      </label>

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
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-zinc-950 underline dark:text-zinc-50">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
