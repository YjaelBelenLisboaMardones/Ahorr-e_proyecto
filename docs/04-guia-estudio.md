# Guía de estudio — Ahorr-E de punta a punta

Equipo: Marco Tassara · Martín Villegas · Jael Lisboa  
Asignatura: DSY1106 — Desarrollo Fullstack III · Duoc UC

Esta guía sigue el recorrido completo de la aplicación en el orden en que un usuario la usa. Para cada paso se indica qué archivo del código se ejecuta y por qué se tomó esa decisión técnica.

---

## 1. Cómo está organizado el proyecto

Ahorr-E es un **monorepo Turborepo** con cuatro aplicaciones Next.js independientes:

```
apps/
  auth/     → puerto 3011 — microservicio de usuarios/perfil
  finance/  → puerto 3002 — microservicio financiero (presupuestos, transacciones, categorías)
  offers/   → puerto 3003 — microservicio de búsqueda de ofertas + IA
  web/      → puerto 3000 — BFF + frontend (única app que ve el usuario)
packages/
  database/ → schema Prisma compartido
  shared/   → clases de error, códigos HTTP, utilidades
```

El usuario solo habla con `apps/web`. Esta app reenvía las peticiones a `apps/finance` y `apps/offers` según el contexto. Ese es el patrón **BFF (Backend for Frontend)**.

Para correr el proyecto completo:
```bash
npm install         # desde la raíz del monorepo
npm run dev         # levanta los 4 servicios en paralelo (Turborepo)
```

---

## 2. Flujo de autenticación

### 2.1. Registro

**Ruta del usuario:** `/signup`  
**Archivo:** `apps/web/src/app/signup/page.tsx`

El formulario envía email + password + nombre a Supabase Auth. Supabase crea el usuario en `auth.users` y dispara un trigger de base de datos que crea automáticamente el registro en `public.Profile`.

**Por qué un trigger y no código:** si el trigger no existiera y el Server Action fallara a mitad, quedaría un usuario en Auth sin perfil. El trigger garantiza atomicidad: si se crea el usuario de Auth, el perfil existe sí o sí.

### 2.2. Login

**Ruta:** `/login`  
**Archivo:** `apps/web/src/app/login/page.tsx`

Llama a Supabase Auth, recibe un JWT y un refresh token. El JWT se guarda en el contexto de React (`AuthContext`).

**JWT expiry y auto-refresh:** el token dura 1 hora. `apps/web/src/contexts/AuthContext.tsx` programa un timer que llama al endpoint de refresh de Supabase 5 minutos antes de que expire, de forma transparente para el usuario. Así nunca aparece un error 401 inesperado.

### 2.3. Protección de rutas

**Archivo:** `apps/web/src/components/WithAuth.tsx`

Cualquier página que requiera login se envuelve en `<WithAuth>`. Si no hay sesión activa, redirige a `/login`.

---

## 3. Dashboard

**Ruta:** `/dashboard`  
**Archivo:** `apps/web/src/app/dashboard/page.tsx`

Hace dos llamadas paralelas al microservicio finance:
- `GET /api/v1/transactions` → lista de transacciones
- `GET /api/v1/budgets` → lista de presupuestos

Con esos datos calcula en el cliente:
- Balance total (ingresos - gastos)
- Tasa de ahorro del mes
- Gráfico de barras con ingresos vs gastos de los últimos 6 meses (Recharts)

**Por qué calcular en el cliente:** la función `getMonthlyData()` es pura (no necesita BD), así que no tiene sentido agregarla como endpoint del backend. El BFF ya entregó los datos brutos.

---

## 4. Presupuestos

**Ruta:** `/budgets`  
**Archivo:** `apps/web/src/app/budgets/page.tsx`

Un presupuesto tiene: nombre, monto límite, período (WEEKLY / MONTHLY / YEARLY) y fecha de inicio.

Al crear uno, el formulario hace `POST /api/v1/budgets` al microservicio finance.

**Validación en backend:** `apps/finance/src/modules/budgets/validators/index.ts` usa Zod con `.strict()`, lo que significa que cualquier campo extra en el body resulta en error 400. Esto previene inyección de campos inesperados.

**Barra de progreso:** se calcula como `gastado / límite`. Si supera el 80%, se pone en ámbar. Si supera el 100%, en rojo.

---

## 5. Transacciones

**Ruta:** `/transactions`  
**Archivo:** `apps/web/src/app/transactions/page.tsx`

Al registrar un gasto, el usuario puede asignarle un presupuesto. El selector muestra el **saldo disponible en tiempo real** usando `getBudgetSpent()` de `apps/web/src/lib/finance-utils.ts`.

**Validación de límite en backend:** `apps/finance/src/modules/transactions/services/transactions.service.ts` verifica antes de guardar:
1. Busca el presupuesto en la BD y confirma que pertenece al usuario.
2. Suma los gastos ya registrados en el período actual (`getBudgetPeriodRange()`).
3. Si `gastado + nuevo gasto > límite`, devuelve error 422 con el saldo disponible.

Esto significa que aunque alguien manipule el frontend, el backend siempre rechaza el exceso.

---

## 6. Búsqueda de ofertas

**Ruta:** `/offers`  
**Archivo:** `apps/web/src/app/offers/page.tsx`

El usuario escribe un término de búsqueda. El BFF (`apps/web`) llama a `GET /api/v1/offers/search?q=...` en el microservicio offers.

### Cómo funciona el microservicio offers

**Archivo:** `apps/offers/src/modules/offers/services/scraper.service.ts`

**Patrón Cache-aside (RF2):**
1. El controlador busca primero en la tabla `OfferCache` de la BD.
2. Si hay resultados con menos de 24 horas de antigüedad → los devuelve directo.
3. Si no → llama a la API de DummyJSON, guarda el resultado en caché y lo devuelve.

Esto protege contra rate-limits de la API externa y hace que búsquedas repetidas sean instantáneas.

**Conversión de precios:** DummyJSON devuelve precios en USD. El servicio los convierte a CLP multiplicando por 950 (constante `USD_TO_CLP`).

**Variable SCRAPER_MOCK:** si `SCRAPER_MOCK=true` en el `.env`, el servicio devuelve productos estáticos sin llamar a ninguna API. Útil para desarrollo offline.

---

## 7. Recomendaciones IA

**Botón:** "Analizar con IA Gemini" en `/offers`  
**Archivo:** `apps/offers/src/modules/recommendations/services/recommendations.service.ts`

El botón aparece solo cuando ya hay resultados de búsqueda. Al hacer click, envía `POST /api/v1/recommendations` con el término de búsqueda.

**Patrón Grounding (RF3):** el servicio NO le pide a Gemini una recomendación libre. Le pasa el listado exacto de productos encontrados como contexto y le pide que razone solo sobre esos datos. Esto evita que el modelo "alucine" precios o productos inventados.

**Modelo usado:** `gemini-2.5-flash` (el 1.5-flash fue deprecado en 2025).

**Manejo de cuota (429):** si la API de Gemini devuelve error de cuota excedida, el backend captura el error y responde con un mensaje legible en lugar de un 500. El usuario ve: "El servicio de IA está temporalmente no disponible".

---

## 8. Registrar oferta como gasto

Al encontrar un producto de interés, el usuario puede registrarlo como gasto directamente desde la tarjeta de oferta.

Al hacer click en "Registrar como gasto", aparece un panel inline con:
- Selector de presupuesto (opcional)
- Saldo disponible en el presupuesto seleccionado (verde/ámbar/rojo)
- Botón "Confirmar gasto"

Esto llama al mismo endpoint de transacciones del microservicio finance. Si hay presupuesto seleccionado, se aplica la misma validación de límite del punto 5.

---

## 9. Patrones clave para la defensa oral

| Patrón | Dónde está | Qué resuelve |
|--------|------------|--------------|
| BFF | `apps/web` | El frontend no habla directo con la BD ni con los microservicios. Todo pasa por el web. |
| Repository | `apps/finance/src/modules/*/repositories/` | Acceso a BD centralizado, filtrado siempre por userId. |
| Service Layer | `apps/finance/src/modules/*/services/` | Lógica de negocio separada del controller y del repository. |
| Cache-aside | `apps/offers` (OfferCache) | Búsquedas rápidas, tolerancia a fallos de la API externa. |
| Grounding | `apps/offers/src/modules/recommendations/` | La IA solo razona sobre datos reales del sistema, no inventados. |
| Middleware (auth) | `apps/web/src/components/WithAuth.tsx` + `AuthContext.tsx` | JWT auto-refresh, protección de rutas. |

---

## 10. Tests unitarios

Cada app tiene su propia suite con Vitest. Para correrlos:

```bash
cd apps/finance  && npm test   # 27 tests
cd apps/offers   && npm test   # 20 tests
cd apps/auth     && npm test   # 12 tests
cd apps/web      && npm test   # 13 tests
# Total: 72 tests
```

Qué se testea:
- **finance:** validators Zod de transacciones y presupuestos, lógica de rangos de período (WEEKLY/MONTHLY/YEARLY)
- **offers:** conversión USD→CLP, modo mock, manejo de errores de red, validators
- **auth:** signupSchema y loginSchema
- **web:** `formatCLP`, `formatDate`, `getBudgetSpent` con aislamiento por presupuesto y mes

---

## 11. Preguntas frecuentes de defensa oral

**¿Por qué Turborepo y no un monolito?**  
Los microservicios de scraping e IA son pesados y de alta latencia. Aislarlos permite que escalen independientemente sin afectar al frontend.

**¿Qué pasa si el microservicio finance cae?**  
El BFF devuelve error al usuario. No hay estado compartido entre microservicios, así que no hay corrupción de datos.

**¿Por qué Supabase en lugar de una BD propia?**  
Row Level Security nativa: aunque el código tuviera un bug de filtrado, PostgreSQL garantiza que un usuario no puede leer datos de otro a nivel de base de datos.

**¿Cómo funciona el budget enforcement?**  
El backend calcula el gasto acumulado en el período actual del presupuesto (semana/mes/año) y rechaza cualquier gasto que lo supere, independientemente de lo que diga el frontend.

**¿Por qué Gemini y no ChatGPT?**  
El informe técnico del Parcial 1 ya justificó Google AI SDK. Además, Gemini 2.5 Flash tiene ventana de contexto de 1M tokens, necesaria si el catálogo de productos crece.
