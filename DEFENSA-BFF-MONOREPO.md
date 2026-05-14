# 🛡️ Defensa: Arquitectura BFF + Monorepo — Ahorr-E

## PARTE 1: ¿Cómo funcionan las peticiones en el BFF?

### Flujo General: Browser → BFF → Microservicios

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENTE (React + Next.js App Router)                           │
│ • "use client" components con formularios                       │
│ • State management con useActionState()                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ (1) Envía FormData
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ BFF LAYER — "use server" Actions & API Routes                  │
│ • Valida entrada (tipos, rango)                                │
│ • Requiere autenticación                                        │
│ • Orquesta servicios                                            │
│ • Devuelve DTO tipado                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │ (2) Invoca servicios
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVICIOS (Microservicios Serverless)                          │
│ • services/scraper/ — Cache-aside                              │
│ • services/ai/ — Facade + Gemini                               │
│ • services/budget/ — Repositories con RLS                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │ (3) Lee/escribe BD
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ SUPABASE — PostgreSQL + Row-Level Security                     │
└─────────────────────────────────────────────────────────────────┘
```

### EJEMPLO REAL: Crear un Gasto

#### 1️⃣ **Cliente dispara Server Action**
```typescript
// app/(app)/gastos/nuevo/expense-form.tsx (use client)
const [state, formAction, pending] = useActionState(createExpenseAction, initial);

<form action={formAction}>
  <select name="budgetId" required />
  <input name="amount" type="number" required />
  <input name="description" type="text" required />
  <textarea name="description" />
  <button type="submit" disabled={pending}>Guardar</button>
</form>
```

**¿Qué pasa?**
- El form se envía sin recargar la página (acción del servidor, no fetch)
- FormData llega directamente al servidor

#### 2️⃣ **BFF valida, autentica, orquesta**
```typescript
// app/(app)/gastos/actions.ts ("use server")
export async function createExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  // ✅ 1. Autenticación obligatoria
  const user = await requireUser();

  // ✅ 2. Validación de entrada (tipos, rango)
  const budgetId = String(formData.get("budgetId") ?? "").trim();
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "El monto debe ser mayor a 0." };
  }

  // ✅ 3. Orquestación: evalúa reglas de negocio (RF7 — algoritmo)
  const verdict = await evaluatePurchase(budgetId, user.id, amount);
  if (!verdict.ok) {
    return { error: verdict.message };
  }

  // ✅ 4. Delegación al repositorio (RLS automático)
  await createExpense(user.id, {
    budgetId,
    amount,
    description,
    spentAt,
  });

  // ✅ 5. Revalidación del caché y redirección
  revalidatePath("/gastos");
  revalidatePath("/dashboard");
  redirect("/gastos");
}
```

**¿Por qué es BFF?**
- El cliente NO toca la BD directamente
- El servidor VALIDA, AUTENTICA, AUTORIZA antes de mutar
- Los errores de negocio se capturan en el servidor
- El caché se invalida automáticamente

#### 3️⃣ **Servicio Budget ejecuta la lógica de dominio**
```typescript
// services/budget/expense-repository.ts
export async function createExpense(
  profileId: string,  // ← SIEMPRE filtrado por dueño
  input: ExpenseInput,
): Promise<Expense> {
  return prisma.expense.create({
    data: {
      profileId,  // ← RLS garantiza que nadie pueda burlar esto
      budgetId: input.budgetId,
      amount: input.amount,
      description: input.description,
      spentAt: input.spentAt,
      source: input.source ?? "manual",
    },
  });
}
```

**¿Por qué es un microservicio?**
- Totalmente desacoplado del scraper o IA
- Tiene su propia lógica de negocio
- Puede desplegarse independientemente
- Reutilizable desde múltiples BFF endpoints

---

### Otro Ejemplo: API Route (GET /api/scraper)

```typescript
// app/api/scraper/route.ts
export async function GET(request: NextRequest) {
  // ✅ 1. Requiere sesión activa
  await requireUser();

  // ✅ 2. Valida parámetro
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json(
      { error: "Query debe tener al menos 2 caracteres" },
      { status: 400 },
    );
  }

  // ✅ 3. Invoca microservicio (cache-aside)
  const result = await searchProducts(q);

  // ✅ 4. Devuelve DTO tipado
  return NextResponse.json({
    source: result.source,  // "cache" | "live" | "stale-fallback"
    count: result.products.length,
    products: result.products.map((p) => ({
      id: p.id,
      productName: p.productName,
      retailer: p.retailer,
      price: Number(p.price),
      scrapedAt: p.scrapedAt.toISOString(),
    })),
  });
}
```

**Flujo real del cache-aside:**
```typescript
// services/scraper/search-products.ts
export async function searchProducts(query: string): Promise<SearchResult> {
  // 1. Lee de BD local con TTL 24h
  const fresh = await findFreshByQuery(q);
  if (fresh.length > 0) {
    return { source: "cache", products: fresh };  // ✅ Return caché
  }

  // 2. Si no hay caché fresco, scrape live
  const scraped = await Promise.all(
    SCRAPERS.map((s) => s.scrape(q).catch(() => []))
  ).flat();

  if (scraped.length > 0) {
    await upsertBatch(scraped);  // ← Persiste en BD
    const updated = await findFreshByQuery(q);
    return { source: "live", products: updated };  // ✅ Return live
  }

  // 3. Si falla, usa caché viejo (RNF6 — defensa)
  const stale = await findAnyByQuery(q);
  return { source: "stale-fallback", products: stale };  // ✅ Return stale
}
```

**Ventajas:**
- El cliente recibe `source` → sabe si es fresco, en caché o expirado
- La BD local protege de caídas externas (RF6)
- No hay duplicación de requests

---

## PARTE 2: Arquitectura Monorepo

### ¿Por qué PNPM Workspaces?

**Problema sin monorepo:**
- 4 repos separados = 4 pipelines de CI/CD
- Cambios coordinados = caos (versionamiento cruzado)
- DRY violation: tipos duplicados en cada repo

**Solución: Monorepo con PNPM Workspaces**

```yaml
# pnpm-workspace.yaml
packages:
  - 'app'                    # Frontend + BFF (Next.js)
  - 'services/scraper'       # Microservicio 1
  - 'services/ai'            # Microservicio 2
  - 'services/budget'        # Microservicio 3
  - 'packages/schemas'       # Tipos compartidos (SÍ, solo tipos)
```

### Aislamiento Estricto + Comunicación Controlada

#### ❌ **PROHIBIDO: Acoplamiento entre servicios**
```typescript
// ❌ NUNCA HACER ESTO
// services/ai/recommend-service.ts
import { searchProducts } from '../scraper/search-products';  // ❌ NO
import { budgetRepository } from '../budget/budget-repository';  // ❌ NO
```

**¿Por qué?**
- Rompe la independencia de despliegue
- Si `scraper` quiebra, `ai` quiebra
- Imposible versionar servicios por separado

#### ✅ **CORRECTO: Comunicación vía funciones**
```typescript
// services/ai/recommend-service.ts ("use server")
import { searchProducts } from '@/services/scraper/search-products';
import { listBudgetsByProfile } from '@/services/budget/budget-repository';

export async function recommendForProfile(
  profileId: string,
  query: string,
): Promise<RecommendationResult> {
  // Los servicios se usan como funciones, NO como módulos importados
  // Cada uno puede ejecutarse en su propio contexto serverless

  const search = await searchProducts(query);
  const budgets = await listBudgetsByProfile(profileId);

  // Orquesta Gemini solo si hay datos
  if (search.products.length === 0) {
    return {
      query,
      recommendation: "No tengo datos para recomendar.",
      source: "no-data",
    };
  }

  // Llama a Gemini con grounding
  const recommendation = await recomendarAhorro(
    search.products,
    budgets,
    query,
  );

  return {
    query,
    productosUsados: search.products.length,
    recommendation,
    source: search.source,
  };
}
```

**¿Por qué funciona?**
- Cada función es autónoma
- Si `services/scraper` falla, devuelve error pero NO rompe `services/ai`
- Puede transformarse en HTTP/gRPC sin cambiar el código del caller

### Estructura Real del Árbol

```
ahorr-e/
├── app/                          # ← Única interfaz pública
│   ├── (auth)/
│   │   └── actions.ts            # Server Actions: login, registro
│   ├── (app)/
│   │   ├── gastos/
│   │   │   ├── actions.ts        # Server Action: createExpenseAction
│   │   │   ├── page.tsx          # Renderiza gastos
│   │   │   └── nuevo/
│   │   │       └── expense-form.tsx
│   │   ├── presupuestos/
│   │   │   ├── actions.ts        # Server Action: createBudgetAction
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx          # Agrega data pre-procesada
│   ├── api/
│   │   ├── scraper/
│   │   │   └── route.ts          # GET /api/scraper?q=<term>
│   │   └── ai/recomendar/
│   │       └── route.ts          # POST /api/ai/recomendar
│   └── lib/
│       ├── prisma.ts             # Singleton: connection pool
│       └── supabase/
│           ├── auth.ts           # requireUser()
│           └── server.ts         # Client Supabase (server)
│
├── services/                     # ← Microservicios aislados
│   ├── scraper/
│   │   ├── search-products.ts    # Cache-aside orchestrator
│   │   ├── falabella-scraper.ts  # Strategy concreto
│   │   ├── scraper-repository.ts # Acceso a BD local
│   │   └── types.ts              # Interface Scraper
│   ├── ai/
│   │   ├── recommend-service.ts  # Facade orchestrator
│   │   ├── gemini.ts             # SDK wrapper
│   │   └── README.md
│   ├── budget/
│   │   ├── budget-repository.ts  # CRUD de presupuestos + RLS
│   │   ├── expense-repository.ts # CRUD de gastos
│   │   └── budget-status.ts      # Lógica RF7 (algoritmo inteligente)
│   └── auth/
│       └── profile-repository.ts # Singleton: profile actual
│
├── packages/
│   └── schemas/                  # ← ÚNICO lugar de tipos compartidos
│       └── index.ts              # TypeScript interfaces, Zod si aplica
│
└── pnpm-workspace.yaml           # Definición de topología
```

### Ciclo de Vida de una Request (Ejemplo Completo)

```
1. Usuario cliquea "Guardar Gasto"
   ↓
2. ExpenseForm ("use client") llamaformAction(createExpenseAction)
   ↓
3. FormData enviado al servidor (Next.js middleware + auth)
   ↓
4. createExpenseAction ("use server"):
   ├─ requireUser() → valida sesión Supabase
   ├─ Parsea FormData
   ├─ Valida tipos (string → number, date parsing)
   ├─ evaluatePurchase(budgetId, userId, amount)
   │  ├─ Lee presupuestos del usuario (RLS automático)
   │  ├─ Suma gastos previos
   │  ├─ Calcula restante
   │  └─ Devuelve { ok: bool, message: string }
   ├─ createExpense(userId, input) — delega al repositorio
   │  └─ Prisma.expense.create() — RLS de Supabase filtra por profileId
   ├─ revalidatePath() — invalida caché ISR de Next.js
   └─ redirect() → navega de vuelta a /gastos
   ↓
5. Página /gastos se re-renderiza con Server Component
   ├─ requireUser() → valida sesión nuevamente
   └─ listExpensesByProfile(userId) → BD con RLS
   ↓
6. HTML frescos se envían al cliente
   ↓
7. Cliente ve UI actualizada sin refresh manual
```

**¿Qué pasó con la arquitectura?**
- ✅ Validación en servidor (seguridad)
- ✅ Autenticación en servidor (RNF1)
- ✅ Row-Level Security en BD (RLS, RNF1)
- ✅ Servicios desacoplados (independencia)
- ✅ Caché invalidado automáticamente (RNF2)
- ✅ Cero requests innecesarios (over-fetching)

---

## PARTE 3: Defensa ante Críticas

### Crítica 1: "¿Por qué no usar tRPC o GraphQL?"

**Nuestra decisión: Next.js API Routes**

| Criterio | Next.js API Routes | tRPC | GraphQL |
|---|---|---|---|
| **Setup** | Nativo, cero config | Requiere setup | Requiere setup + aprendizaje |
| **RLS Supabase** | ✅ Nativo con middleware | ✅ Viable | ✅ Viable |
| **Edge Runtime** | ✅ Total soporte | ⚠️ Limitado | ⚠️ Limitado |
| **Server Actions** | ✅ Integrado | ❌ Alternativo | ❌ Alternativo |
| **Documentación** | ✅ Oficial + comunidad | ✅ Buena | ✅ Excelente |

**Decisión tomada:** Next.js API Routes + Server Actions = máxima simplicidad, máxima integración con Next.js.

### Crítica 2: "¿Cómo se comunican los microservicios?"

**Hoy:** Funciones JavaScript importadas (monorepo).

**En producción:** Podrían ser:
1. **HTTP REST** — `/api/scraper?q=...` llamado desde el BFF
2. **gRPC** — Para latencia muy baja
3. **Event-driven** — Colas (Firebase Tasks, AWS SQS)

**Nuestro código está preparado:** La lógica de negocio está en `services/*` y es agnóstica del transporte.

Ejemplo: Si mañana movemos `services/scraper` a una función Cloud:
```typescript
// Hoy (monorepo):
const result = await searchProducts(q);

// Mañana (HTTP):
const result = await fetch(`https://scraper.service.run/search?q=${q}`).then(r => r.json());

// El código que llama a searchProducts NO cambia.
```

### Crítica 3: "¿Y si alguien bypasea el BFF y llama a la BD directamente?"

**Protecciones (en capas):**

1. **Row-Level Security (RLS) en Supabase**
```sql
-- La BD fuerza: solo un usuario ve sus datos
CREATE POLICY "expenses_own_data" ON expenses
  FOR SELECT USING (auth.uid() = user_id);
```

2. **Lógica de negocio en repositorios**
```typescript
export async function createExpense(
  profileId: string,  // ← Obligatorio
  input: ExpenseInput,
) {
  // profileId se pasa siempre, RLS lo valida en BD
  return prisma.expense.create({
    data: { profileId, ...input }
  });
}
```

3. **Middleware de autenticación en Next.js**
```typescript
// middleware.ts
if (request.nextUrl.pathname.startsWith('/api/') && !session) {
  return NextResponse.redirect('/login');
}
```

4. **Validación de entrada en BFF**
- Tipos (string → number)
- Rango (amount > 0)
- Formato (date válida)

**Conclusión:** Si alguien intenta burlar el BFF, RLS lo bloquea. Si intenta burlar RLS, el auth middleware lo echa. Si intenta con SQL injection, Prisma lo previene. Defensa en profundidad.

### Crítica 4: "¿Cómo escalan los microservicios si todo está en un monorepo?"

**Despliegue independiente en Vercel:**

```
ahorr-e/
├── app/              → Vercel Function: "default" (BFF + Frontend)
├── services/scraper/ → Vercel Function: "scraper" (escalado autónomo)
├── services/ai/      → Vercel Function: "ai" (escalado autónomo)
└── services/budget/  → Reutilizado por BFF
```

**En vercel.json (teórico):**
```json
{
  "functions": {
    "app/api/scraper/route.ts": { "memory": 1024, "maxDuration": 30 },
    "app/api/ai/recomendar/route.ts": { "memory": 2048, "maxDuration": 60 }
  }
}
```

**Ventaja monorepo + escalado independiente:**
- Una sola CI/CD pipeline
- Builds coordinados pero despliegues autónomos
- Versionamiento coherente
- Reutilización de tipos

---

## RESUMEN: ¿Por qué esta arquitectura es robusta?

| Principio | Implementación | Beneficio |
|---|---|---|
| **Separación de responsabilidades** | BFF valida, servicios ejecutan, BD fuerza RLS | Fácil de debuggear, mantener |
| **Loose coupling** | Servicios vía funciones, no imports circulares | Independencia de despliegue |
| **Single source of truth** | Tipos en `packages/schemas` | Consistencia, sin drift |
| **Defense in depth** | Auth + Middleware + RLS + Validación | Seguridad multi-capas |
| **Performance** | Cache-aside, Server Components, ISR | TTI bajo, mejor UX mobile |
| **Reliability** | Fallbacks, caché expirado, logs centralizados | Sistema tolerante a fallos |

---

## Puntos clave para la defensa oral

📌 **Cuando pregunte qué es BFF:**
> "El Backend for Frontend es la capa intermedia que valida, autentica y orquesta. El cliente no toca nunca la BD. Todo flujo pasa por un endpoint que verifica sesión, tipos y reglas de negocio antes de delegar a los microservicios."

📌 **Cuando pregunte por monorepo:**
> "Es una sola carpeta con múltiples workspaces. Cada servicio es autónomo pero comparten tipos. En despliegue, cada uno se convierte en una función serverless independiente con su propio escalado."

📌 **Cuando pregunte por seguridad:**
> "Tenemos 4 capas: autenticación en middleware, validación en BFF, RLS en la BD, y lógica de negocio en repositorios. Alguien tendría que burlar las 4 juntas para hackear."

📌 **Cuando pregunte por performance:**
> "Cache-aside garantiza que no consultamos Falabella más de una vez cada 24h. Si cae, devolvemos caché expirado. Los Server Components pre-renderean en servidor. Los API Routes corren en Edge, minimizando latencia."
