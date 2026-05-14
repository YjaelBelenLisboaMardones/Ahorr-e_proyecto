# @ahorre/offers — Microservicio de ofertas e IA

Microservicio que expone dos funcionalidades: búsqueda de productos desde una fuente externa y generación de recomendaciones de ahorro usando Gemini 2.5 Flash.

**Puerto por defecto:** 3003

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/offers/search?q=<query>` | Busca productos por término |
| POST | `/api/v1/recommendations` | Genera recomendación IA sobre un set de ofertas |

## Cómo funciona la búsqueda (RF2)

Las búsquedas se cachean en la tabla `OfferCache` de la BD con un TTL de 24 horas. Si el resultado existe y no venció, se devuelve directo desde la caché sin llamar a la API externa. Si no existe o venció, se consulta la fuente y se almacena.

Para forzar datos frescos en desarrollo se puede limpiar la caché con:
```sql
DELETE FROM "OfferCache";
```

La variable `SCRAPER_MOCK=true` activa respuestas estáticas sin llamar a la API externa (útil para pruebas locales sin internet).

## Recomendaciones IA (RF3 + RF6)

El endpoint `/recommendations` recibe el término de búsqueda, recupera las ofertas actuales desde la caché y las pasa como contexto a Gemini. El modelo no tiene acceso libre a internet ni conocimiento general sobre precios: solo puede razonar sobre el payload que se le entrega (grounding controlado).

Si la API de Gemini devuelve error 429 (cuota excedida), el servicio responde con un mensaje de error descriptivo en lugar de lanzar un 500.

## Variables de entorno

```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
SCRAPER_MOCK=false
```

## Instalación y ejecución

```bash
# Desde la raíz del monorepo
npm run dev --filter=@ahorre/offers

# O directamente
cd apps/offers
npm run dev
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `dev` | Servidor de desarrollo en puerto 3003 |
| `build` | Genera cliente Prisma y compila |
| `lint` | ESLint |
| `typecheck` | Verificación de tipos |
