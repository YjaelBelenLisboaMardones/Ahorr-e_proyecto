// Stub para reemplazar `server-only` durante tests con Vitest.
// El módulo real lanza error si se importa desde un componente cliente,
// pero Vitest corre fuera de Next.js y no tiene contexto de cliente/servidor.
export {};
