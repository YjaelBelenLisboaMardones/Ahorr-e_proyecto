# @ahorre/auth — Microservicio de usuarios

Microservicio que gestiona el perfil de usuario dentro de Ahorr-E. La autenticación en sí (sesiones, tokens, OAuth) la maneja Supabase Auth; este servicio se encarga de la capa de datos del perfil asociado al `userId` de Supabase.

**Puerto por defecto:** 3011

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/users/me` | Retorna el perfil del usuario autenticado |
| PATCH | `/api/v1/users/me` | Actualiza datos del perfil |

Todos los endpoints requieren `Authorization: Bearer <token>` con el JWT de Supabase.

## Estructura interna

```
src/modules/
  users/
    controllers/    # Extrae y valida el request
    services/       # Lógica de negocio del perfil
    repositories/   # Acceso a la BD (Prisma)
    validators/     # Esquemas Zod
```

## Variables de entorno

```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Instalación y ejecución

```bash
# Desde la raíz del monorepo
npm run dev --filter=@ahorre/auth

# O directamente
cd apps/auth
npm run dev
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `dev` | Servidor de desarrollo en puerto 3011 |
| `build` | Genera cliente Prisma y compila |
| `lint` | ESLint |
| `typecheck` | Verificación de tipos |
