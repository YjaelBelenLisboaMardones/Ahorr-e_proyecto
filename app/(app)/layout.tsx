import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/supabase/auth";
import { logoutAction } from "../(auth)/actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
          >
            Ahorr-E
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/presupuestos"
              className="text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              Presupuestos
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md px-4 py-6">{children}</main>
    </div>
  );
}
