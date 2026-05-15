# Guion de presentación — Defensa oral Parcial 2
## Ahorr-E · DSY1106 Desarrollo Fullstack III · Duoc UC

**Duración total:** 15 minutos  
**Distribución:** 5 minutos por integrante  
**Orden:** Marco → Martín → Jael

---

## Marco Tassara — Introducción y arquitectura (0:00 – 5:00)

### Apertura (0:00 – 1:00)

"Buenos días. Vamos a presentar Ahorr-E, una aplicación de gestión financiera personal con búsqueda inteligente de productos y recomendaciones de ahorro generadas por IA.

El problema que resuelve es concreto: la mayoría de las apps de finanzas personales te dicen cuánto gastaste, pero no te ayudan a gastar mejor. Ahorr-E agrega la capa de búsqueda de precios y recomendaciones para cerrar ese ciclo."

### Arquitectura (1:00 – 3:00)

"Técnicamente, el sistema es un monorepo Turborepo con cuatro componentes independientes:

- `apps/web` en el puerto 3000: es el BFF y el frontend. El usuario solo habla con este componente. Nunca con los microservicios directamente.
- `apps/finance` en 3002: gestiona presupuestos, transacciones y categorías.
- `apps/offers` en 3003: búsqueda de productos con caché de 24 horas y recomendaciones con Gemini 2.5 Flash.
- `apps/auth` en 3011: gestiona el perfil del usuario.

El patrón BFF es central en la arquitectura: el frontend no sabe la URL de los microservicios. Toda la orquestación la hace el web. Esto protege los microservicios y permite que el frontend reciba datos ya procesados."

### Por qué estas decisiones (3:00 – 5:00)

"La elección de Supabase como base de datos no es solo por comodidad. Supabase trae Row Level Security nativa, lo que significa que aunque hubiera un bug en el código del servidor y se olvidara filtrar por usuario, PostgreSQL garantiza a nivel de BD que nadie puede leer datos de otro.

Turborepo nos permitió correr los cuatro servicios en paralelo con un solo `npm run dev`, tener packages compartidos como el schema de Prisma y las clases de error, y builds incrementales: solo reconstruye lo que cambió.

La migración de monolito a monorepo fue uno de los desafíos principales. Al principio todo estaba en una sola app. A medida que los microservicios crecieron, Turborepo fue la solución natural."

---

## Martín Villegas — Microservicio Finance y patrones de código (5:00 – 10:00)

### El microservicio finance (5:00 – 7:00)

"El microservicio finance es el núcleo del negocio. Tiene tres módulos: presupuestos, transacciones y categorías. Cada uno sigue exactamente la misma estructura interna: controller, service, repository y validators.

Esta uniformidad no es accidental. Es el patrón Service Layer combinado con Repository. El controller solo valida que el request HTTP esté bien formado usando Zod. El service contiene la lógica de negocio. El repository es el único que toca Prisma.

¿Por qué separar así? Porque si mañana cambiamos de Prisma a otro ORM, solo se modifica el repository. El service no sabe cómo está almacenada la data."

### La validación de presupuesto (7:00 – 8:30)

"La funcionalidad más importante es el enforcement de límites de presupuesto. Cuando un usuario registra un gasto asociado a un presupuesto, el backend calcula cuánto se ha gastado en el período actual del presupuesto: semanal, mensual o anual.

Si el nuevo gasto más lo ya gastado supera el límite, el backend devuelve HTTP 422 con el saldo disponible. Esto no se puede evadir desde el frontend.

La función `getBudgetPeriodRange()` en `transactions.service.ts` encapsula toda esa lógica de fechas. Eso nos permitió también testearla de forma aislada. Tenemos 9 tests específicos para esa función cubriendo los tres períodos."

### Validadores y strict mode (8:30 – 10:00)

"Todos los schemas Zod del sistema usan `.strict()`. Esto significa que si el body de un request trae un campo que no está definido en el schema, la petición falla con 400. Es una protección simple pero efectiva contra inyección de campos inesperados.

Por ejemplo, si alguien intenta mandar `{ amount: 1000, type: 'EXPENSE', admin: true }` al endpoint de transacciones, el schema lo rechaza en el momento de la validación, antes de que el código de negocio lo procese."

---

## Jael Lisboa — Microservicio Offers, IA y pruebas (10:00 – 15:00)

### Búsqueda con cache-aside (10:00 – 12:00)

"El microservicio de offers implementa el patrón Cache-aside para cumplir el requerimiento de no saturar la API externa con cada búsqueda.

El flujo es: cuando llega una búsqueda, el servicio revisa primero la tabla `OfferCache` en la BD. Si hay resultados con menos de 24 horas, los devuelve directamente. Si no, consulta DummyJSON, convierte los precios de USD a CLP multiplicando por 950, guarda en caché y devuelve.

Esto tiene dos beneficios: las búsquedas repetidas son instantáneas, y si la API externa cae, los datos en caché siguen disponibles."

### Recomendaciones con grounding (12:00 – 13:30)

"Las recomendaciones de IA usan un patrón que llamamos grounding. Cuando el usuario pide una recomendación, no le mandamos a Gemini una pregunta libre. Le mandamos el listado exacto de productos que encontramos, con sus precios y descuentos, y le pedimos que razone solo sobre esos datos.

Esto es crítico porque los modelos de lenguaje tienden a inventar precios y productos. Con grounding, la recomendación siempre está anclada a datos reales del sistema.

Si la API de Gemini devuelve error 429 por cuota excedida, el sistema captura el error y responde con un mensaje descriptivo. El usuario no ve un error 500 genérico."

### Pruebas unitarias (13:30 – 15:00)

"En total tenemos 72 pruebas unitarias distribuidas en los cuatro componentes. Se corren con Vitest, que es compatible nativamente con TypeScript sin configuración adicional.

Las pruebas cubren lo más crítico: los validators Zod, la lógica de períodos de presupuesto, la conversión de precios, el modo mock del scraper y las funciones utilitarias del frontend.

Decidimos no mockear la BD en estos tests. Las funciones que testamos son puras o están desacopladas de Prisma. Eso hace que los tests sean rápidos, deterministas, y que si algo falla, el error apunta directamente al problema real y no a la configuración del mock.

Los 72 tests pasan en menos de 3 segundos en total.

Eso es todo. Quedamos disponibles para las preguntas."

---

## Preguntas probables y respuestas cortas

**¿Qué es un BFF?**  
Backend for Frontend. Es una capa intermedia entre el cliente y los microservicios. El cliente no conoce los microservicios directamente. El BFF orquesta, agrega y protege.

**¿Por qué microservicios y no un monolito?**  
Porque scraping e IA son operaciones pesadas y de alta latencia. Si estuvieran en el mismo proceso que el frontend, un timeout en Gemini bloquearía toda la app. Aislados, escalan independientemente.

**¿Qué pasa si el microservicio de offers cae?**  
El BFF devuelve error al usuario en esa funcionalidad. El resto de la app (finanzas, presupuestos) sigue funcionando. No hay estado compartido entre microservicios.

**¿Qué es Row Level Security?**  
Es una política de seguridad a nivel de PostgreSQL. Aunque el código del servidor tuviera un bug y no filtrara por usuario, la BD garantiza que una query solo devuelve los registros del usuario autenticado.

**¿Cómo funciona el auto-refresh del JWT?**  
El token de Supabase dura 1 hora. El `AuthContext` calcula cuándo vence y programa un timer para renovarlo 5 minutos antes usando el refresh token. El usuario nunca ve un error 401.

**¿Por qué Vitest y no Jest?**  
Vitest es compatible con TypeScript y ESM de forma nativa, sin transpilación. Jest requiere configuración adicional para ESM. En un monorepo TypeScript, Vitest es más simple y más rápido.

**¿Qué cubre la cobertura de tests?**  
Cubre la lógica de negocio crítica: validators, cálculos de período de presupuesto, conversión de precios, funciones de formato y filtrado. Las integraciones con BD y Gemini se validan en demo en vivo porque mockear esas dependencias no agrega valor real al test.
