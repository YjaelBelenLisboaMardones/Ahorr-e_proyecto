"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";

export async function searchAction(formData: FormData): Promise<void> {
  await requireUser();
  const q = String(formData.get("q") ?? "").trim();
  if (q.length < 2) {
    redirect("/ofertas");
  }
  redirect(`/ofertas?q=${encodeURIComponent(q)}`);
}
