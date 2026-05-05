import "server-only";

import type { ScrapedPrice } from "@prisma/client";
import { FalabellaScraper } from "./falabella-scraper";
import {
  findFreshByQuery,
  findAnyByQuery,
  upsertBatch,
} from "./scraper-repository";
import type { Scraper } from "./types";

/**
 * Cache-aside pattern para RF2 + RNF6.
 *
 *  1. Lee de la BD local con TTL 24h. Si hay resultados frescos → los devuelve.
 *  2. Si no hay frescos, invoca al scraper (Strategy).
 *  3. Persiste el resultado y lo devuelve.
 *  4. Si el scraper falla y existían registros viejos, los devuelve igual
 *     (defensa en profundidad — RNF6: la app responde aunque la fuente externa caiga).
 */

const SCRAPERS: Scraper[] = [new FalabellaScraper()];

export type SearchResult = {
  source: "cache" | "live" | "stale-fallback";
  products: ScrapedPrice[];
};

export async function searchProducts(query: string): Promise<SearchResult> {
  const q = query.trim();
  if (q.length < 2) {
    return { source: "cache", products: [] };
  }

  // 1) Cache fresco
  const fresh = await findFreshByQuery(q);
  if (fresh.length > 0) {
    return { source: "cache", products: fresh };
  }

  // 2) Scrape live (paraleliza si hay múltiples scrapers)
  const scraped = (
    await Promise.all(SCRAPERS.map((s) => s.scrape(q).catch(() => [])))
  ).flat();

  if (scraped.length > 0) {
    await upsertBatch(scraped);
    const updated = await findFreshByQuery(q);
    return { source: "live", products: updated };
  }

  // 3) Fallback: caché viejo si existe (RNF6)
  const stale = await findAnyByQuery(q);
  return { source: "stale-fallback", products: stale };
}
