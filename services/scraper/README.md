# Microservicio de Scraping

Microservicio aislado que extrae precios de retailers externos (hoy: Falabella) y los sirve al resto del sistema desde un caché local con TTL 24h.

**Cumple:** RF2 (búsqueda actualizada) + RNF6 (fiabilidad ante caída de fuente externa).

## Estructura

```
services/scraper/
  types.ts                  # interface Scraper + tipo ScrapedProduct (Strategy)
  falabella-scraper.ts      # implementación: fetch + Adapter para Falabella
  scraper-repository.ts     # acceso a tabla scraped_prices con filtro TTL
  search-products.ts        # orquestador Cache-aside (BD primero, scraper si miss)
```

## Endpoint expuesto

`GET /api/scraper?q=<término>` — requiere sesión activa.

Respuesta:
```json
{
  "source": "cache" | "live" | "stale-fallback",
  "count": 3,
  "products": [
    {
      "id": "...",
      "productName": "Fanta Naranja 1.5L",
      "retailer": "Falabella",
      "price": 1490,
      "originalPrice": 1990,
      "url": "https://www.falabella.com/...",
      "scrapedAt": "2026-05-04T18:30:00.000Z"
    }
  ]
}
```

## Patrones aplicados

- **Strategy** (`types.ts`): la interface `Scraper` permite agregar nuevos retailers sin tocar el orquestador.
- **Adapter** (`falabella-scraper.ts` método `adapt`): traduce el JSON de Falabella al modelo interno `ScrapedProduct`.
- **Cache-aside** (`search-products.ts`):
  1. Lee de la BD con `scrapedAt > ahora − 24h`.
  2. Si miss/expirado → invoca al scraper, persiste, devuelve.
  3. Si scraper falla y hay datos viejos → los sirve igual (`stale-fallback`).

## Cómo extender con un nuevo retailer

```typescript
// services/scraper/jumbo-scraper.ts
export class JumboScraper implements Scraper {
  readonly retailer = "Jumbo";
  async scrape(query: string): Promise<ScrapedProduct[]> {
    // implementación
  }
}

// services/scraper/search-products.ts
const SCRAPERS: Scraper[] = [new FalabellaScraper(), new JumboScraper()];
```

Sin cambios en BD, UI ni endpoint.

## Modo mock para demos

Activar con `SCRAPER_MOCK=true` en `.env`. El mock responde con productos verosímiles a una whitelist de queries (fanta, coca, leche, pan, arroz). Cualquier query fuera de la whitelist devuelve `[]`, lo cual demuestra el comportamiento de grounding del microservicio de IA cuando no hay datos.
