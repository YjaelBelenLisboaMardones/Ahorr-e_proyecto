# Guion de Presentación — Defensa Oral 15 minutos

**Asignatura:** DSY1106 — Desarrollo Fullstack III · Duoc UC
**Equipo:** Marco Tassara · Martín Villegas · Jael Lisboa
**Duración objetivo:** 15 minutos · 5 min por integrante

---

## Estructura general

| Tiempo | Sección | Quién habla |
|---|---|---|
| 0:00 – 1:30 | Introducción y contexto | Marco |
| 1:30 – 3:30 | Arquitectura y patrones (parte 1) | Marco |
| 3:30 – 5:30 | Arquitectura y patrones (parte 2) | Yjael |
| 5:30 – 8:00 | Demo en vivo | Martín |
| 8:00 – 10:00 | Branching y colaboración | Yjael |
| 10:00 – 11:30 | Lecciones aprendidas y cierre | Marco |
| 11:30 – 15:00 | Preguntas del docente (individuales) | Todos |

---

## Sección 1 — Introducción (Marco, 1.5 min)

> "Buenas tardes profesor, somos Marco, Yjael y Martín. Presentamos **Ahorr-E**, una aplicación de gestión financiera personal con búsqueda inteligente de ofertas en Falabella y recomendaciones generadas por IA con grounding estricto."

**Puntos clave a mencionar:**
- Tres necesidades del cliente: (1) registrar gastos contra presupuesto, (2) buscar mejores precios, (3) recibir recomendaciones de ahorro.
- Descartamos arquitectura monolítica por requisitos de latencia.
- Adoptamos arquitectura **serverless distribuida con microservicios**.

---

## Sección 2 — Arquitectura y Patrones, Parte 1 (Marco, 2 min)

**Apoyarse en el diagrama de arquitectura y mostrar el código en pantalla.**

> "El sistema tiene cuatro componentes: un Frontend NPM, un BFF, y dos microservicios — uno de scraping y uno de IA."

**Patrones a destacar:**

1. **BFF (Backend for Frontend)** — `app/api/`
   > "El BFF es la capa orquestadora entre el cliente y la BD. Pre-procesa data — por ejemplo, calcula el saldo restante de cada presupuesto antes de mandarlo al móvil — para reducir over-fetching."

2. **Microservicios Serverless** — `services/scraper/` y `services/ai/`
   > "Cada microservicio corre como función Vercel independiente. Si el scraping se satura por una promo masiva, el endpoint de IA no se ve afectado. Esto cumple RNF2 y RNF7."

3. **Cache-aside** — `services/scraper/search-products.ts`
   > "Aquí ocurre algo interesante: el cliente nunca consulta directamente a Falabella. Pasamos primero por nuestra BD, y solo si el dato tiene más de 24 horas se invoca al scraper. Cuando Falabella cambió su endpoint en desarrollo, capturamos en pantalla el badge `caché expirada · fuente caída` — la app NO se cayó porque el patrón sostiene esa falla."

---

## Sección 3 — Arquitectura y Patrones, Parte 2 (Yjael, 2 min)

> "Marco les habló de los patrones macro. Yo les muestro tres patrones más finos que aseguran mantenibilidad."

1. **Repository** — `services/budget/budget-repository.ts`
   > "Cada agregado de dominio tiene su repository. Toda operación recibe `profileId` y filtra por él, garantizando que un usuario nunca pueda tocar data de otro. Fíjense que usamos `updateMany` en vez de `update` directo — eso permite filtrar por dueño en una sola query atómica."

2. **Strategy** — `services/scraper/types.ts`
   > "El scraper es una interface. Hoy implementamos `FalabellaScraper`, pero agregar `JumboScraper` mañana es trivial: nueva clase, nueva implementación, sin tocar el orquestador. Open/Closed."

3. **Facade** — `services/ai/recommend-service.ts`
   > "Para generar una recomendación coordinamos cuatro servicios: scraper, presupuestos, gastos, Gemini. El facade `recommendForProfile` esconde toda esa orquestación. El endpoint API quedó en 10 líneas."

---

## Sección 4 — Demo en vivo (Martín, 2.5 min)

**IMPORTANTE: tener `npm run dev` corriendo desde antes con `SCRAPER_MOCK=true` en `.env`.**

### Flujo de demo

1. **Login** → `/login`. *"Auth está protegida con Supabase Auth + middleware que refresca sesión en cada request."*

2. **Dashboard** → muestra 4 cards (presupuestado, gastado, restante, movimientos). *"Esto es el BFF agregando data en el server, no en el browser."*

3. **Crear presupuesto** → `/presupuestos/nuevo` → $100.000 categoría Alimentación.

4. **Crear gasto válido** → `/gastos/nuevo` → "Almuerzo" $5.000 → OK.

5. **Mostrar RF7 — Algoritmo de compra inteligente:** intentar gasto de $200.000.
   > "El sistema rechaza la operación porque compromete la meta de ahorro. La regla está encapsulada en `evaluatePurchase` con patrón Specification."

6. **Buscar oferta** → `/ofertas` → buscar "fanta" → mostrar lista + badge "🌐 Datos frescos".
   > "Primera vez que se busca, va al scraper. Si vuelvo a buscar..."

7. **Repetir búsqueda** → ahora muestra "📦 Desde caché (≤24h)".
   > "Cache-aside funcionando."

8. **Click 💡 Recomendar con IA** → muestra recomendación violeta de Gemini.
   > "Aquí Gemini SOLO ve los productos del caché y mi presupuesto disponible. No tiene acceso a internet ni a su corpus general. Eso es **grounding** — RF3 cumplido. Para probarlo..."

9. **Buscar `xyzabc`** → "Sin resultados". El botón de IA NO aparece.
   > "Si no hay productos en el payload, no hay recomendación. La IA no inventa."

---

## Sección 5 — Branching y Colaboración (Yjael, 2 min)

**Mostrar en pantalla:** `git log --oneline --graph --all` o la lista de PRs en GitHub.

> "Aplicamos GitFlow simplificado: `feature/* → dev → qa → master`."

**Puntos a destacar:**

1. Cada feature en rama propia con kebab-case (`feature/auth-supabase`, `feature/scraping`, etc.).

2. PRs obligatorios para cada merge. **11 PRs cerrados** durante el sprint.

3. Promoción de versiones por batch — ejemplo: `dev → qa` con título "Release candidate v1.0", luego `qa → master` con "Release v1.0 a producción".

4. **Transparencia:** "En `feature/presupuestos` mergeamos directo a master por una urgencia de coordinación. Lo identificamos como deuda de proceso. Desde el siguiente feature retomamos el flujo, evidente en los PRs #7, #10 y #11."

5. **Conflicto resuelto en vivo:** durante el desarrollo paralelo de `feature/scraping` y `feature/ia-recomendaciones`, ambos modificaban `app/(app)/layout.tsx`. Se sincronizó con `git merge origin/dev`, se resolvió manteniendo los dos enlaces, y se commiteó el merge.

---

## Sección 6 — Lecciones y Cierre (Marco, 1.5 min)

**Tres lecciones técnicas:**

1. **El cache-aside con stale-fallback no es teoría — funcionó en producción.** Cuando Falabella cambió su API, capturamos el badge "fuente caída" en pantalla. El patrón nos salvó la demo.

2. **Supabase NANO obliga al pooler.** Aprendimos que el plan free de Supabase no expone el host directo `db.<ref>.supabase.co`. Hubo que migrar la configuración de Prisma a usar Supavisor (puertos 6543 y 5432).

3. **El grounding es disciplina, no magia.** Para que Gemini no alucine, hay que pasarle SOLO el payload del scraper. Le construimos un prompt explícito que dice "si la lista está vacía, responde 'no tengo datos'". Lo probamos en vivo escribiendo `xyzabc`.

**Cierre:**

> "Cumplimos los 7 RFs y los 7 RNFs del informe técnico. Implementamos 12 patrones de diseño documentados, más 2 patrones de seguridad de infraestructura. La arquitectura es escalable, mantenible y económicamente viable para el plan gratuito de Vercel y Supabase. Gracias."

---

## Banco de preguntas posibles del docente

### Sobre patrones

**P:** *¿Cuál es la diferencia entre Repository y Service Layer en su sistema?*
**R:** Repository accede a una sola tabla/agregado (`Budget` o `Expense`). Service Layer combina datos de múltiples repositories para calcular información derivada (ej. `getBudgetStatus` cruza `Budget` con la suma de `Expense`). Repositorios son persistencia, services son lógica de negocio.

**P:** *¿Por qué eligieron Cache-aside y no Write-through o Read-through?*
**R:** Write-through requiere que cada update propague al caché — pero el "owner" del dato es el retailer externo, no nosotros. No tenemos control de cuándo Falabella cambia precios. Cache-aside con TTL 24h ajusta a la realidad: aceptamos lag, la app responde rápido y limita golpes al retailer.

**P:** *¿Cómo agregarían un segundo retailer (Jumbo)?*
**R:** Crear `services/scraper/jumbo-scraper.ts` que implemente la interface `Scraper`. Agregarlo al array `SCRAPERS` en `search-products.ts`. Cero cambios en el orquestador, en la BD ni en la UI.

### Sobre branching

**P:** *¿Qué pasa si dos personas mergean a dev al mismo tiempo?*
**R:** GitHub detecta el conflicto y bloquea el merge del segundo PR. Quien queda atrás debe sincronizar localmente con `git merge origin/dev`, resolver, y volver a pushear. Lo vivimos con `feature/scraping` vs `feature/ia-recomendaciones` modificando ambos `layout.tsx`.

**P:** *¿Por qué no hicieron rebase en vez de merge?*
**R:** Decisión consciente: el merge preserva el historial real de cuándo se desarrolló cada feature. Rebase reescribe el historial y dificulta auditoría en defensa oral. Para un proyecto académico evaluado por evidencia visual, merge es superior.

### Sobre la IA y grounding

**P:** *¿Cómo previenen que Gemini se invente productos?*
**R:** Tres capas: (1) prompt explícito con regla "solo puedes hablar de los productos listados", (2) si el cache-aside devuelve vacío, ni siquiera llamamos a Gemini — devolvemos "no tengo datos para recomendar", (3) en la UI, el botón de IA solo aparece cuando hay productos. Lo demostramos buscando `xyzabc`.

**P:** *¿Por qué no usan ChatGPT?*
**R:** Gemini 1.5/2.5 Flash ofrece ventana de contexto de 1M tokens (vs 128K de GPT-4o), latencia menor a 5 segundos y capa gratuita generosa. Para un MVP académico el costo cero es decisivo.

### Sobre seguridad

**P:** *¿Qué pasa si alguien obtiene la `NEXT_PUBLIC_SUPABASE_ANON_KEY`?*
**R:** Esa key está diseñada para ser pública. La protección está en RLS — aunque alguien la use, las políticas SQL le impiden ver data de otros usuarios. Defensa en profundidad.

**P:** *¿Por qué Prisma puede bypasear RLS?*
**R:** Prisma se conecta con la cuenta `postgres` (super-admin) vía `DATABASE_URL`. Esa cuenta bypasea RLS por diseño de PostgreSQL. La seguridad real la dan: (a) autenticación obligatoria en cada Server Action vía `requireUser()`, (b) Repositories que filtran por `profileId`, (c) RLS como red de protección si algo del código falla.

---

## Tips para la defensa

- **Respira.** Las preguntas individuales pesan 70% — más que la presentación. Si no sabes algo, di "esa parte la trabajó X, déjame consultarle" en lugar de inventar.
- **Apóyate en el código.** Si te preguntan algo abstracto, di "déjame mostrarte el archivo donde está implementado" y abre VSCode.
- **Habla del 'por qué', no del 'qué'.** En vez de "usamos Cache-aside", di "usamos Cache-aside porque el retailer externo nos puede tirar 429 si lo golpeamos demasiado, y porque la app debe responder aunque Falabella esté caída".
- **El stale-fallback de Falabella es tu mejor anécdota.** Repítela. Es evidencia de que la arquitectura funciona en condiciones adversas reales.
- **No minimicen el branching.** Indicador 7 vale 15%. Tener `git log --graph` proyectado en pantalla cuando hablan de eso vale oro.
