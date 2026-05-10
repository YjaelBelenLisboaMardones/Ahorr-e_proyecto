import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 1. Forzamos el entorno Edge para cumplir con el RNF2
    environment: 'edge-runtime', 
    globals: true,
  },
  resolve: {
    // Usamos alias relativos simples. Vitest los resuelve desde la raíz del workspace.
    alias: {
      '@': '/',
      '@app': '/app',
      '@services': '/services',
      '@shared': '/packages/shared-types'
    },
  },
});