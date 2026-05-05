"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/auth";
import { createExpense, deleteExpense } from "@/services/budget/expense-repository";
import { evaluatePurchase } from "@/services/budget/budget-status";

export type ExpenseFormState = {
  error?: string;
  warning?: string;
};

export async function createExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const user = await requireUser();

  const budgetId = String(formData.get("budgetId") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const spentAtRaw = String(formData.get("spentAt") ?? "").trim();

  // RF1: el gasto exige presupuesto previo válido.
  if (!budgetId) {
    return { error: "Selecciona un presupuesto antes de registrar el gasto." };
  }
  if (!amountRaw || !description || !spentAtRaw) {
    return { error: "Completa monto, descripción y fecha." };
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }

  const spentAt = new Date(spentAtRaw);
  if (Number.isNaN(spentAt.getTime())) {
    return { error: "Fecha inválida." };
  }

  // RF7: algoritmo de compra inteligente — solo "luz verde" si no compromete la meta.
  const verdict = await evaluatePurchase(budgetId, user.id, amount);
  if (!verdict.ok) {
    return { error: verdict.message };
  }

  await createExpense(user.id, {
    budgetId,
    amount,
    description,
    spentAt,
  });

  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  revalidatePath(`/presupuestos/${budgetId}`);
  redirect("/gastos");
}

export async function deleteExpenseAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const budgetId = String(formData.get("budgetId") ?? "");
  if (!id) return;

  await deleteExpense(id, user.id);
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  if (budgetId) revalidatePath(`/presupuestos/${budgetId}`);
  redirect("/gastos");
}
