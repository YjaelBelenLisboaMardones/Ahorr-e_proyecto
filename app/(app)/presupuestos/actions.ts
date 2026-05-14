"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/lib/supabase/auth";
import {
  createBudget,
  updateBudget,
  deleteBudget,
  type BudgetInput,
} from "@/services/budget/budget-repository";

export type BudgetFormState = {
  error?: string;
};

function parseForm(formData: FormData): BudgetInput | string {
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const periodStartRaw = String(formData.get("periodStart") ?? "").trim();
  const periodEndRaw = String(formData.get("periodEnd") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "").trim();

  if (!amountRaw || !periodStartRaw || !periodEndRaw) {
    return "Completa monto, fecha de inicio y fecha de término.";
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return "El monto debe ser un número mayor a 0.";
  }

  const periodStart = new Date(periodStartRaw);
  const periodEnd = new Date(periodEndRaw);
  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    return "Fechas inválidas.";
  }
  if (periodEnd < periodStart) {
    return "La fecha de término no puede ser anterior a la de inicio.";
  }

  return {
    amount,
    periodStart,
    periodEnd,
    category: categoryRaw || null,
  };
}

export async function createBudgetAction(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser();
  const parsed = parseForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  await createBudget(user.id, parsed);
  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
  redirect("/presupuestos");
}

export async function updateBudgetAction(
  id: string,
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser();
  const parsed = parseForm(formData);
  if (typeof parsed === "string") return { error: parsed };

  const updated = await updateBudget(id, user.id, parsed);
  if (!updated) {
    return { error: "Presupuesto no encontrado." };
  }
  revalidatePath("/presupuestos");
  revalidatePath(`/presupuestos/${id}`);
  revalidatePath("/dashboard");
  redirect("/presupuestos");
}

export async function deleteBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteBudget(id, user.id);
  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
  redirect("/presupuestos");
}
