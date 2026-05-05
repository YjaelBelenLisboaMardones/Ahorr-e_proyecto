import "server-only";

import type { Scraper, ScrapedProduct } from "./types";

/**
 * Adapter pattern: traduce la respuesta cruda del endpoint público de Falabella
 * al formato interno `ScrapedProduct`. Si el endpoint cambia, solo se toca acá.
 *
 * Nota arquitectónica: el endpoint público no es un contrato oficial.
 * Si Falabella lo cambia, el scraper falla y la app sigue sirviendo desde caché
 * (RNF6 — fiabilidad). Se puede activar un mock determinístico con la env
 * `SCRAPER_MOCK=true` para garantizar la demo aunque la red falle.
 */

const FALABELLA_SEARCH_URL =
  "https://www.falabella.com/s/browse/api/products";

type FalabellaPrice = {
  price: string[] | string;
  type?: string;
};

type FalabellaItem = {
  displayName?: string;
  skuId?: string;
  url?: string;
  prices?: FalabellaPrice[];
  brand?: string;
};

type FalabellaResponse = {
  data?: {
    results?: FalabellaItem[];
  };
};

export class FalabellaScraper implements Scraper {
  readonly retailer = "Falabella";

  async scrape(query: string): Promise<ScrapedProduct[]> {
    if (process.env.SCRAPER_MOCK === "true") {
      return this.mock(query);
    }

    try {
      const url = `${FALABELLA_SEARCH_URL}?query=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; AhorrE-Scraper/1.0; academic project)",
          Accept: "application/json",
        },
        // Forzamos que Next no cachee aquí — nuestro cache vive en BD.
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn(`[FalabellaScraper] HTTP ${res.status} para "${query}"`);
        return [];
      }

      const data = (await res.json()) as FalabellaResponse;
      const items = data.data?.results ?? [];
      return items
        .map((item) => this.adapt(item))
        .filter((p): p is ScrapedProduct => p !== null);
    } catch (err) {
      console.error("[FalabellaScraper] error de red:", err);
      return [];
    }
  }

  private adapt(item: FalabellaItem): ScrapedProduct | null {
    if (!item.displayName || !item.prices || item.prices.length === 0) {
      return null;
    }

    const internetPrice = this.extractPrice(item.prices, "internetPrice");
    const normalPrice = this.extractPrice(item.prices, "normalPrice");
    const price = internetPrice ?? normalPrice;

    if (price === null) return null;

    return {
      productName: item.brand
        ? `${item.brand} — ${item.displayName}`
        : item.displayName,
      productSku: item.skuId ?? null,
      retailer: this.retailer,
      price,
      originalPrice: normalPrice && normalPrice !== price ? normalPrice : null,
      url: item.url
        ? item.url.startsWith("http")
          ? item.url
          : `https://www.falabella.com${item.url}`
        : "https://www.falabella.com",
    };
  }

  private extractPrice(prices: FalabellaPrice[], type: string): number | null {
    const entry = prices.find((p) => p.type === type);
    if (!entry) return null;
    const raw = Array.isArray(entry.price) ? entry.price[0] : entry.price;
    if (!raw) return null;
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  /**
   * Mock determinístico para demos sin red. Activable con `SCRAPER_MOCK=true`.
   * Devuelve resultados verosímiles que cambian según el query.
   */
  private mock(query: string): ScrapedProduct[] {
    const q = query.toLowerCase().trim();
    const seed = q.length;
    return [
      {
        productName: `${capitalize(q)} 1.5L (mock)`,
        productSku: `MOCK-${seed}-A`,
        retailer: this.retailer,
        price: 1490 + seed * 10,
        originalPrice: 1990 + seed * 10,
        url: `https://www.falabella.com/falabella-cl/search?Ntt=${encodeURIComponent(q)}`,
      },
      {
        productName: `${capitalize(q)} pack 6un (mock)`,
        productSku: `MOCK-${seed}-B`,
        retailer: this.retailer,
        price: 4990 + seed * 50,
        originalPrice: 6490 + seed * 50,
        url: `https://www.falabella.com/falabella-cl/search?Ntt=${encodeURIComponent(q)}`,
      },
      {
        productName: `${capitalize(q)} versión light (mock)`,
        productSku: `MOCK-${seed}-C`,
        retailer: this.retailer,
        price: 1290 + seed * 5,
        originalPrice: null,
        url: `https://www.falabella.com/falabella-cl/search?Ntt=${encodeURIComponent(q)}`,
      },
    ];
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
