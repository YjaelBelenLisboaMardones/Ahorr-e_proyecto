import "server-only";

import { findBudgetById } from "./budget-repository";
import { sumExpensesByBudget } from "./expense-repository";

/**
 * RF7 — Algoritmo de compra inteligente.
 *
 * Calcula el estado de un presupuesto: gastado, restante y porcentaje usado.
 * `evaluatePurchase` decide si una nueva compra cabe o la rechaza, devolviendo
 * un veredicto estructurado que la capa de UI/Server Action puede usar.
 */

export type BudgetStatus = {
  budgetId: string;
  amount: number;
  spent: number;
  remaining: number;
  usedPercent: number; // 0..100+
};

export type PurchaseVerdict =
  | { ok: true; status: BudgetStatus }
  | {
      ok: false;
      reason: "budget_not_found" | "exceeds_remaining";
      status?: BudgetStatus;
      attempted?: number;
      message: string;
    };

export async function getBudgetStatus(
  budgetId: string,
  profileId: string,
): Promise<BudgetStatus | null> {
  const budget = await findBudgetById(budgetId, profileId);
  if (!budget) return null;

  const amount = Number(budget.amount);
  const spent = await sumExpensesByBudget(budgetId, profileId);
  const remaining = amount - spent;
  const usedPercent = amount > 0 ? (spent / amount) * 100 : 0;

  return { budgetId, amount, spent, remaining, usedPercent };
}

/**
 * Evalúa si un nuevo gasto puede registrarse sin comprometer el presupuesto.
 * Devuelve veredicto con detalles para mostrar al usuario.
 */
export async function evaluatePurchase(
  budgetId: string,
  profileId: string,
  attempted: number,
): Promise<PurchaseVerdict> {
  const status = await getBudgetStatus(budgetId, profileId);

  if (!status) {
    return {
      ok: false,
      reason: "budget_not_found",
      message: "El presupuesto seleccionado no existe o no te pertenece.",
    };
  }

  if (attempted > status.remaining) {
    return {
      ok: false,
      reason: "exceeds_remaining",
      status,
      attempted,
      message: `Este gasto compromete tu meta de ahorro: te quedan ${formatCLPInline(
        status.remaining,
      )} en este presupuesto y estás intentando registrar ${formatCLPInline(attempted)}.`,
    };
  }

  return { ok: true, status };
}

function formatCLPInline(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}
