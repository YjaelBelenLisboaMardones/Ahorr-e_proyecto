import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock de los repositorios — evita levantar Prisma en tests unitarios.
vi.mock("./budget-repository", () => ({
  findBudgetById: vi.fn(),
}));
vi.mock("./expense-repository", () => ({
  sumExpensesByBudget: vi.fn(),
}));

import { findBudgetById } from "./budget-repository";
import { sumExpensesByBudget } from "./expense-repository";
import { evaluatePurchase, getBudgetStatus } from "./budget-status";

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";
const BUDGET_ID = "11111111-1111-1111-1111-111111111111";

function mockBudget(amount: number) {
  return {
    id: BUDGET_ID,
    profileId: PROFILE_ID,
    amount: { toString: () => String(amount), valueOf: () => amount },
    periodStart: new Date("2026-05-01"),
    periodEnd: new Date("2026-05-31"),
    category: "Alimentación",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("getBudgetStatus", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("calcula correctamente gastado, restante y % usado", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(mockBudget(100000) as never);
    vi.mocked(sumExpensesByBudget).mockResolvedValue(30000);

    const status = await getBudgetStatus(BUDGET_ID, PROFILE_ID);

    expect(status).not.toBeNull();
    expect(status!.amount).toBe(100000);
    expect(status!.spent).toBe(30000);
    expect(status!.remaining).toBe(70000);
    expect(status!.usedPercent).toBe(30);
  });

  it("devuelve null si el presupuesto no existe", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(null);

    const status = await getBudgetStatus(BUDGET_ID, PROFILE_ID);
    expect(status).toBeNull();
  });

  it("usa percent 0 si amount es 0 (evita division por cero)", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(mockBudget(0) as never);
    vi.mocked(sumExpensesByBudget).mockResolvedValue(0);

    const status = await getBudgetStatus(BUDGET_ID, PROFILE_ID);
    expect(status!.usedPercent).toBe(0);
  });

  it("retorna remaining negativo si se excedió el presupuesto", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(mockBudget(50000) as never);
    vi.mocked(sumExpensesByBudget).mockResolvedValue(75000);

    const status = await getBudgetStatus(BUDGET_ID, PROFILE_ID);
    expect(status!.remaining).toBe(-25000);
    expect(status!.usedPercent).toBe(150);
  });
});

describe("evaluatePurchase — RF7 algoritmo de compra inteligente", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("autoriza la compra si cabe dentro del presupuesto restante", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(mockBudget(100000) as never);
    vi.mocked(sumExpensesByBudget).mockResolvedValue(20000);

    const verdict = await evaluatePurchase(BUDGET_ID, PROFILE_ID, 5000);
    expect(verdict.ok).toBe(true);
    if (verdict.ok) {
      expect(verdict.status.remaining).toBe(80000);
    }
  });

  it("rechaza compra que excede el presupuesto restante", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(mockBudget(100000) as never);
    vi.mocked(sumExpensesByBudget).mockResolvedValue(70000);

    const verdict = await evaluatePurchase(BUDGET_ID, PROFILE_ID, 50000);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.reason).toBe("exceeds_remaining");
      expect(verdict.message).toMatch(/compromete tu meta de ahorro/i);
    }
  });

  it("rechaza compra exacta al límite + 1 (boundary)", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(mockBudget(100000) as never);
    vi.mocked(sumExpensesByBudget).mockResolvedValue(99999);

    const verdict = await evaluatePurchase(BUDGET_ID, PROFILE_ID, 2);
    expect(verdict.ok).toBe(false);
  });

  it("autoriza compra exactamente igual al restante (boundary)", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(mockBudget(100000) as never);
    vi.mocked(sumExpensesByBudget).mockResolvedValue(99999);

    const verdict = await evaluatePurchase(BUDGET_ID, PROFILE_ID, 1);
    expect(verdict.ok).toBe(true);
  });

  it("rechaza si el presupuesto no existe", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(null);

    const verdict = await evaluatePurchase(BUDGET_ID, PROFILE_ID, 1000);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.reason).toBe("budget_not_found");
    }
  });

  it("rechaza si el presupuesto ya está agotado", async () => {
    vi.mocked(findBudgetById).mockResolvedValue(mockBudget(100000) as never);
    vi.mocked(sumExpensesByBudget).mockResolvedValue(100000);

    const verdict = await evaluatePurchase(BUDGET_ID, PROFILE_ID, 1);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.reason).toBe("exceeds_remaining");
    }
  });
});
