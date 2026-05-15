"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/budgets", label: "Presupuestos" },
  { href: "/transactions", label: "Transacciones" },
  { href: "/offers", label: "Ofertas IA" },
];

export function Navbar() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut();
    router.push("/");
    toast.success("Sesión cerrada");
  };

  return (
    <nav className="bg-[#064E3B] border-b border-emerald-900/60 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="font-bold text-lg tracking-tight text-white whitespace-nowrap flex-shrink-0"
        >
          Ahorr<span className="text-emerald-400">-E</span>
        </Link>

        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1 justify-center">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-300 whitespace-nowrap font-medium ${
                pathname === link.href
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-emerald-100/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-emerald-300/60 hidden sm:block truncate max-w-28">
            {profile?.fullName?.split(" ")[0]}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs text-emerald-300/60 hover:text-red-400 transition-colors duration-200 whitespace-nowrap"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
