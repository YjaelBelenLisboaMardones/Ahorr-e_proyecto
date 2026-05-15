"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function WithAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-gray-400">Cargando...</span>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}
