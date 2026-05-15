# @ahorre/finance — Microservicio financiero

Microservicio encargado de toda la lógica de finanzas personales: presupuestos, transacciones y categorías. Se comunica directamente con la base de datos a través de Prisma.

**Puerto por defecto:** 3002

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/budgets` | Lista los presupuestos del usuario |
| POST | `/api/v1/budgets` | Crea un presupuesto |
| GET | `/api/v1/transactions` | Lista las transacciones |
| POST | `/api/v1/transactions` | Registra una transacción (valida límite de presupuesto) |
| GET | `/api/v1/categories` | Lista las categorías |
| POST | `/api/v1/categories` | Crea una categoría |

La autenticación es por JWT de Supabase en el header `Authorization: Bearer <token>`.

## Estructura interna

```
src/modules/
  budgets/        # controllers, services, repositories, validators
  transactions/   # ídem — incluye validación de límite por período
  categories/     # ídem
```

Cada módulo sigue el mismo patrón: el controller valida el request con Zod, delega al service, y el service accede a la BD solo a través del repository.

## Variables de entorno

```
DATABASE_URL=        # Conexión PostgreSQL (Supabase pooler)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Instalación y ejecución

```bash
# Desde la raíz del monorepo
npm run dev --filter=@ahorre/finance

# O directamente
cd apps/finance
npm run dev
```

Antes de la primera ejecución, asegurarse de que el schema de Prisma esté sincronizado:

```bash
npx prisma db push --schema=../../packages/database/prisma/schema.prisma
npx prisma generate --schema=../../packages/database/prisma/schema.prisma
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `dev` | Servidor de desarrollo en puerto 3002 |
| `build` | Genera el cliente Prisma y compila |
| `lint` | ESLint |
| `typecheck` | Verificación de tipos |
