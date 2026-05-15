import { describe, it, expect } from "vitest";
import { formatCLP, formatDate, getBudgetSpent, type Transaction } from "../finance-utils";

describe("formatCLP", () => {
  it("formatea un número entero en CLP", () => {
    const result = formatCLP(1000);
    expect(result).toContain("1.000");
  });

  it("incluye el símbolo de moneda", () => {
    const result = formatCLP(5000);
    expect(result).toMatch(/\$|CLP/);
  });

  it("formatea cero correctamente", () => {
    const result = formatCLP(0);
    expect(result).toContain("0");
  });

  it("acepta string numérico", () => {
    const result = formatCLP("50000");
    expect(result).toContain("50.000");
  });

  it("formatea correctamente un monto grande", () => {
    const result = formatCLP(1000000);
    expect(result).toContain("1.000.000");
  });
});

describe("formatDate", () => {
  it("retorna una cadena de texto no vacía", () => {
    const result = formatDate("2025-01-15T00:00:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("contiene el año de la fecha", () => {
    const result = formatDate("2025-06-20T12:00:00.000Z");
    expect(result).toContain("2025");
  });
});

describe("getBudgetSpent", () => {
  const now = new Date();
  const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 10).toISOString();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString();

  const transactions: Transaction[] = [
    { id: "1", amount: "10000", type: "EXPENSE", budgetId: "b1", date: currentMonthDate, description: null },
    { id: "2", amount: "5000",  type: "EXPENSE", budgetId: "b1", date: currentMonthDate, description: null },
    { id: "3", amount: "3000",  type: "INCOME",  budgetId: "b1", date: currentMonthDate, description: null },
    { id: "4", amount: "8000",  type: "EXPENSE", budgetId: "b2", date: currentMonthDate, description: null },
    { id: "5", amount: "2000",  type: "EXPENSE", budgetId: "b1", date: prevMonthDate,    description: null },
  ];

  it("suma solo los gastos del mes actual para el presupuesto dado", () => {
    expect(getBudgetSpent(transactions, "b1")).toBe(15000);
  });

  it("ignora transacciones de tipo INCOME", () => {
    const solo: Transaction[] = [
      { id: "x", amount: "9000", type: "INCOME", budgetId: "b1", date: currentMonthDate, description: null },
    ];
    expect(getBudgetSpent(solo, "b1")).toBe(0);
  });

  it("ignora gastos de otros presupuestos", () => {
    expect(getBudgetSpent(transactions, "b2")).toBe(8000);
  });

  it("ignora gastos de meses anteriores", () => {
    const soloAnterior: Transaction[] = [
      { id: "y", amount: "20000", type: "EXPENSE", budgetId: "b1", date: prevMonthDate, description: null },
    ];
    expect(getBudgetSpent(soloAnterior, "b1")).toBe(0);
  });

  it("retorna 0 si no hay transacciones", () => {
    expect(getBudgetSpent([], "b1")).toBe(0);
  });

  it("retorna 0 si no hay gastos para ese presupuesto", () => {
    expect(getBudgetSpent(transactions, "b99")).toBe(0);
  });
});
