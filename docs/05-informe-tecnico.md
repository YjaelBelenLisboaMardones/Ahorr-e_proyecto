# Informe Técnico — Ahorr-E
## Implementación de componentes Frontend y Backend con arquitectura de microservicios

**Asignatura:** DSY1106 — Desarrollo Fullstack III  
**Docente:** Joan Manuel Toro Ortiz  
**Instituto:** Duoc UC  
**Fecha:** Mayo 2026  

**Integrantes:**
- Marco Tassara
- Martín Villegas
- Jael Lisboa

**Repositorio:** https://github.com/YjaelBelenLisboaMardones/Ahorr-e_proyecto

---

## 1. Resumen ejecutivo

Ahorr-E es una aplicación web de gestión financiera personal con búsqueda inteligente de productos y recomendaciones generadas por inteligencia artificial. El proyecto se construyó sobre una arquitectura de microservicios serverless organizada en un monorepo Turborepo, con cuatro componentes desacoplados: un BFF (Backend for Frontend) que actúa como API Gateway, y tres microservicios independientes encargados de autenticación, finanzas y ofertas/IA.

El sistema cumple los seis requerimientos funcionales del informe técnico del Parcial 1 y los siete no funcionales, con especial énfasis en el aislamiento de datos por usuario (RLS), el rendimiento (caché de búsquedas), y la calidad del código (72 pruebas unitarias distribuidas en los cuatro componentes).

---

## 2. Arquitectura del sistema

### 2.1. Visión general

```
Usuario (browser)
       │
       ▼
┌──────────────────────────────┐
│  apps/web  — Puerto 3000     │  BFF + Frontend (Next.js 16)
│  API Gateway / Orquestador   │
└────────┬──────────┬──────────┘
         │          │
         ▼          ▼
┌──────────────┐  ┌──────────────────────┐
│ apps/finance │  │   apps/offers        │
│ Puerto 3002  │  │   Puerto 3003        │
│ Presupuestos │  │ Búsqueda + IA Gemini │
│ Transacciones│  └──────────────────────┘
│ Categorías   │
└──────┬───────┘
       │
       ▼
┌─────────────────┐  ┌─────────────┐
│ apps/auth       │  │  Supabase   │
│ Puerto 3011     │  │  PostgreSQL │
│ Perfiles        │  │  Auth + RLS │
└─────────────────┘  └─────────────┘
```

### 2.2. Stack tecnológico

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Monorepo | Turborepo | 2.x | Builds incrementales, ejecución paralela de servicios |
| Frontend + BFF | Next.js App Router | 16.1.7 | SSR, API Routes nativas, Server Components |
| UI | React + Tailwind CSS | 19 / v4 | Mobile-first, diseño responsivo |
| Base de datos | Supabase (PostgreSQL) | — | Auth integrada, RLS nativa, sin servidor propio |
| ORM | Prisma | 6.x | Tipado estricto, schema declarativo compartido |
| IA | Google Gemini | 2.5 Flash | Ventana 1M tokens, modelo disponible en tier gratuito |
| Testing | Vitest | 2.1.9 | Compatible TypeScript/ESM nativo, sin configuración extra |

### 2.3. Estructura del monorepo

```
Ahorr-e_proyecto/
├── apps/
│   ├── web/        BFF + frontend — puerto 3000
│   │   └── src/app/(rutas), components/, contexts/, lib/
│   ├── finance/    Microservicio financiero — puerto 3002
│   │   └── src/modules/{budgets,transactions,categories}/
│   │       └── {controllers,services,repositories,validators}/
│   ├── offers/     Microservicio ofertas + IA — puerto 3003
│   │   └── src/modules/{offers,recommendations}/
│   └── auth/       Microservicio usuarios — puerto 3011
│       └── src/modules/users/
├── packages/
│   ├── database/   Schema Prisma compartido
│   └── shared/     Clases de error, códigos HTTP
├── turbo.json      Configuración del pipeline
└── CLAUDE.md       Contrato técnico del equipo
```

---

## 3. Componentes backend implementados

### 3.1. BFF — apps/web (puerto 3000)

El BFF actúa como único punto de entrada para el browser. Responsabilidades:

- **Autenticación:** valida el JWT de Supabase en cada petición y refresca el token automáticamente 5 minutos antes de su expiración.
- **Orquestación:** agrega respuestas de `apps/finance` y `apps/offers` para entregar payloads listos al cliente.
- **Protección de rutas:** el componente `WithAuth` redirige a `/login` si no hay sesión activa.

Rutas principales: `/dashboard`, `/budgets`, `/transactions`, `/offers`.

### 3.2. Microservicio Finance — apps/finance (puerto 3002)

Gestiona toda la lógica financiera del usuario. Endpoints expuestos:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/v1/budgets` | Listar y crear presupuestos |
| GET/POST | `/api/v1/transactions` | Listar y registrar transacciones |
| GET/POST | `/api/v1/categories` | Listar y crear categorías |

**Validación de límite de presupuesto:** al registrar un gasto asociado a un presupuesto, el servicio calcula el total gastado en el período actual (semanal/mensual/anual) y rechaza con HTTP 422 si el nuevo gasto supera el saldo disponible. Esta validación vive en `transactions.service.ts` y no puede ser evadida desde el frontend.

Estructura interna: cada módulo (budgets, transactions, categories) sigue el patrón **controller → service → repository**, con validación Zod en el punto de entrada.

### 3.3. Microservicio Offers + IA — apps/offers (puerto 3003)

Dos responsabilidades:

**Búsqueda de productos (RF2 — Cache-aside):**  
El servicio consulta primero la tabla `OfferCache` en la BD. Si el resultado tiene menos de 24 horas, lo devuelve sin llamar a ninguna API externa. Si no, consulta DummyJSON (API pública de productos), convierte los precios de USD a CLP (× 950) y guarda el resultado en caché. Esto protege contra rate-limits y garantiza respuesta aunque la API externa esté caída.

**Recomendaciones IA (RF3 — Grounding):**  
El endpoint `POST /api/v1/recommendations` recibe el término de búsqueda, recupera los productos desde el caché y los pasa como contexto a Gemini 2.5 Flash. El modelo recibe instrucciones explícitas de razonar **solo** sobre los datos entregados, sin usar conocimiento externo. Esto impide que la IA genere recomendaciones sobre productos o precios inventados.

Si la API de Gemini responde con error 429 (cuota excedida), el microservicio captura el error y devuelve un mensaje descriptivo en lugar de propagar un HTTP 500.

### 3.4. Microservicio Auth — apps/auth (puerto 3011)

Gestiona el perfil del usuario dentro del sistema. La autenticación (sesiones, JWT, refresh tokens) la maneja Supabase Auth. Este microservicio se encarga únicamente de la capa de datos de perfil asociada al `userId`.

---

## 4. Patrones de diseño aplicados

### 4.1. Patrones arquitectónicos

**Backend for Frontend (BFF)**  
`apps/web/src/lib/ahorre-api.ts` centraliza todas las llamadas HTTP desde el frontend hacia los microservicios. El browser nunca conoce las URLs internas de `apps/finance` ni `apps/offers`.

**Repository**  
Cada módulo tiene su capa de repositorio (`src/modules/<dominio>/repositories/`) que encapsula el acceso a Prisma. Todas las operaciones filtran por `userId`, garantizando aislamiento de datos.

**Service Layer**  
Entre el controller (que valida el request HTTP) y el repository (que accede a la BD) existe una capa de servicio con la lógica de negocio. Ejemplo: `getBudgetPeriodRange()` en `transactions.service.ts` encapsula la lógica de fechas de período, independiente del framework HTTP.

**Cache-aside**  
`apps/offers` implementa el patrón completo: lectura de caché, fallback a fuente externa, escritura en caché. TTL de 24 horas configurable.

### 4.2. Patrones de diseño GoF

**Factory Method**  
`apps/web/src/lib/api.ts` — la función `apiRequest()` construye las peticiones HTTP con los headers correctos según el contexto (token de usuario, método HTTP, body).

**Singleton**  
El cliente Prisma se instancia una sola vez por proceso usando `globalThis` para evitar agotamiento del pool de conexiones durante el desarrollo con HMR.

**Specification**  
La validación de límite de presupuesto en `transactions.service.ts` encapsula la regla de negocio como una verificación autocontenida y reutilizable, independiente del endpoint que la invoca.

**Strategy (implícito)**  
Los validadores Zod por módulo definen el contrato de cada operación de forma intercambiable: agregar un nuevo tipo de transacción solo requiere extender el schema.

---

## 5. Estrategia de branching

El equipo adoptó GitFlow simplificado con promoción de versiones en cuatro etapas:

```
feature/<nombre>  →  dev  →  qa  →  master
```

- `feature/*`: trabajo aislado por funcionalidad, parte desde `dev`
- `dev`: rama de integración del equipo
- `qa`: pre-producción para testing integrado
- `master`: producción, solo recibe merges desde `qa`

**Ramas ejecutadas en este proyecto:**

| Rama | Feature | RFs cubiertos |
|------|---------|---------------|
| `feature/setup-base` | Cimientos monorepo + Turborepo | — |
| `feature/auth-supabase` | Autenticación Supabase + RLS | RNF1, RNF3 |
| `feature/presupuestos` | CRUD presupuestos | RF1 |
| `feature/gastos` | Transacciones + límite de presupuesto | RF1, RF7 |
| `feature/scraping` | Microservicio offers + cache | RF2, RNF6 |
| `feature/ia-recomendaciones` | Recomendaciones Gemini + grounding | RF3, RF6 |
| `feature/documentacion` | Tests, READMEs, documentación | — |
| `fix/monolito-a-monorepo` | Migración de monolito a Turborepo | — |

La convención de commits sigue Conventional Commits (`feat`, `fix`, `chore`, `refactor`, `docs`, `test`).

---

## 6. Pruebas unitarias

### 6.1. Stack de testing

- **Vitest 2.1.9** — runner compatible con TypeScript y ESM nativo
- **Configuración:** `vitest.config.ts` en cada app con `environment: "node"`

### 6.2. Resultados

```
apps/finance
  ✓ src/modules/budgets/__tests__/validators.test.ts         (10 tests)
  ✓ src/modules/transactions/__tests__/validators.test.ts    ( 8 tests)
  ✓ src/modules/transactions/__tests__/budget-period.test.ts ( 9 tests)
  Total: 27 tests ✓

apps/offers
  ✓ src/modules/offers/__tests__/scraper.test.ts             ( 9 tests)
  ✓ src/modules/offers/__tests__/validators.test.ts          ( 5 tests)
  ✓ src/modules/recommendations/__tests__/validators.test.ts ( 6 tests)
  Total: 20 tests ✓

apps/auth
  ✓ src/modules/users/__tests__/validators.test.ts           (12 tests)
  Total: 12 tests ✓

apps/web
  ✓ src/lib/__tests__/finance-utils.test.ts                  (13 tests)
  Total: 13 tests ✓

TOTAL GENERAL: 72 tests — todos pasan ✓
```

### 6.3. Qué cubre cada suite

**apps/finance:**
- Validators Zod de transacciones: tipos válidos/inválidos, UUID de presupuesto, strict mode
- Validators Zod de presupuestos: períodos válidos, fechas ISO, monto positivo
- `getBudgetPeriodRange()`: WEEKLY (lunes–domingo), MONTHLY (1er al último día), YEARLY (1 enero–31 diciembre), comportamiento por defecto

**apps/offers:**
- Modo mock (`SCRAPER_MOCK=true`): retorna 5 ofertas, nombre incluye el término buscado
- Conversión de precios: USD × 950 = CLP, cálculo de precio original con descuento
- Concatenación de nombre: `brand + title`
- Manejo de errores: fetch lanza excepción → `[]`, API no-ok → `[]`
- Validators de búsqueda: query vacío falla, límite 200 caracteres
- Validators de recomendaciones: strict mode, userContext opcional

**apps/auth:**
- `signupSchema`: email válido, password ≥ 6, nombre ≥ 2 y ≤ 120, role USER/ADMIN
- `loginSchema`: email y password, password no puede ser vacío

**apps/web:**
- `formatCLP`: formato español con separadores de miles, símbolo $
- `formatDate`: retorna string con año correcto
- `getBudgetSpent`: suma solo EXPENSE del mes actual, ignora INCOME, ignora otros budgets, ignora meses anteriores, retorna 0 en listas vacías

### 6.4. Decisiones de testing

Las funciones con dependencias externas (Prisma, Gemini SDK, Supabase) no se testean con mocks de módulos en esta suite. Se priorizaron las **funciones puras y la lógica de negocio desacoplada**, que son las partes más críticas y más fáciles de romper silenciosamente. Las integraciones se validan en demo en vivo.

---

## 7. Desafíos técnicos y soluciones

### 7.1. Migración de monolito a monorepo

El proyecto comenzó como una sola aplicación Next.js. A medida que los microservicios crecieron, la gestión de variables de entorno y el arranque de múltiples procesos se volvió compleja. Se migró a Turborepo, lo que permitió:
- Un solo `npm run dev` que levanta los 4 servicios en paralelo
- Builds incrementales (solo reconstruye lo que cambió)
- Packages compartidos (`@ahorre/database`, `@ahorre/shared`) sin publicarlos a npm

### 7.2. MercadoLibre bloqueó requests de servidor

Al intentar integrar la API de MercadoLibre para búsquedas reales, todos los requests desde servidor (sin OAuth de usuario) fueron bloqueados con HTTP 403. La API de ML requiere un flujo OAuth completo de usuario, incompatible con el modelo serverless. Se optó por DummyJSON como fuente de datos de prueba, con la estructura preparada para reemplazar el adaptador cuando se implemente el OAuth.

### 7.3. Deprecación del modelo Gemini 1.5 Flash

A mitad del desarrollo, el modelo `gemini-1.5-flash` devolvió HTTP 404 (deprecado). Se identificó el modelo vigente (`gemini-2.5-flash`) consultando la API de modelos disponibles y se actualizó la configuración. Se agregó manejo de error 429 para proteger la experiencia cuando la cuota gratuita se agota.

### 7.4. JWT expiry causaba errores 401 silenciosos

Después de 1 hora de sesión, el JWT expiraba y las peticiones al backend fallaban con 401 sin que el usuario lo notara. Se implementó un timer en `AuthContext` que calcula cuándo expira el token y lo refresca proactivamente usando el refresh token de Supabase, 5 minutos antes del vencimiento.

### 7.5. Prisma DLL bloqueada en Windows

Al regenerar el schema de Prisma con el servidor de desarrollo activo, Windows bloqueaba la DLL del cliente Prisma con EPERM. La solución es detener el servidor antes de correr `prisma generate`. Se documentó esto en el `README.md` de cada microservicio.

---

## 8. Conclusión

Ahorr-E demuestra que una arquitectura de microservicios serverless, bien organizada con un monorepo y patrones de diseño claros, permite desarrollar en equipo de forma ordenada y con alta calidad.

Los resultados concretos del proyecto:
- **72 pruebas unitarias** distribuidas en los cuatro componentes, todas pasando
- **4 microservicios** independientes con responsabilidades claras y separadas
- **8 ramas de feature** gestionadas con GitFlow simplificado
- **0 secrets en el repositorio** gracias a `.gitignore` y separación de `.env` por microservicio
- **Enforcement de límites de presupuesto** a nivel de base de datos, no solo en UI

La combinación de Turborepo para la gestión del monorepo, Supabase para infraestructura de datos segura, Prisma para acceso tipado a la BD y Vitest para pruebas conforma un stack moderno que escala tanto en funcionalidad como en tamaño de equipo.
