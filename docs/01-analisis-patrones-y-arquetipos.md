# Análisis de Patrones y Arquetipos — Ahorr-E

**Asignatura:** DSY1106 — Desarrollo Fullstack III · Duoc UC
**Docente:** Joan Manuel Toro Ortiz
**Equipo:** Marco Tassara · Martín Villegas · Jael Lisboa
**Repositorio:** https://github.com/YjaelBelenLisboaMardones/Ahorr-e_proyecto

---

## 1. Introducción

Este documento presenta el análisis de los patrones de diseño y patrones arquitectónicos aplicados en el sistema **Ahorr-E**, una aplicación de gestión financiera personal con búsqueda inteligente de ofertas en retail y recomendaciones generadas por IA. Cada patrón se documenta indicando: el problema que resuelve, su ubicación en el código y la justificación de su elección.

## 2. Arquitectura general

Ahorr-E adopta una arquitectura **serverless distribuida** basada en microservicios desacoplados. La estrategia de despliegue es **monorepo con sub-componentes independientes**, lo cual permite mantener un solo punto de versionado mientras cada microservicio puede escalar y desplegarse de forma autónoma.

### 2.1. Componentes del sistema

| Componente | Tipo | Ubicación | Responsabilidad |
|---|---|---|---|
| **Frontend (NPM)** | Cliente web | `app/` (Next.js App Router) | UI mobile-first, formularios, navegación |
| **Backend for Frontend (BFF)** | API gateway | `app/api/` | Orquestación, autenticación, validación de entrada |
| **Microservicio de Scraping** | Servicio aislado | `services/scraper/` + `app/api/scraper/` | Extracción y caché de precios externos |
| **Microservicio de IA** | Servicio aislado | `services/ai/` + `app/api/ai/recomendar/` | Recomendaciones con grounding usando Gemini |

### 2.2. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend + BFF | Next.js 16 (App Router) | SSR, Server Components, API Routes nativas, Server Actions |
| UI | React 19 + Tailwind CSS v4 | Mobile-first, PWA, ecosistema maduro |
| Auth + DB | Supabase (PostgreSQL + Auth + RLS) | Database-per-service con RLS nativa |
| ORM | Prisma 6 | Tipado estricto, migraciones declarativas |
| IA | Google AI SDK — Gemini 2.5 Flash | Ventana 1M tokens, grounding nativo |
| Despliegue | Vercel Serverless | Escalado automático bajo demanda |

## 3. Patrones de Diseño Aplicados

A continuación se describen los **doce patrones implementados**, organizados por categoría según GoF y patrones arquitectónicos modernos.

---

### 3.1. Patrones Creacionales

#### Patrón 1 — Singleton
- **Archivo:** `lib/prisma.ts`
- **Problema que resuelve:** Next.js en modo desarrollo recarga módulos con HMR (Hot Module Replacement) en cada cambio. Crear una instancia de `PrismaClient` por cada recarga agota el pool de conexiones del pooler de Supabase.
- **Implementación:** Se persiste la instancia en `globalThis.prisma` durante desarrollo, garantizando una única conexión activa en todo el ciclo de vida del servidor de desarrollo.
- **Justificación:** Sin este patrón, en desarrollo se observan errores "too many database connections" tras 5–10 recargas. En producción se instancia una sola vez por contenedor serverless.

#### Patrón 2 — Factory Method
- **Archivos:** `lib/supabase/client.ts`, `lib/supabase/server.ts`
- **Problema que resuelve:** Supabase requiere clientes distintos según el contexto de ejecución (browser, Server Component, Route Handler, middleware). Cada uno maneja cookies y sesión de forma específica.
- **Implementación:** Las funciones `createClient()` actúan como factories que construyen el cliente apropiado para cada contexto, ocultando la complejidad de configuración de cookies/sesión.
- **Justificación:** Permite que el resto del código simplemente importe `createClient()` sin preocuparse por los detalles del entorno de ejecución.

---

### 3.2. Patrones Estructurales

#### Patrón 3 — Adapter
- **Archivos:** `services/scraper/falabella-scraper.ts` (método `adapt`), `services/ai/recommend-service.ts`
- **Problema que resuelve:** El JSON crudo que devuelve Falabella tiene estructura compleja (precios en arrays con tipos discriminados, URLs relativas, marcas separadas del nombre). El sistema interno trabaja con un modelo plano `ScrapedProduct`.
- **Implementación:** El método privado `adapt(item: FalabellaItem) → ScrapedProduct` traduce la respuesta externa al formato interno. Análogamente, `recommend-service.ts` adapta `ScrapedPrice` (modelo de BD) a `ProductoScrapeado` (modelo de payload para IA).
- **Justificación:** Si Falabella cambia su API, solo se modifica `adapt()`. El resto del sistema permanece intacto. Aísla cambios externos.

#### Patrón 4 — Facade
- **Archivo:** `services/ai/recommend-service.ts`
- **Problema que resuelve:** Generar una recomendación requiere coordinar tres servicios: scraper (cache-aside), repositorio de presupuestos, repositorio de gastos, y finalmente Gemini SDK. Si el caller (endpoint API) tuviera que orquestar todo, se acoplaría a múltiples sub-sistemas.
- **Implementación:** La función `recommendForProfile(profileId, query)` esconde toda esa coordinación tras una sola llamada. Internamente:
  1. Invoca `searchProducts(query)` → cache-aside.
  2. Suma presupuesto disponible del usuario.
  3. Construye payload de grounding.
  4. Llama a `recomendarAhorro(payload)` en `services/ai/gemini.ts`.
- **Justificación:** El endpoint `/api/ai/recomendar` queda en 10 líneas. Toda la lógica compleja está encapsulada y es testeable de forma aislada.

---

### 3.3. Patrones de Comportamiento

#### Patrón 5 — Strategy
- **Archivos:** `services/scraper/types.ts`, `services/scraper/falabella-scraper.ts`
- **Problema que resuelve:** El sistema debe poder agregar otros retailers (Jumbo, Líder, etc.) sin modificar el orquestador de búsqueda.
- **Implementación:** La interface `Scraper` define el contrato `scrape(query: string): Promise<ScrapedProduct[]>`. `FalabellaScraper` la implementa. El orquestador (`search-products.ts`) trabaja con un array `Scraper[]` y los invoca de forma polimórfica.
- **Justificación:** Cumple el principio Open/Closed: para agregar `JumboScraper` solo se crea una clase nueva e implementa la interface. No se toca el orquestador ni la BD.

#### Patrón 6 — Specification
- **Archivo:** `services/budget/budget-status.ts` (función `evaluatePurchase`)
- **Problema que resuelve:** El RF7 (algoritmo de compra inteligente) exige validar si una compra compromete el presupuesto del usuario. Esa regla de negocio debe ser reutilizable y testeable independientemente del código UI o API.
- **Implementación:** `evaluatePurchase(budgetId, profileId, attempted)` retorna un veredicto estructurado (`PurchaseVerdict`) que indica si la compra es viable, qué reason tiene y un mensaje legible. El veredicto es un objeto explícito, no un boolean.
- **Justificación:** Encapsula la lógica de negocio fuera de la capa HTTP. La misma función puede invocarse desde un Server Action, un cron job o un test unitario.

---

### 3.4. Patrones Arquitectónicos

#### Patrón 7 — Backend for Frontend (BFF)
- **Archivos:** `app/api/scraper/route.ts`, `app/api/ai/recomendar/route.ts`, Server Actions en `app/(auth)/actions.ts`, `app/(app)/presupuestos/actions.ts`, `app/(app)/gastos/actions.ts`
- **Problema que resuelve:** El frontend móvil de Ahorr-E requiere data pre-procesada y agregada (gasto restante, ahorro acumulado, etc.) que un cliente directo a Supabase tendría que calcular en el browser, generando over-fetching.
- **Implementación:** Next.js API Routes y Server Actions actúan como capa intermedia: agregan, validan, autentican y devuelven payloads listos para renderizar. Toda interacción del cliente con la BD pasa por ahí.
- **Justificación:** Permite que el cliente sea liviano (mejor TTI en mobile) y que la lógica sensible (montos, validaciones) viva en el servidor.

#### Patrón 8 — Microservicios Serverless
- **Archivos:** `services/scraper/`, `services/ai/`
- **Problema que resuelve:** Las operaciones de scraping y llamadas a LLM son pesadas y de alta latencia. Mantenerlas dentro del proceso del frontend bloquearía el hilo principal.
- **Implementación:** Cada microservicio se aísla en su propia carpeta `services/<dominio>` y se expone por un Route Handler dedicado (`app/api/<dominio>`). Vercel los empaqueta como funciones independientes con escalado autónomo.
- **Justificación:** Cumple RNF2 (rendimiento/asincronía) y RNF7 (escalabilidad). Si el scraping se satura, su autoscaler crece sin afectar al endpoint de IA.

#### Patrón 9 — Cache-aside
- **Archivo:** `services/scraper/search-products.ts`
- **Problema que resuelve:** RF2 exige refrescar precios al menos cada 24 horas. RNF6 exige que la app responda aunque la fuente externa caiga.
- **Implementación:** El orquestador `searchProducts(query)`:
  1. Lee primero de la BD local (`scraped_prices`) filtrando por `scrapedAt > ahora - 24h`.
  2. Si hay datos frescos → los devuelve con `source: "cache"`.
  3. Si no, invoca al scraper, persiste el resultado y devuelve con `source: "live"`.
  4. **Si el scraper falla y existen datos viejos**, los sirve igual con `source: "stale-fallback"`.
- **Justificación:** Combina dos beneficios: (a) protección contra rate-limits del retailer externo, (b) tolerancia a fallos. La UI muestra un badge según el origen, dando transparencia al usuario.

#### Patrón 10 — Repository
- **Archivos:** `services/auth/profile-repository.ts`, `services/budget/budget-repository.ts`, `services/budget/expense-repository.ts`, `services/scraper/scraper-repository.ts`
- **Problema que resuelve:** Si cada Server Action consume Prisma directamente, la lógica de acceso a datos se duplica y los chequeos de ownership (filtro por `profileId`) pueden olvidarse.
- **Implementación:** Cada agregado (Profile, Budget, Expense, ScrapedPrice) tiene su repository con funciones tipadas (`findById`, `listByProfile`, `create`, etc.). Todas las operaciones de mutación reciben `profileId` y filtran por él de forma atómica con `updateMany`/`deleteMany`.
- **Justificación:** Centraliza el acceso a datos, hace explícita la regla de aislamiento por usuario, y facilita los tests unitarios mockeando el repository.

#### Patrón 11 — Service Layer
- **Archivo:** `services/budget/budget-status.ts`
- **Problema que resuelve:** Calcular el "estado" de un presupuesto (gastado, restante, % usado) requiere combinar datos de dos repositories. Esa lógica derivada no pertenece a ninguno de los dos repos individualmente.
- **Implementación:** `getBudgetStatus()` y `evaluatePurchase()` viven en una capa de servicios que orquesta repositories sin contener acceso directo a la BD.
- **Justificación:** Mantiene los repositories puros (1 agregado = 1 repo) y deja la lógica de negocio cross-agregado en su propia capa.

#### Patrón 12 — Middleware
- **Archivo:** `middleware.ts` + `lib/supabase/middleware.ts`
- **Problema que resuelve:** La sesión de Supabase necesita refrescarse en cada request para mantener vigencia, y las rutas privadas deben redirigir a `/login` si no hay usuario.
- **Implementación:** Next.js Middleware se ejecuta antes de cada request. `updateSession()` refresca la cookie de sesión y, si la ruta no es pública y no hay usuario, retorna un redirect.
- **Justificación:** Centraliza la política de autenticación en un solo lugar. Cualquier ruta nueva queda automáticamente protegida sin código adicional.

---

### 3.5. Patrones de Seguridad

#### Bonus — Row Level Security (RLS)
- **Archivos:** `prisma/sql/02_profiles_rls.sql`, `03_budgets_rls.sql`, `04_expenses_rls.sql`, `05_scraped_prices_rls.sql`
- **Problema que resuelve:** Aunque el código del servidor filtra por `profileId`, una fuga (bug, log expuesto, query directa) podría dejar al descubierto datos de otros usuarios.
- **Implementación:** Cada tabla tiene políticas RLS que filtran por `auth.uid() = profileId` a nivel de PostgreSQL. Se activa en INSERT, SELECT, UPDATE, DELETE.
- **Justificación:** **Defensa en profundidad.** Aunque Prisma con `DATABASE_URL` (rol postgres) bypasea RLS, un cliente Supabase con anon key —incluso si se filtra— quedaría limitado por la BD. Cumple RNF1 y RNF3.

#### Bonus — Trigger Pattern
- **Archivo:** `prisma/sql/01_profiles_trigger.sql`
- **Problema que resuelve:** Cuando un usuario se registra en Supabase Auth, debe crearse automáticamente su row en `public.profiles`. Hacerlo desde el código del Server Action es propenso a fallos parciales.
- **Implementación:** Trigger AFTER INSERT en `auth.users` que ejecuta `handle_new_user()` y crea el profile en una sola transacción.
- **Justificación:** Garantía atómica a nivel de BD. Si el INSERT en `auth.users` ocurre, el profile se crea sí o sí.

---

## 4. Resumen

| # | Patrón | Categoría | Componente |
|---|---|---|---|
| 1 | Singleton | Creacional | Frontend + BFF |
| 2 | Factory Method | Creacional | Frontend + BFF |
| 3 | Adapter | Estructural | Microservicios |
| 4 | Facade | Estructural | Microservicio IA |
| 5 | Strategy | Comportamiento | Microservicio Scraper |
| 6 | Specification | Comportamiento | BFF / Service Layer |
| 7 | Backend for Frontend | Arquitectónico | BFF |
| 8 | Microservicios Serverless | Arquitectónico | Sistema completo |
| 9 | Cache-aside | Arquitectónico | Microservicio Scraper |
| 10 | Repository | Arquitectónico | BFF |
| 11 | Service Layer | Arquitectónico | BFF |
| 12 | Middleware | Arquitectónico | BFF |
| + | Row Level Security | Seguridad | Base de datos |
| + | Trigger | Seguridad | Base de datos |

**Total: 12 patrones de diseño + 2 patrones de seguridad de infraestructura.**

La rúbrica exige al menos 3 patrones implementados y justificados. Ahorr-E supera ampliamente el mínimo, con cada patrón aplicado a un problema concreto del sistema y referenciable en el código fuente.

## 5. Conclusiones

La arquitectura distribuida y el uso intensivo de patrones de diseño permiten que Ahorr-E cumpla simultáneamente con tres exigencias contrapuestas:

1. **Latencia baja** (RNF2) — gracias a Cache-aside y BFF, el cliente recibe data pre-procesada en milisegundos.
2. **Mantenibilidad** (RNF5) — los patrones Repository, Service Layer y Adapter aíslan los cambios: una nueva tienda, un nuevo modelo de IA o un cambio de schema no propaga modificaciones a múltiples capas.
3. **Seguridad** (RNF1, RNF3) — la combinación de Middleware (auth en cada request), RLS (aislamiento a nivel BD) y Repository (filtros por ownership) implementa defensa en profundidad.

El proyecto valida que un sistema serverless puede ser tan robusto y mantenible como uno tradicional, a costa de internalizar correctamente los patrones que la propia arquitectura demanda.
