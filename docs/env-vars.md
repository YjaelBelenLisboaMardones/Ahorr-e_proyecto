# Variables de entorno — Ahorr-E

Cada app tiene su propio `.env.local`. Ninguno se sube al repo (`.gitignore` los excluye todos).

Los valores de Supabase se encuentran en: **dashboard Supabase → Project Settings → API**

---

## apps/web — BFF + Frontend (puerto 3000)

Archivo: `apps/web/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

NEXT_PUBLIC_AUTH_API_URL=http://localhost:3011
NEXT_PUBLIC_FINANCE_API_URL=http://localhost:3002
NEXT_PUBLIC_OFFERS_API_URL=http://localhost:3003
```

| Variable | Dónde se obtiene |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `NEXT_PUBLIC_*_API_URL` | URLs locales de los otros microservicios |

---

## apps/finance — Microservicio financiero (puerto 3002)

Archivo: `apps/finance/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

| Variable | Dónde se obtiene |
|----------|-----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role (**nunca `NEXT_PUBLIC_`**) |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string → **Transaction pooler** (puerto 6543) |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection string → **Direct connection** (puerto 5432) — solo para migraciones Prisma |

---

## apps/offers — Microservicio ofertas + IA (puerto 3003)

Archivo: `apps/offers/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres

GEMINI_API_KEY=<tu-api-key>
SCRAPER_MOCK=false
```

| Variable | Dónde se obtiene |
|----------|-----------------|
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `SCRAPER_MOCK` | `true` para datos estáticos sin llamar APIs, `false` para producción |

---

## apps/auth — Microservicio de usuarios (puerto 3011)

Archivo: `apps/auth/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

---

## Resumen — qué necesita cada app

| Variable | web | finance | offers | auth |
|----------|:---:|:-------:|:------:|:----:|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | ✓ | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | — | ✓ | ✓ | ✓ |
| `DATABASE_URL` | — | ✓ | ✓ | ✓ |
| `DIRECT_URL` | — | ✓ | ✓ | ✓ |
| `GEMINI_API_KEY` | — | — | ✓ | — |
| `SCRAPER_MOCK` | — | — | ✓ | — |
| `NEXT_PUBLIC_*_API_URL` | ✓ | — | — | — |

---

## Notas importantes

- `DATABASE_URL` usa el **pooler** (puerto 6543) con `pgbouncer=true`. En el plan free de Supabase el host directo `db.<ref>.supabase.co` no está disponible para conexiones externas, solo el pooler `aws-0-<region>.pooler.supabase.com`.
- `DIRECT_URL` es necesario para que `prisma migrate` y `prisma db push` funcionen correctamente. No se usa en runtime.
- `GEMINI_API_KEY` nunca debe tener el prefijo `NEXT_PUBLIC_` — es server-only.
- Cuando Supabase pausa el proyecto (plan free, 7 días de inactividad), hay que reanudarlo desde el dashboard antes de correr la app.
