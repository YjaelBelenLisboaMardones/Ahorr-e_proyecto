import { describe, it, expect } from "vitest";
import { searchQuerySchema } from "../validators";

describe("searchQuerySchema", () => {
  it("acepta un query válido", () => {
    expect(() => searchQuerySchema.parse({ q: "laptop" })).not.toThrow();
  });

  it("rechaza string vacío", () => {
    expect(() => searchQuerySchema.parse({ q: "" })).toThrow();
  });

  it("rechaza query mayor a 200 caracteres", () => {
    expect(() => searchQuerySchema.parse({ q: "a".repeat(201) })).toThrow();
  });

  it("acepta query de exactamente 200 caracteres", () => {
    expect(() => searchQuerySchema.parse({ q: "a".repeat(200) })).not.toThrow();
  });

  it("rechaza cuando falta el campo q", () => {
    expect(() => searchQuerySchema.parse({})).toThrow();
  });
});
