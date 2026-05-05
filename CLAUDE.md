# Ahorr-E — guía técnica del repositorio

Este archivo es el contrato del equipo y la guía que cualquier instancia de Claude Code (o cualquier dev nuevo) debe leer antes de modificar este repo.

## Contexto del proyecto

**Ahorr-E** es una aplicación de gestión financiera personal con búsqueda inteligente de ofertas en retail (Falabella) y recomendaciones generadas por IA. Proyecto académico de **Duoc UC — DSY1106 Desarrollo Fullstack III** (Docente: Joan Manuel Toro Ortiz).

**Equipo:** Marco Tassara, Martín Villegas, Jael Lisboa.

**Documento maestro:** `INFORME TÉCNICO_ ARQUITECTURA DE MICROSERVICIOS - (5).docx` (no versionado — está en `.gitignore`). Contiene RFs, RNFs, justificaciones arquitectónicas y matriz de trazabilidad.

## Stack obligatorio

| Capa | Tecnología |
|---|---|
| Frontend + BFF | Next.js 16 (App Router) sobre Vercel |
| UI | React 19 + Tailwind CSS v4 (mobile-first, PWA) |
| Auth + DB | Supabase (PostgreSQL + Auth + Edge Functions + RLS) |
| ORM | Prisma |
| IA | Google AI SDK — Gemini Flash con grounding |
| Scraping | Microservicios serverless (Edge Functions / API Routes) |

**No introducir** Express, Mongo, Firebase, OpenAI ni reemplazos del stack sin discusión previa con el equipo. Cada cambio de stack debe trazar contra el informe técnico evaluado.

## Patrones arquitectónicos aplicados

- **BFF** — Next.js API Routes orquestan datos al frontend.
- **Microservicios Serverless** — scraping y llamadas a LLM aislados como funciones.
- **API Gateway** — Next.js como punto de entrada único.
- **Database per Service** — Supabase como persistencia aislada.
- **Cron Jobs** — refresco programado del cache de scraping (RF2, máx 24h).
- **Row Level Security** — aislamiento por usuario a nivel de infraestructura (RNF1).

## Flujo de ramas Git

```
feature/<nombre> → PR → dev → PR → qa → PR → master
```

- `master` = producción. **Prohibidos los commits directos.**
- `qa` = ambiente de QA / pre-producción.
- `dev` = rama de integración.
- `feature/<nombre-en-kebab-case>` = una rama por feature, parten desde `dev`.

**Antes de iniciar un feature:**
```bash
git checkout dev
git pull
git checkout -b feature/nombre-del-feature
```

**Al terminar:** push de la rama y abrir PR hacia `dev` (nunca a master ni qa).

## Estructura de carpetas

```
app/                  # App Router (rutas, layouts, pages)
  api/                # API Routes (BFF)
lib/                  # Clientes compartidos (supabase, prisma, env)
services/             # Lógica de dominio (ai, scraper, budget)
types/                # Tipos TypeScript compartidos
prisma/
  schema.prisma       # Schema de la BD
public/               # Assets estáticos
```

## Variables de entorno

Ver `.env.example` en la raíz. Variables actuales:

| Variable | Uso | Visibilidad |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Cliente + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (protegida por RLS) | Cliente + Server |
| `DATABASE_URL` | Conexión Postgres para Prisma | Server only |
| `GEMINI_API_KEY` | API Key de Google AI SDK | Server only |

**Nunca** poner prefijo `NEXT_PUBLIC_` a `GEMINI_API_KEY` ni a un eventual `SUPABASE_SERVICE_ROLE_KEY`. Si una key debe estar disponible en el browser, justificarlo explícitamente.

## Reglas de código

- **TypeScript strict** activado. No usar `any` salvo justificación.
- **Mobile-first**: cualquier UI nueva se diseña primero para mobile (RNF4).
- **Grounding obligatorio para IA (RF3)**: las recomendaciones de ahorro alimentan a Gemini exclusivamente con el payload del scraper. El chat libre no se usa como motor de recomendaciones.
- **Cache de scraping (RF2)**: las búsquedas leen primero de la BD local; el scraping live es solo refresco programado o miss explícito.
- **RLS** activado en todas las tablas con datos del usuario. Validar políticas antes de exponer una tabla.

## Trazabilidad RF/RNF

Cada PR debe declarar en su descripción a qué requerimiento(s) del informe técnico responde. Ejemplo: "Implementa RF1 (gestión financiera estricta) + RNF3 (Supabase Auth)".

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run lint         # ESLint
npx prisma generate  # Regenerar cliente Prisma tras cambiar schema.prisma
npx prisma db push   # Sincronizar schema con Supabase (sin migraciones formales)
npx prisma migrate dev --name <nombre>  # Migración formal versionada
```
