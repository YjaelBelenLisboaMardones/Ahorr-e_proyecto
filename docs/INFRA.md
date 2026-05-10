# INFRA.md — Ahorr-E: Arquitectura de Monorepo Desacoplado
## Goberanza Técnica de Microservicios y Loose Coupling

**Rama:** `fixhot/infraestructura`  
**Commit:** Atómico 1 — Configuración Base del Monorepo  
**Fecha:** 2026-05-10  
**Autores:** Marco Tassara, Martín Villegas, Jael Lisboa

---

## 1. JERARQUÍA DEL MONOREPO

```
Ahorr-E/
├── pnpm-workspace.yaml         ← Topología del monorepo (PNPM)
├── .npmrc                       ← Config de resolución de deps
├── package.json (raíz)          ← Scripts de orquestación
├── vitest.config.ts (raíz)      ← Testing centralizado (Edge-aware)
├── tsconfig.json                ← Tipos compartidos (TypeScript estricto)
│
├── app/                         ← CAPA 1: BFF (API Gateway + Frontend)
│   ├── package.json             ← Deps isoladas
│   ├── next.config.ts           ← Next.js App Router
│   ├── api/                     ← Route Handlers (RNF3 — Edge Runtime)
│   │   ├── ai/recomendar        ← Orquesta gemini-service
│   │   └── scraper              ← Orquesta scraper-service
│   ├── (app)/                   ← Rutas autenticadas (RLS con Supabase Auth)
│   │   ├── dashboard
│   │   ├── gastos
│   │   ├── ofertas
│   │   └── presupuestos
│   └── (auth)/                  ← Rutas de autenticación
│
├── services/                    ← CAPA 2: Microservicios Serverless
│   │
│   ├── scraper/                 ← RF2: Búsqueda y caché de ofertas
│   │   ├── package.json         ← Deps isoladas (Playwright, etc.)
│   │   ├── src/
│   │   │   ├── falabella-scraper.ts
│   │   │   ├── search-products.ts
│   │   │   └── types.ts
│   │   ├── .env.example         ← Variables autónomas
│   │   └── vitest.config.ts     ← Tests aislados
│   │
│   ├── ai/                      ← RF3: Recomendaciones con Gemini (grounding)
│   │   ├── package.json         ← Deps isoladas (@google/generative-ai)
│   │   ├── src/
│   │   │   ├── gemini.ts        ← Cliente de IA
│   │   │   ├── recommend-service.ts ← Lógica de recomendación
│   │   │   └── types.ts
│   │   ├── .env.example         ← GEMINI_API_KEY (secreto)
│   │   └── vitest.config.ts     ← Tests aislados
│   │
│   └── budget/                  ← RF1: Gestión de presupuestos/gastos
│       ├── package.json         ← Deps isoladas (@prisma/client)
│       ├── src/
│       │   ├── budget-repository.ts
│       │   ├── expense-repository.ts
│       │   ├── budget-status.ts
│       │   └── types.ts
│       ├── .env.example         ← DATABASE_URL (Supabase)
│       └── vitest.config.ts     ← Tests aislados
│
├── packages/                    ← CAPA 3: Esquemas (SIN Lógica)
│   └── schemas/                 ← REGLA ESTRICTA: Solo TypeScript types
│       ├── package.json
│       ├── src/
│       │   ├── chat.ts          ← type ChatMessage (RF3)
│       │   ├── scraper.ts       ← type Product, SearchResult (RF2)
│       │   ├── budget.ts        ← type Budget, Expense (RF1)
│       │   └── index.ts
│       └── vitest.config.ts     ← Validation de tipos (no lógica)
│
└── docs/                        ← Documentación
    ├── INFRA.md                 ← Este archivo
    └── ...
```

---

## 2. PRINCIPIOS DE GOBERNANZA TÉCNICA

### 2.1 PROHIBICIÓN DE ACOPLAMIENTO OCULTO

**Regla:** Cada servicio es autónomo. No se comparten:
- Variables de entorno globales
- Clientes HTTP/Supabase compartidos
- Utilidades comunes

**Aplicación:**

```
❌ PROHIBIDO:
app/
  └── lib/api-client.ts (servicio compartido)
  
services/
  ├── scraper/
  │   └── imports from: ../../lib/api-client ← ACOPLAMIENTO
  │
  └── ai/
      └── imports from: ../../lib/api-client ← ACOPLAMIENTO

✅ PERMITIDO:
app/lib/supabase-client.ts (solo para app)

services/
  ├── scraper/
  │   └── src/api-client.ts (cliente local, aislado)
  │
  └── ai/
      └── src/api-client.ts (cliente local, aislado)
```

**Justificación RNF7 (Escalabilidad Independiente):**
- Cada servicio puede upgradear dependencias sin coordinación
- Permite deployar scraper-service sin afectar ai-service
- Facilita horizontal scaling (instancias independientes por dominio)

---

### 2.2 EDGE RUNTIME COMPATIBILITY

**Regla:** TODO el código debe ejecutarse en:
- Supabase Edge Functions (Deno)
- Vercel Edge Runtime (V8 Isolate)
- Node.js 18+ (desarrollo local)

**Restricciones:**

| Módulo | Prohibido | Razón |
|--------|-----------|-------|
| `fs` | ✗ | No existe en Edge Runtime |
| `path` | ✗ | Reemplazar con `URL` API o strings |
| `http`, `https` | ✗ | Usar `fetch()` |
| `crypto` | ⚠ | Usar `SubtleCrypto` (Web API) |
| `child_process` | ✗ | Imposible sin shell |
| `node:*` | ⚠ | Evitar importes con prefijo `node:` |

**Validación en Vitest:**

```typescript
// vitest.config.ts incluye mock de 'server-only'
// Cualquier import prohibido genera error explícito en tests
```

---

### 2.3 TRAZABILIDAD RF/RNF

**Matriz de Aislamiento → Requerimientos:**

| Componente | RF Cobierto | RNF Cobiertos | Justificación |
|-----------|------------|---------------|--------------|
| **app/** (BFF) | RF1, RF2, RF3 | RNF1, RNF3, RNF4 | Orquesta APIs, Auth Supabase, Mobile-first |
| **services/scraper/** | RF2 | RNF2, RNF5, RNF7 | Caché 24h, serverless, independiente |
| **services/ai/** | RF3 | RNF2, RNF5, RNF7 | Gemini con grounding, serverless, aislado |
| **services/budget/** | RF1 | RNF1 (RLS), RNF6 | RLS en Postgres, integridad de datos |
| **packages/schemas/** | — | RNF1 (trazabilidad) | Solo tipos, documenta contratos |

---

## 3. GARANTÍAS TÉCNICAS POR RNF

### RNF1: Privacidad de Datos (Row-Level Security)

**Garantía:** El aislamiento del monorepo soporta RLS a nivel de infraestructura.

**Cómo funciona:**

1. **Autenticación centralizada en `app/`:**
   ```typescript
   // app/api/scraper/route.ts
   const user = await getAuthUser(req) // Supabase Auth
   const serviceResponse = await fetch(SCRAPER_SERVICE_URL, {
     headers: { 'X-User-ID': user.id } // Propagar identidad
   })
   ```

2. **Cada servicio valida identidad:**
   ```typescript
   // services/scraper/src/verify-user.ts
   const userId = req.headers['x-user-id']
   if (!userId) throw new Error('Unauthorized')
   // Luego, Prisma RLS filtra automáticamente
   const products = await db.scrapedPrices.findMany({
     // RLS: SELECT * FROM scraped_prices WHERE user_id = auth.uid()
   })
   ```

3. **RLS en Supabase (PostgreSQL):**
   ```sql
   -- prisma/sql/05_scraped_prices_rls.sql
   ALTER TABLE scraped_prices ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can see their own scraped prices"
     ON scraped_prices
     FOR SELECT
     TO authenticated
     USING (user_id = auth.uid());
   ```

**Resultado:** Incluso si un servicio es comprometido, no puede acceder a datos de otros usuarios.

---

### RNF6: Fiabilidad (Testing en QA)

**Garantía:** Vitest en raíz valida todos los servicios antes de merge a `qa`.

**Flujo:**

```
Desarrollador en feature/X
  ↓
git push → PR a dev
  ↓
CI/CD ejecuta: pnpm run test (raíz)
  ↓
Vitest ejecuta:
  - app/api/**/*.test.ts
  - services/*/**/*.test.ts
  - Cobertura mínima: 70%
  ↓
✅ PASS → Merge a dev
❌ FAIL → Bloquea merge (fuerza fixes)
  ↓
dev → qa (manual, QA team)
  ↓
Reejecutar tests en QA (garantía de reproducibilidad)
```

**Coverage Requirements:**

```yaml
# vitest.config.ts
coverage:
  lines: 70
  functions: 70
  branches: 65
  statements: 70
```

---

### RNF7: Escalabilidad Independiente

**Garantía:** Cada servicio puede ser deployado, escalado y actualizado sin coordinación.

**Evidencia:**

1. **Dependencias aisladas por servicio:**
   ```
   services/scraper/package.json → @next/bundle-analyzer, playwright
   services/ai/package.json → @google/generative-ai
   services/budget/package.json → @prisma/client
   
   Sin conflictos de versiones globales (shamefully-hoist mitigado).
   ```

2. **Deployments independientes:**
   ```bash
   # Supabase Edge Functions
   supabase functions deploy scraper-service  # Sin afectar ai-service
   
   # Vercel Edge Routes
   vercel deploy --prod services/ai           # Deploy solo de AI
   ```

3. **Escalabilidad horizontal:**
   ```
   Scraper: 10 instancias (heavy I/O, Playwright)
   AI: 5 instancias (Gemini API calls, rate-limited)
   Budget: 3 instancias (mostly DB reads)
   
   Cada una escala independientemente según su workload.
   ```

---

## 4. ESTRUCTURA DE VARIABLES DE ENTORNO

**Regla:** Cada servicio tiene su `.env.local` aislado. NO compartir variables globales.

### app/.env.local
```bash
# Supabase Auth (shared across all services via X-User-ID header)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# Internal service discovery (hardcoded o via Vercel Env)
SCRAPER_SERVICE_URL=http://localhost:3001
AI_SERVICE_URL=http://localhost:3002
BUDGET_SERVICE_URL=http://localhost:3003
```

### services/scraper/.env.local
```bash
# Scraper no necesita Supabase Auth (valida X-User-ID)
FALABELLA_API_BASE=https://falabella.com/api
FALABELLA_API_KEY=xxxxx
PORT=3001

# Logging y observabilidad
LOG_LEVEL=debug
```

### services/ai/.env.local
```bash
# Gemini API (secreto privado)
GEMINI_API_KEY=xxxxx
PORT=3002
LOG_LEVEL=debug
```

### services/budget/.env.local
```bash
# Supabase para acceso a DB (con RLS)
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
DIRECT_URL=postgresql://user:pass@db.supabase.co:5432/postgres
PORT=3003
LOG_LEVEL=debug
```

---

## 5. FLUJO DE COMUNICACIÓN INTER-SERVICIOS

```
┌─────────────────────────────────────────────────────────────────┐
│  Usuario (navegador)                                             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        HTTP/REST con auth.session
                      │
        ┌─────────────▼──────────────────┐
        │  app/ (BFF)                    │
        │  - Layout + Pages (RNF4)       │
        │  - Auth middleware             │
        │  - API Routes (orquestación)   │
        └──┬──────────────┬──────────────┘
           │              │
    (1) X-User-ID   (2) X-User-ID
           │              │
    ┌──────▼────────────────────────┐
    │ services/scraper/             │
    │ GET /search?q=laptop          │
    │ → Valida X-User-ID            │
    │ → Query Falabella             │
    │ → Prisma (RLS filters)        │
    │ → Retorna Product[]           │
    └──────────────────────────────┘

    ┌──────▼────────────────────────┐
    │ services/ai/                  │
    │ POST /recommend               │
    │ → Valida X-User-ID            │
    │ → Llama Gemini (grounding)    │
    │ → Retorna Recomendaciones     │
    └──────────────────────────────┘
```

**Protocolo HTTP (REST):**
- Sin gRPC (simplicidad en Edge Runtime)
- Headers estándar (X-User-ID, Content-Type)
- Errores con HTTP status codes
- Response JSON

---

## 6. COMANDOS PRINCIPALES

### Desarrollo Local

```bash
# Instalar deps del monorepo
pnpm install

# Desarrollo: todos los servicios en paralelo
pnpm run dev
# → app: http://localhost:3000
# → services/scraper: http://localhost:3001
# → services/ai: http://localhost:3002
# → services/budget: http://localhost:3003

# Build de producción (all workspaces)
pnpm run build

# Testing
pnpm run test           # Ejecuta Vitest (all workspaces)
pnpm run test:watch     # Watch mode
pnpm run test:coverage  # Reporte de cobertura

# Lint y formato
pnpm run lint
pnpm run lint:fix
```

### CI/CD en Vercel

```bash
# Build selectivo (dependencias primero)
pnpm run build:deps   # → packages/schemas
pnpm run build:services # → services/*
pnpm run build:app    # → app (next build)

# Pre-commit (local)
pnpm run precommit    # lint + test
```

---

## 7. REGLAS DE REVISIÓN DE CÓDIGO (PR Checklist)

Antes de mergear un PR a `dev`:

- [ ] **Loose Coupling:** ¿El servicio importa algo de otro workspace que no sea `packages/schemas`?
  - ❌ Si: RECHAZAR PR
  - ✅ Si solo: tipos puros de schemas → APROBAR

- [ ] **Edge Runtime:** ¿Usa `fs`, `path`, `child_process`, etc.?
  - ❌ Si: RECHAZAR (no corre en Edge)
  - ✅ Usa `fetch()`, `URL`, SubtleCrypto → APROBAR

- [ ] **Trazabilidad RF/RNF:** ¿La descripción de PR declara qué RF/RNF cubre?
  - ❌ No: RECHAZAR
  - ✅ Sí (ej: "Implementa RF2 (caché 24h) + RNF2 (serverless)") → APROBAR

- [ ] **Tests:** ¿Cobertura ≥70% en líneas y funciones?
  - ❌ <70%: RECHAZAR (bloquea merge)
  - ✅ ≥70%: APROBAR

- [ ] **Documentación:** ¿Hay comentarios inline explicando decisiones técnicas?
  - ❌ No: RECHAZAR
  - ✅ Sí: APROBAR

---

## 8. ANEXO: SEGURIDAD

### Ataques Mitigados

| Ataque | Mitigación | Ubicación |
|--------|-----------|-----------|
| **SQL Injection** | Prisma ORM (prepared statements) + RLS | services/budget/ |
| **Data Leakage** | RLS automático en Postgres, X-User-ID validation | Supabase + each service |
| **Cross-Service Coupling** | No imports entre servicios | .npmrc isolación |
| **Unauthorized API Access** | X-User-ID + Supabase Auth JWT | app/ middleware |
| **Credential Exposure** | .env.local isolado per servicio, secrets en CI/CD | .gitignore |

---

## 9. ROADMAP FUTURO

**Commits Atómicos Planeados:**

- **Commit 2:** `chore(services/scraper): microservicio autónomo Falabella`
- **Commit 3:** `chore(services/ai): microservicio Gemini con grounding`
- **Commit 4:** `chore(services/budget): microservicio de presupuestos + RLS`
- **Commit 5:** `chore(packages/schemas): tipos compartidos con trazabilidad`
- **Commit 6:** `chore(app): BFF Next.js como API Gateway orquestador`
- **Merge a dev:** Monorepo desacoplado listo para QA

---

**Generado automáticamente en rama `fixhot/infraestructura`.  
Último update: 2026-05-10**
