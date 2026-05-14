/**
 * Acceso tipado y validado a variables de entorno.
 * Falla temprano y con mensaje claro si falta alguna obligatoria.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(
      `Variable de entorno faltante: ${name}. Copia .env.example como .env.local y completa los valores.`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.length > 0 ? value : fallback;
}

export const env = {
  supabase: {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  database: {
    url: required("DATABASE_URL"),
    directUrl: process.env.DIRECT_URL,
  },
  gemini: {
    apiKey: required("GEMINI_API_KEY"),
    model: optional("GEMINI_MODEL", "gemini-2.5-flash"),
  },
} as const;
