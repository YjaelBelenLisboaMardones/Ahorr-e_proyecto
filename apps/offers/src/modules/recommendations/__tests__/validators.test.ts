import { describe, it, expect } from "vitest";
import { recommendationRequestSchema } from "../validators";

describe("recommendationRequestSchema", () => {
  it("acepta query mínimo válido", () => {
    expect(() => recommendationRequestSchema.parse({ query: "tv" })).not.toThrow();
  });

  it("acepta userContext opcional", () => {
    expect(() =>
      recommendationRequestSchema.parse({ query: "laptop", userContext: "Busco algo económico" })
    ).not.toThrow();
  });

  it("rechaza query vacío", () => {
    expect(() => recommendationRequestSchema.parse({ query: "" })).toThrow();
  });

  it("rechaza query mayor a 200 caracteres", () => {
    expect(() =>
      recommendationRequestSchema.parse({ query: "x".repeat(201) })
    ).toThrow();
  });

  it("rechaza userContext mayor a 500 caracteres", () => {
    expect(() =>
      recommendationRequestSchema.parse({ query: "tv", userContext: "x".repeat(501) })
    ).toThrow();
  });

  it("rechaza campos extra (strict)", () => {
    expect(() =>
      recommendationRequestSchema.parse({ query: "tv", extra: "campo no permitido" })
    ).toThrow();
  });
});
