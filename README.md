# Ahorr-E

Aplicación de gestión financiera personal con búsqueda de productos y recomendaciones de ahorro generadas por IA.

**Proyecto académico** — DSY1106 Desarrollo Fullstack III · Duoc UC  
**Equipo:** Marco Tassara · Martín Villegas · Jael Lisboa  
**Docente:** Joan Manuel Toro Ortiz  
**Repositorio:** https://github.com/YjaelBelenLisboaMardones/Ahorr-e_proyecto

---

## Arquitectura

Monorepo **Turborepo** con cuatro aplicaciones Next.js independientes:

| App | Puerto | Rol |
|-----|--------|-----|
| `apps/web` | 3000 | BFF + Frontend — único punto de entrada para el usuario |
| `apps/finance` | 3002 | Microservicio financiero (presupuestos, transacciones, categorías) |
| `apps/offers` | 3003 | Microservicio de ofertas + recomendaciones IA (Gemini 2.5 Flash) |
| `apps/auth` | 3011 | Microservicio de perfiles de usuario |

```
apps/web  ──→  apps/finance
          ──→  apps/offers
          ──→  apps/auth
               └── Supabase (PostgreSQL + Auth + RLS)
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Monorepo | Turborepo 2.x |
| Frontend + BFF | Next.js 16 · React 19 · Tailwind CSS v4 |
| Auth + DB | Supabase (PostgreSQL + Auth + RLS) |
| ORM | Prisma 6 (schema compartido en `packages/database`) |
| IA | Google AI SDK — Gemini 2.5 Flash |
| Testing | Vitest 2.1.9 |
| Despliegue | Vercel Serverless |

## Setup local

**Prerequisitos:** Node.js 20+, cuenta Supabase, API Key de Google AI Studio.

```bash
# 1. Clonar
git clone https://github.com/YjaelBelenLisboaMardones/Ahorr-e_proyecto.git
cd Ahorr-e_proyecto

# 2. Instalar dependencias (instala todos los workspaces)
npm install

# 3. Configurar variables de entorno
# Crear .env.local en cada app según docs/env-vars.md

# 4. Sincronizar schema de Prisma con Supabase
npx prisma db push --schema=packages/database/prisma/schema.prisma

# 5. Levantar los 4 servicios en paralelo
npm run dev
```

Abrir http://localhost:3000

Para el detalle de cada variable de entorno ver [docs/env-vars.md](docs/env-vars.md).

## Comandos

Desde la raíz del monorepo:

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Levanta los 4 servicios en paralelo |
| `npm run build` | Build de producción de todos los servicios |
| `npm run lint` | ESLint en todos los workspaces |

Por servicio (ejemplo con finance, aplica igual a los demás):

| Comando | Descripción |
|---------|-------------|
| `npm run dev --filter=@ahorre/finance` | Solo el microservicio finance |
| `npm test` (desde `apps/finance`) | Suite de tests unitarios |

## Tests unitarios

72 tests distribuidos en los 4 componentes, todos pasando:

```
apps/finance   → 27 tests  (validators, budget period range)
apps/offers    → 20 tests  (scraper, conversión USD→CLP, validators)
apps/auth      → 12 tests  (signupSchema, loginSchema)
apps/web       → 13 tests  (formatCLP, formatDate, getBudgetSpent)
```

Para correr en cada app:
```bash
cd apps/<nombre>
npm test
```

## Estructura del monorepo

```
apps/
  web/          BFF + frontend
  finance/      Microservicio financiero
  offers/       Microservicio ofertas + IA
  auth/         Microservicio usuarios
packages/
  database/     Schema Prisma compartido
  shared/       Clases de error y utilidades compartidas
docs/           Documentación técnica del proyecto
turbo.json      Pipeline de Turborepo
```

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [docs/01-analisis-patrones-y-arquetipos.md](docs/01-analisis-patrones-y-arquetipos.md) | Patrones de diseño aplicados |
| [docs/02-plan-branching.md](docs/02-plan-branching.md) | Estrategia de ramas Git |
| [docs/04-guia-estudio.md](docs/04-guia-estudio.md) | Guía de la app de punta a punta |
| [docs/05-informe-tecnico.md](docs/05-informe-tecnico.md) | Informe técnico completo |
| [docs/06-presentacion.md](docs/06-presentacion.md) | Guion de defensa oral |
| [docs/env-vars.md](docs/env-vars.md) | Variables de entorno por microservicio |

## Branching

```
feature/<nombre>  →  dev  →  qa  →  master
```

`master` = producción. Prohibidos los commits directos.

---

Proyecto académico sin licencia comercial.
