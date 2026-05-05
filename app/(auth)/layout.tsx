import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
        <h1 className="mb-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Ahorr-E
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Tu plata, tu control.
        </p>
        {children}
      </div>
    </main>
  );
}
