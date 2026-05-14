# 🤖 Ahorr-E — Guía Técnica del Monorepo

Este archivo es el **contrato de gobernanza** obligatorio. Cualquier agente de IA o desarrollador DEBE seguir estas reglas para evitar la degradación de la arquitectura.

## 🏗️ Arquitectura Monorepo (PNPM Workspaces)

Hemos migrado de un monolito a una arquitectura distribuida para garantizar la **Escalabilidad (RNF7)** y el **Loose Coupling**.

- **Aislamiento Estricto:** Los microservicios en `services/*` son paquetes independientes. No comparten lógica interna.
- **Prohibición de Acoplamiento:** Queda estrictamente **PROHIBIDO** el `import` relativo entre servicios (ej. `import ... from '../scraper'`).
- **Comunicación:** La interacción entre servicios solo ocurre vía **HTTPS Fetch** (BFF Pattern) orquestada por Next.js API Routes.
- **Contratos Inmutables:** Los tipos y esquemas de validación residen EXCLUSIVAMENTE en `packages/shared-types`.
- **Runtime:** Prioridad absoluta a **Edge Runtime** para cumplir con **RNF2 (Rendimiento)**. Prohibido usar módulos nativos de Node.js (`fs`, `path`) en servicios.

## 🛠️ Stack Obligatorio

| Capa | Tecnología |
|---|---|
| **Gestor de Monorepo** | PNPM Workspaces |
| **Frontend + BFF** | Next.js 16 (App Router) |
| **Microservicios** | Supabase Edge Functions / Next API Routes (Edge) |
| **Validación** | Zod (Contratos inmutables) |
| **Base de Datos** | Supabase (PostgreSQL + RLS) |
| **ORM** | Prisma (Client per service) |
| **Testing** | Vitest (Edge Runtime environment) |

## 🌲 Flujo de Ramas y Commits

Seguimos un flujo de **Gitflow Adaptado** para asegurar el **Peer Review**:

feature/* ───> qa ───> master (Producción)


- **Commits:** Obligatorio usar **Conventional Commits** (ej: `feat(shared): ...`, `chore(infra): ...`).
- **Gobernanza:** Los merges a `master` requieren revisión de Marco o Martín para validar políticas **RLS (RNF1)**.

## 📁 Estructura del Proyecto

```bash
ahorr-e/
├── app/                # Frontend & BFF (Next.js)
├── services/
│   ├── ai/            # Servicio de recomendaciones (Gemini)
│   ├── scraper/       # Microservicio de crawling retail
│   └── budget/        # Lógica de gestión financiera (RF1)
├── packages/
│   └── shared-types/  # LA ÚNICA FUENTE DE VERDAD (Zod schemas)
├── docs/               # INFRA.md y especificaciones técnicas
├── package.json        # Orquestador raíz
└── pnpm-workspace.yaml # Definición de cimientos