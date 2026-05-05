# Microservicio de IA

Microservicio que genera recomendaciones de ahorro usando Google Gemini Flash con **grounding estricto**: el modelo solo razona sobre los productos del scraper y el presupuesto del usuario. Nunca usa su corpus general.

**Cumple:** RF3 (análisis asistido sin alucinaciones) + RF6 (sugerencia de compras proactivas).

## Estructura

```
services/ai/
  gemini.ts                 # cliente Gemini SDK + 3 funciones primitivas
  recommend-service.ts      # Facade: orquesta scraper + presupuesto + IA
```

## Endpoint expuesto

`POST /api/ai/recomendar` — body `{ query: string }`. Requiere sesión activa.

Respuesta:
```json
{
  "query": "fanta",
  "productosUsados": 3,
  "presupuestoDisponible": 95000,
  "recommendation": "Te recomiendo el pack 6un de Fanta Naranja...",
  "source": "cache" | "live" | "stale-fallback" | "no-data"
}
```

Si `source === "no-data"` el `recommendation` es literalmente `"No tengo datos para recomendar."`.

## Patrones aplicados

- **Facade** (`recommend-service.ts`): la función `recommendForProfile(profileId, query)` esconde la coordinación de cuatro servicios (scraper, budget repo, expense repo, Gemini SDK).
- **Adapter** (`recommend-service.ts`): convierte `ScrapedPrice` (modelo de BD) a `ProductoScrapeado` (modelo de payload para Gemini).
- **Strategy** indirecto (`gemini.ts`): tres funciones distintas según caso de uso (`obtenerRespuestaIA`, `analizarImagenIA`, `recomendarAhorro`).

## Grounding — cómo se garantiza

Tres capas defienden contra alucinaciones:

1. **Scope explícito en el prompt**: el system prompt de `recomendarAhorro` incluye literalmente la regla `"REGLA CRÍTICA: solo puedes hablar sobre los productos listados a continuación"`.
2. **Short-circuit cuando no hay datos**: si el cache-aside devuelve 0 productos, ni siquiera se invoca a Gemini — se retorna `"No tengo datos para recomendar."`.
3. **UI condicional**: el botón "Recomendar con IA" solo aparece cuando hay productos en pantalla. Esto evita que el usuario invoque el endpoint sin contexto.

## Verificación en demo

- Buscar `fanta` en `/ofertas` → aparecen productos → botón IA → recomendación coherente con la lista.
- Buscar `xyzabc` → "Sin resultados" → **no aparece botón IA**. Si se llama el endpoint directo con esa query → respuesta `source: "no-data"`.

## Variables de entorno requeridas

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | API Key de Google AI Studio (server-only) |
| `GEMINI_MODEL` | Opcional. Por defecto `gemini-2.5-flash` |
