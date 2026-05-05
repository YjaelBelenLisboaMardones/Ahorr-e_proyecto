import { requireUser } from "@/lib/supabase/auth";
import { findProfileById } from "@/services/auth/profile-repository";
import { logoutAction } from "../(auth)/actions";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await findProfileById(user.id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Hola{profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Salir
          </button>
        </form>
      </header>

      <section className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        Aún no has configurado tu presupuesto. Próximamente podrás registrar
        gastos, ver ofertas y recibir recomendaciones de Ahorr-E.
      </section>
    </main>
  );
}
