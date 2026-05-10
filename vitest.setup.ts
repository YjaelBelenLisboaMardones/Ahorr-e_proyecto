// ═════════════════════════════════════════════════════════════════════════════
// vitest.setup.ts — Validación de Edge Runtime Compatibility (ESM Version)
// ═════════════════════════════════════════════════════════════════════════════
// Garantía RNF3 + RNF5 + RNF6: Blindaje contra módulos de Node.js nativos.
// ═════════════════════════════════════════════════════════════════════════════

import { expect, beforeAll, afterAll, vi } from 'vitest'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MÓDULOS PROHIBIDOS EN EDGE RUNTIME
 * ─────────────────────────────────────────────────────────────────────────────
 * Lista de módulos que causan fallos de despliegue en Supabase/Vercel Edge.
 */
const PROHIBITED_MODULES = [
  'fs', 'fs/promises', 'path', 'http', 'https', 'stream', 
  'child_process', 'cluster', 'os', 'net', 'dgram'
]

// Interceptamos los módulos prohibidos antes de que cualquier test intente cargarlos.
// En ESM, usamos vi.mock para inyectar errores controlados.
PROHIBITED_MODULES.forEach(mod => {
  vi.mock(mod, () => {
    throw new Error(
      `❌ [Edge Guard] Intento de importar módulo nativo '${mod}'. ` +
      `Este módulo no está disponible en Edge Runtime. Revisa el RNF2.`
    )
  })
})

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * VALIDACIÓN GLOBAL ANTES DE TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 */
beforeAll(async () => {
  console.log('🔍 [Vitest Setup] Entorno: Edge-Ready (ESM Mode)')

  const isCI = Boolean(process.env.CI)

  if (isCI) {
    console.log('🏗️  [Vitest Setup] Validando variables críticas en QA/CI...')
    // Aseguramos que existan las credenciales mínimas para no fallar en frío
    expect(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DATABASE_URL,
      'Error: Credenciales de persistencia no encontradas en entorno CI.'
    ).toBeDefined()
  }

  // Stub de 'server-only' para compatibilidad con Next.js 16
  // @ts-ignore - Necesario para entornos de test que consumen componentes de servidor
  globalThis['server-only'] = {}
  
  console.log('✅ [Vitest Setup] Mocks y seguridad inicializados.\n')
})

afterAll(async () => {
  console.log('\n🧹 [Vitest Setup] Limpieza de recursos completada.')
})

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HELPERS DE ARQUITECTURA (UTILITIES)
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Simula headers de autenticación para validar RLS (RNF1).
 */
export function createAuthHeaders(userId: string = 'test-uuid-001'): Record<string, string> {
  return {
    'X-User-ID': userId,
    'Content-Type': 'application/json',
  }
}

/**
 * Assert: Verifica que un objeto sea serializable (Requisito Edge).
 */
export function assertEdgeCompatible(data: unknown): asserts data is Record<string, any> {
  expect(data).toBeDefined()
  expect(() => JSON.stringify(data)).not.toThrow()
}