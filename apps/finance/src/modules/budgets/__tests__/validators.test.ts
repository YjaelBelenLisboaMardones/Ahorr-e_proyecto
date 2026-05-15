import { describe, it, expect } from "vitest";
import { createBudgetSchema } from "../validators";

const baseValid = {
  name: "Supermercado",
  amount: 150000,
  period: "MONTHLY" as const,
  startDate: new Date().toISOString(),
};

describe("createBudgetSchema", () => {
  it("acepta un presupuesto válido mínimo", () => {
    expect(() => createBudgetSchema.parse(baseValid)).not.toThrow();
  });

  it("acepta los tres períodos válidos", () => {
    for (const period of ["WEEKLY", "MONTHLY", "YEARLY"] as const) {
      expect(() => createBudgetSchema.parse({ ...baseValid, period })).not.toThrow();
    }
  });

  it("acepta categoryId y endDate opcionales", () => {
    const input = {
      ...baseValid,
      categoryId: "550e8400-e29b-41d4-a716-446655440000",
      endDate: new Date(Date.now() + 86400000).toISOString(),
    };
    expect(() => createBudgetSchema.parse(input)).not.toThrow();
  });

  it("rechaza name vacío", () => {
    expect(() => createBudgetSchema.parse({ ...baseValid, name: "" })).toThrow();
  });

  it("rechaza name mayor a 100 caracteres", () => {
    expect(() => createBudgetSchema.parse({ ...baseValid, name: "a".repeat(101) })).toThrow();
  });

  it("rechaza amount negativo", () => {
    expect(() => createBudgetSchema.parse({ ...baseValid, amount: -1 })).toThrow();
  });

  it("rechaza amount cero", () => {
    expect(() => createBudgetSchema.parse({ ...baseValid, amount: 0 })).toThrow();
  });

  it("rechaza period inválido", () => {
    expect(() => createBudgetSchema.parse({ ...baseValid, period: "DAILY" })).toThrow();
  });

  it("rechaza startDate que no es ISO datetime", () => {
    expect(() => createBudgetSchema.parse({ ...baseValid, startDate: "2025-01-01" })).toThrow();
  });

  it("rechaza campos extra (strict)", () => {
    expect(() => createBudgetSchema.parse({ ...baseValid, color: "red" })).toThrow();
  });
});
