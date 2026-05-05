import { describe, expect, it } from "vitest";
import { formatCLP, formatFecha, toDateInputValue } from "./format";

describe("formatCLP", () => {
  it("formatea un número entero como moneda CLP", () => {
    const result = formatCLP(1000);
    expect(result).toContain("1");
    expect(result).toContain("000");
    expect(result).toMatch(/\$/);
  });

  it("acepta strings numéricos", () => {
    const result = formatCLP("50000");
    expect(result).toContain("50");
  });

  it("formatea cero como $0", () => {
    expect(formatCLP(0)).toMatch(/\$\s*0/);
  });

  it("devuelve $0 cuando el input no es un número válido", () => {
    expect(formatCLP("abc")).toMatch(/\$\s*0/);
    expect(formatCLP(NaN)).toMatch(/\$\s*0/);
    expect(formatCLP(Infinity)).toMatch(/\$\s*0/);
  });

  it("no muestra decimales (CLP no los usa)", () => {
    expect(formatCLP(1234.99)).not.toContain(",99");
    expect(formatCLP(1234.99)).not.toContain(".99");
  });
});

describe("formatFecha", () => {
  it("formatea un Date en formato día-mes-año", () => {
    const result = formatFecha(new Date("2026-05-04T00:00:00Z"));
    expect(result).toMatch(/\d{1,2}/); // contiene día
    expect(result).toMatch(/2026/); // contiene año
  });

  it("acepta strings ISO", () => {
    const result = formatFecha("2026-12-25T00:00:00Z");
    expect(result).toMatch(/2026/);
  });
});

describe("toDateInputValue", () => {
  it("convierte un Date a YYYY-MM-DD", () => {
    const date = new Date("2026-05-04T15:30:00Z");
    expect(toDateInputValue(date)).toBe("2026-05-04");
  });

  it("acepta strings y los convierte a YYYY-MM-DD", () => {
    expect(toDateInputValue("2026-12-25T08:00:00Z")).toBe("2026-12-25");
  });

  it("ignora la hora del timezone (siempre UTC date)", () => {
    const date = new Date("2026-01-15T23:59:59Z");
    expect(toDateInputValue(date)).toBe("2026-01-15");
  });
});
