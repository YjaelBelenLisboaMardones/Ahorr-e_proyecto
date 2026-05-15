import { describe, it, expect } from "vitest";
import { getBudgetPeriodRange } from "../services/transactions.service";

describe("getBudgetPeriodRange", () => {
  it("MONTHLY: start es el primer día del mes actual", () => {
    const { start } = getBudgetPeriodRange("MONTHLY");
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it("MONTHLY: end es el último día del mes actual", () => {
    const now = new Date();
    const { end } = getBudgetPeriodRange("MONTHLY");
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    expect(end.getDate()).toBe(lastDay);
    expect(end.getHours()).toBe(23);
  });

  it("MONTHLY: el rango contiene la fecha actual", () => {
    const now = new Date();
    const { start, end } = getBudgetPeriodRange("MONTHLY");
    expect(now >= start && now <= end).toBe(true);
  });

  it("WEEKLY: start es lunes (día 1)", () => {
    const { start } = getBudgetPeriodRange("WEEKLY");
    expect(start.getDay()).toBe(1);
    expect(start.getHours()).toBe(0);
  });

  it("WEEKLY: end es domingo (día 0)", () => {
    const { end } = getBudgetPeriodRange("WEEKLY");
    expect(end.getDay()).toBe(0);
    expect(end.getHours()).toBe(23);
  });

  it("WEEKLY: el rango cubre 7 días (lunes a domingo)", () => {
    const { start, end } = getBudgetPeriodRange("WEEKLY");
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(Math.round(diffDays)).toBe(7);
  });

  it("YEARLY: start es el 1 de enero del año actual", () => {
    const now = new Date();
    const { start } = getBudgetPeriodRange("YEARLY");
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(start.getFullYear()).toBe(now.getFullYear());
  });

  it("YEARLY: end es el 31 de diciembre del año actual", () => {
    const now = new Date();
    const { end } = getBudgetPeriodRange("YEARLY");
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
    expect(end.getFullYear()).toBe(now.getFullYear());
  });

  it("retorna MONTHLY por defecto para período desconocido", () => {
    const now = new Date();
    const { start } = getBudgetPeriodRange("DESCONOCIDO");
    expect(start.getMonth()).toBe(now.getMonth());
    expect(start.getDate()).toBe(1);
  });
});
