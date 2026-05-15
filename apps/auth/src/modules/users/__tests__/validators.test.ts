import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "../validators";

describe("signupSchema", () => {
  const baseSignup = {
    email: "marco@example.com",
    password: "segura123",
    fullName: "Marco Tassara",
    role: "USER" as const,
  };

  it("acepta datos de registro válidos", () => {
    expect(() => signupSchema.parse(baseSignup)).not.toThrow();
  });

  it("acepta role ADMIN", () => {
    expect(() => signupSchema.parse({ ...baseSignup, role: "ADMIN" })).not.toThrow();
  });

  it("rechaza email con formato inválido", () => {
    expect(() => signupSchema.parse({ ...baseSignup, email: "no-es-email" })).toThrow();
  });

  it("rechaza password menor a 6 caracteres", () => {
    expect(() => signupSchema.parse({ ...baseSignup, password: "abc" })).toThrow();
  });

  it("rechaza fullName menor a 2 caracteres", () => {
    expect(() => signupSchema.parse({ ...baseSignup, fullName: "M" })).toThrow();
  });

  it("rechaza fullName mayor a 120 caracteres", () => {
    expect(() =>
      signupSchema.parse({ ...baseSignup, fullName: "M".repeat(121) })
    ).toThrow();
  });

  it("rechaza role desconocido", () => {
    expect(() => signupSchema.parse({ ...baseSignup, role: "SUPERADMIN" })).toThrow();
  });

  it("rechaza campos extra (strict)", () => {
    expect(() => signupSchema.parse({ ...baseSignup, extra: "campo" })).toThrow();
  });
});

describe("loginSchema", () => {
  const baseLogin = { email: "marco@example.com", password: "segura123" };

  it("acepta credenciales válidas", () => {
    expect(() => loginSchema.parse(baseLogin)).not.toThrow();
  });

  it("rechaza email inválido", () => {
    expect(() => loginSchema.parse({ ...baseLogin, email: "noValido" })).toThrow();
  });

  it("rechaza password vacío", () => {
    expect(() => loginSchema.parse({ ...baseLogin, password: "" })).toThrow();
  });

  it("rechaza cuando falta el email", () => {
    expect(() => loginSchema.parse({ password: "hola123" })).toThrow();
  });
});
