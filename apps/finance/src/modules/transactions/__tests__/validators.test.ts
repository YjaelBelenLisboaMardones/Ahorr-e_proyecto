import { describe, it, expect } from "vitest";
import { createTransactionSchema } from "../validators";

describe("createTransactionSchema", () => {
  const base = { amount: 5000, type: "EXPENSE" as const };

  it("acepta una transacción válida mínima", () => {
    expect(() => createTransactionSchema.parse(base)).not.toThrow();
  });

  it("acepta todos los campos opcionales", () => {
    const input = {
      amount: 10000,
      type: "INCOME",
      description: "Sueldo",
      budgetId: "550e8400-e29b-41d4-a716-446655440000",
      categoryId: "550e8400-e29b-41d4-a716-446655440001",
      date: new Date().toISOString(),
    };
    expect(() => createTransactionSchema.parse(input)).not.toThrow();
  });

  it("rechaza amount negativo", () => {
    expect(() => createTransactionSchema.parse({ ...base, amount: -100 })).toThrow();
  });

  it("rechaza amount cero", () => {
    expect(() => createTransactionSchema.parse({ ...base, amount: 0 })).toThrow();
  });

  it("rechaza type inválido", () => {
    expect(() => createTransactionSchema.parse({ ...base, type: "GASTO" })).toThrow();
  });

  it("rechaza budgetId que no es UUID", () => {
    expect(() => createTransactionSchema.parse({ ...base, budgetId: "no-es-uuid" })).toThrow();
  });

  it("rechaza campos extra (strict)", () => {
    expect(() => createTransactionSchema.parse({ ...base, extra: true })).toThrow();
  });

  it("rechaza description mayor a 255 caracteres", () => {
    const input = { ...base, description: "x".repeat(256) };
    expect(() => createTransactionSchema.parse(input)).toThrow();
  });
});
