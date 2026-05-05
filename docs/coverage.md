# Pruebas unitarias y reporte de cobertura

Este documento explica cómo ejecutar la suite de tests y generar el reporte de cobertura que la rúbrica del Parcial 2 exige (indicadores 4 y 8).

## Stack de testing

- **Vitest 4.x** — runner de tests rápido, compatible con TypeScript y ESM nativos.
- **@vitest/coverage-v8** — reporte de cobertura usando el motor V8 (mismo que Node.js).
- **vitest-mock-extended** — utilidades para mockear módulos en tests unitarios.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta toda la suite una vez y termina (modo CI). |
| `npm run test:watch` | Modo watch: re-ejecuta los tests al detectar cambios. |
| `npm run test:coverage` | Tests + reporte de cobertura en consola y HTML. |

## Estructura de tests

Los tests viven al lado del archivo que prueban, con sufijo `.test.ts`:

```
lib/
  format.ts
  format.test.ts                          # 10 tests — formato CLP, fechas
services/
  budget/
    budget-status.ts
    budget-status.test.ts                 # 11 tests — RF7 evaluatePurchase
    budget-repository.ts
    budget-repository.test.ts             # 7 tests — ownership y filtros
  scraper/
    falabella-scraper.ts
    falabella-scraper.test.ts             # 7 tests — mock whitelist
```

**Total: 35 tests unitarios.**

## Qué se cubre y por qué

| Módulo | Cobertura | Razón |
|---|---|---|
| `services/budget/budget-status.ts` | Alto | **RF7 — algoritmo de compra inteligente.** Es la regla de negocio más crítica del sistema. Se cubren happy path, boundaries (gasto exacto al límite, gasto +1) y casos de error (presupuesto inexistente, presupuesto agotado). |
| `services/scraper/falabella-scraper.ts` | Alto en mock | **RF3 grounding.** Se valida que el mock con whitelist devuelve productos solo para queries reconocibles. Una query absurda (`xyzabc`) **debe** devolver `[]` — eso protege a la IA de alucinar. |
| `services/budget/budget-repository.ts` | Alto | **RNF1 aislamiento.** Se valida que cada operación filtra por `profileId`. Caso clave: un user no puede actualizar/eliminar el budget de otro user. |
| `lib/format.ts` | Alto | Helpers compartidos en toda la UI. Funciones puras, fáciles de testear. |
| `services/scraper/scraper-repository.ts`, `search-products.ts` | Bajo | Componentes de orquestación (cache-aside) — su valor se prueba en integración (ver demo en vivo). |
| `services/ai/*` | No testeado | Llamadas a Gemini SDK requieren API real; se cubren con prueba manual en demo. |

## Cobertura actual (snapshot)

Tras ejecutar `npm run test:coverage`:

```
File               | % Stmts | % Branch | % Funcs | % Lines
-------------------|---------|----------|---------|--------
All files          |   31.21 |    22.82 |   34.04 |   30.93
 lib               |   58.82 |       50 |      60 |   56.25
   format.ts       |   ~100  |    ~100  |    ~100 |    ~100
 services/budget   |   75    |    71.42 |   57.14 |   73.33
   budget-status   |   alto  |    alto  |    alto |    alto
   budget-repo     |   alto  |    alto  |    alto |    alto
 services/scraper  |   21    |     6    |    26   |    20
   falabella       |   34    |     8    |    50   |    32
```

La lógica de negocio crítica (RF7) queda cubierta. El número global de 31% se explica porque los archivos de orquestación (cache-aside, recommend-service, gemini-sdk) se prueban en demo en vivo, no en unit tests.

## Reporte HTML

El reporte HTML detallado se genera en `coverage/index.html` tras correr `npm run test:coverage`. Abrirlo en el navegador para ver cobertura línea por línea — útil para incluir capturas en el PDF de patrones.

```bash
npm run test:coverage
# Windows: start coverage/index.html
# Mac:     open coverage/index.html
# Linux:   xdg-open coverage/index.html
```

## Mockeo de Prisma

Los tests de repositories usan `vi.mock("@/lib/prisma")` para reemplazar el cliente real de Prisma con stubs. Esto permite que los tests:

- Corran sin BD viva (ni siquiera necesitan Supabase activo).
- Sean deterministas y rápidos (todos los 35 tests corren en ~350 ms).
- Validen contratos de query (qué `where` se está construyendo) sin necesidad de poblar tablas.

Patrón aplicado:

```typescript
vi.mock("@/lib/prisma", () => ({
  prisma: { budget: { updateMany: vi.fn(), ... } },
}));

// En el test:
vi.mocked(prisma.budget.updateMany).mockResolvedValue({ count: 1 });
expect(prisma.budget.updateMany).toHaveBeenCalledWith({
  where: { id: BUDGET_ID, profileId: PROFILE_ID },
});
```

Esto demuestra que el repository **siempre filtra por dueño** — la línea de defensa principal contra accesos cruzados, complementaria a las RLS de PostgreSQL.

## Stub de `server-only`

Varios archivos en `services/` y `lib/` importan el módulo `server-only` de Next.js para garantizar que jamás se importen desde un componente cliente. Vitest no entiende ese módulo (es virtual de Next), así que se aliasa a un stub vacío en `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
  },
},
```

El stub (`tests/server-only-stub.ts`) exporta un objeto vacío. En desarrollo y producción, el módulo real sigue actuando como guardia.

## Para incluir en el PDF de Patrones (rúbrica indicador 8)

Capturar:

1. Resultado de `npm test` mostrando "35 passed".
2. Resultado de `npm run test:coverage` con la tabla de % por módulo.
3. Captura del archivo `coverage/index.html` mostrando líneas cubiertas en `budget-status.ts` (RF7).

Estas tres capturas evidencian que el proyecto tiene pruebas unitarias reales, no decorativas.
