# Ahorr-E

Aplicación de gestión financiera personal con búsqueda inteligente de ofertas en retail (Falabella) y recomendaciones generadas por IA con grounding estricto.

**Proyecto académico** — DSY1106 Desarrollo Fullstack III · Duoc UC
**Equipo:** Marco Tassara · Martín Villegas · Jael Lisboa
**Docente:** Joan Manuel Toro Ortiz

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend + BFF | Next.js 16 (App Router) + React 19 + Tailwind CSS v4 |
| Auth + DB | Supabase (PostgreSQL + Auth + RLS) |
| ORM | Prisma 6 |
| IA | Google AI SDK (Gemini Flash) |
| Despliegue | Vercel Serverless |

## Arquitectura

Sistema de microservicios serverless en monorepo con sub-componentes desacoplados:

| Componente | Ubicación |
|---|---|
| Frontend | `app/(app)/`, `app/(auth)/` |
| BFF (API Routes + Server Actions) | `app/api/`, `app/(app)/**/actions.ts` |
| Microservicio Scraping | `services/scraper/` + `app/api/scraper/` |
| Microservicio IA | `services/ai/` + `app/api/ai/recomendar/` |

Análisis completo de patrones aplicados en [docs/01-analisis-patrones-y-arquetipos.md](docs/01-analisis-patrones-y-arquetipos.md).

## Setup local

### Prerequisitos

- Node.js 20+
- Cuenta Supabase con proyecto creado
- API Key de Google AI Studio (https://aistudio.google.com/apikey)

### Pasos

1. Clonar el repo:
   ```bash
   git clone https://github.com/YjaelBelenLisboaMardones/Ahorr-e_proyecto.git
   cd Ahorr-e_proyecto
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno: copiar `.env.example` a `.env` (o `.env.local`) y completar:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   DATABASE_URL=...     # pooler de Supabase, puerto 6543, ?pgbouncer=true
   DIRECT_URL=...       # session pooler, puerto 5432
   GEMINI_API_KEY=...
   # opcional para demos sin internet:
   # SCRAPER_MOCK=true
   ```

4. Aplicar el schema de Prisma a Supabase:
   ```bash
   npm run db:push
   ```

5. Ejecutar las migraciones SQL de RLS y triggers en el SQL Editor de Supabase, en orden:
   - `prisma/sql/01_profiles_trigger.sql`
   - `prisma/sql/02_profiles_rls.sql`
   - `prisma/sql/03_budgets_rls.sql`
   - `prisma/sql/04_expenses_rls.sql`
   - `prisma/sql/05_scraped_prices_rls.sql`

6. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

   Abrir http://localhost:3000 → registrar usuario → entrar al dashboard.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción |
| `npm run start` | Inicia build de producción |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npm run db:push` | Aplica el schema de Prisma a la BD |
| `npm run db:studio` | Abre Prisma Studio en localhost:5555 |
| `npm test` | Ejecuta tests unitarios con Vitest |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests + reporte de cobertura |

## Estructura de carpetas

```
app/
  (auth)/                # rutas públicas: login, registro
  (app)/                 # rutas autenticadas: dashboard, presupuestos, gastos, ofertas
  api/                   # endpoints del BFF
    scraper/             # microservicio de scraping
    ai/recomendar/       # microservicio de IA
lib/
  prisma.ts              # singleton de Prisma
  supabase/              # clientes Supabase (browser, server, middleware)
  env.ts                 # validación de variables de entorno
  format.ts              # helpers de formato (CLP, fechas)
services/
  auth/                  # repositorio de profiles
  budget/                # repositorios de budgets/expenses + budget-status (RF7)
  scraper/               # microservicio scraper (Strategy + Cache-aside + Adapter)
  ai/                    # microservicio IA (Facade + grounding)
prisma/
  schema.prisma          # schema de la BD
  sql/                   # migraciones SQL (triggers, RLS)
docs/                    # documentación del proyecto y guion de presentación
middleware.ts            # refresco de sesión + redirect de rutas privadas
```

## Requerimientos cumplidos

- **RF1** — Gestión Financiera Estricta: gastos solo si existe presupuesto previo.
- **RF2** — Búsqueda de Mejores Precios: scraping de Falabella con caché TTL 24h.
- **RF3** — Análisis asistido por IA: grounding estricto sobre payload del scraper.
- **RF4** — Comparación precio normal vs Ahorr-e (badge de ahorro en lista).
- **RF5** — Historial de gastos con análisis (dashboard agrega totales).
- **RF6** — Sugerencia de compras: recomendación con presupuesto disponible.
- **RF7** — Algoritmo de compra inteligente: `evaluatePurchase` rechaza compras que comprometen meta.
- **RNF1** Aislamiento (RLS), **RNF2** Asincronía (microservicios), **RNF3** Seguridad (Supabase Auth + RLS), **RNF4** Mobile-first, **RNF5** Mantenibilidad (microservicios desacoplados), **RNF6** Fiabilidad (cache stale-fallback), **RNF7** Escalabilidad (Serverless).

## Documentación adicional

- [Análisis de Patrones y Arquetipos](docs/01-analisis-patrones-y-arquetipos.md)
- [Plan de Branching](docs/02-plan-branching.md)
- [Guion de presentación](docs/03-guion-presentacion.md)
- [Cómo generar reporte de cobertura](docs/coverage.md)
- [README — Microservicio Scraper](services/scraper/README.md)
- [README — Microservicio IA](services/ai/README.md)

## Licencia

Proyecto académico sin licencia comercial.
