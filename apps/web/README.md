# @ahorre/web — BFF + Frontend

Aplicación principal de Ahorr-E. Actúa como BFF (Backend For Frontend): expone las páginas al usuario y centraliza las llamadas a los microservicios `finance` y `offers` a través de API Routes propias.

**Puerto por defecto:** 3000

## Estructura

```
src/
  app/              # Rutas Next.js (App Router)
    api/            # API Routes — punto de entrada BFF hacia los microservicios
    dashboard/      # Resumen financiero + gráfico mensual
    budgets/        # Gestión de presupuestos
    transactions/   # Historial de transacciones
    offers/         # Buscador de ofertas + recomendaciones IA
  components/       # Navbar, WithAuth, etc.
  contexts/         # AuthContext con auto-refresh de token
  lib/              # Clientes HTTP hacia finance y offers
```

## Variables de entorno

Copiar `.env.local.example` a `.env.local` y completar:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
FINANCE_SERVICE_URL=http://localhost:3002
OFFERS_SERVICE_URL=http://localhost:3003
```

## Instalación y ejecución

```bash
# Desde la raíz del monorepo
npm install
npm run dev --filter=@ahorre/web

# O solo este app
cd apps/web
npm run dev
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `dev` | Servidor de desarrollo en puerto 3000 |
| `build` | Build de producción |
| `lint` | ESLint |
| `typecheck` | Verificación de tipos sin compilar |

## Rol en la arquitectura

El BFF recibe todas las peticiones del browser. Nunca expone los microservicios directamente al cliente: las credenciales de servicio y la lógica de orquestación quedan en el servidor. El frontend consume únicamente las rutas `/api/*` de este mismo proceso.
