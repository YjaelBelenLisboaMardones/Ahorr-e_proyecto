import "server-only";

import { searchProducts } from "@/services/scraper/search-products";
import { listBudgetsByProfile } from "@/services/budget/budget-repository";
import { listExpensesByProfile } from "@/services/budget/expense-repository";
import { recomendarAhorro } from "./gemini";
import type {
  PayloadGrounding,
  ProductoScrapeado,
} from "@/types/scraper";

/**
 * Facade pattern: orquesta scraper + presupuesto + Gemini bajo una sola interfaz.
 * Cumple RF3 (grounding estricto) + RF6 (sugerencias proactivas usando presupuesto + caché).
 *
 * El payload que llega a Gemini se construye exclusivamente con:
 *  - Productos devueltos por el cache-aside (BD primero, scraper si miss).
 *  - Presupuesto restante calculado en BD del usuario.
 * Nunca pasamos al LLM datos genéricos ni del prompt — se mitiga alucinación.
 */

export type RecommendationResult = {
  query: string;
  productosUsados: number;
  presupuestoDisponible: number | null;
  recommendation: string;
  source: "cache" | "live" | "stale-fallback" | "no-data";
};

export async function recommendForProfile(
  profileId: string,
  query: string,
): Promise<RecommendationResult> {
  // 1) Datos del scraper (cache-aside)
  const search = await searchProducts(query);

  if (search.products.length === 0) {
    return {
      query,
      productosUsados: 0,
      presupuestoDisponible: null,
      recommendation: "No tengo datos para recomendar.",
      source: "no-data",
    };
  }

  // 2) Presupuesto disponible del usuario (suma de budgets - suma de expenses)
  const [budgets, expenses] = await Promise.all([
    listBudgetsByProfile(profileId),
    listExpensesByProfile(profileId),
  ]);
  const totalPresupuestado = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalGastado = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const disponible = totalPresupuestado - totalGastado;

  // 3) Adaptar al formato grounding (Adapter pattern)
  const productos: ProductoScrapeado[] = search.products.map((p) => ({
    productName: p.productName,
    retailer: p.retailer,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    url: p.url,
    scrapedAt: p.scrapedAt.toISOString(),
  }));

  const payload: PayloadGrounding = {
    productos,
    presupuestoDisponible: budgets.length > 0 ? disponible : undefined,
  };

  // 4) Grounding estricto: Gemini solo razona sobre el payload.
  const recommendation = await recomendarAhorro(payload);

  return {
    query,
    productosUsados: productos.length,
    presupuestoDisponible: budgets.length > 0 ? disponible : null,
    recommendation,
    source: search.source,
  };
}
