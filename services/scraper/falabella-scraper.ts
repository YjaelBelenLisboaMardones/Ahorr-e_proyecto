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
   *
   * Whitelist de productos reconocidos. Si la query no matchea ningún término
   * de la whitelist, devuelve []. Esto permite demostrar en vivo el RF3:
   * con una query absurda, el cache-aside no encuentra productos y la IA
   * responde "No tengo datos para recomendar" — comportamiento de grounding
   * estricto, que es lo que el informe técnico promete.
   */
  private mock(query: string): ScrapedProduct[] {
    const q = query.toLowerCase().trim();
    const matched = MOCK_WHITELIST.find((entry) =>
      entry.keywords.some((k) => q.includes(k)),
    );
    if (!matched) return [];

    const seed = q.length;
    return matched.products.map((p, i) => ({
      ...p,
      productSku: `MOCK-${matched.id}-${i}`,
      retailer: this.retailer,
      url: `https://www.falabella.com/falabella-cl/search?Ntt=${encodeURIComponent(q)}`,
      price: p.price + seed,
    }));
  }
}

type MockEntry = {
  id: string;
  keywords: string[];
  products: Array<Pick<ScrapedProduct, "productName" | "price" | "originalPrice">>;
};

const MOCK_WHITELIST: MockEntry[] = [
  {
    id: "fanta",
    keywords: ["fanta", "naranja"],
    products: [
      { productName: "Fanta Naranja 1.5L (mock)", price: 1490, originalPrice: 1990 },
      { productName: "Fanta Naranja pack 6un 350ml (mock)", price: 4290, originalPrice: 5790 },
      { productName: "Fanta Zero 1.5L (mock)", price: 1390, originalPrice: null },
    ],
  },
  {
    id: "coca",
    keywords: ["coca", "coca-cola", "cocacola", "bebida"],
    products: [
      { productName: "Coca-Cola 1.5L (mock)", price: 1690, originalPrice: 2190 },
      { productName: "Coca-Cola pack 6un 350ml (mock)", price: 4990, originalPrice: 6490 },
      { productName: "Coca-Cola Zero 2L (mock)", price: 2090, originalPrice: 2590 },
    ],
  },
  {
    id: "leche",
    keywords: ["leche", "soprole", "colun"],
    products: [
      { productName: "Leche Soprole entera 1L (mock)", price: 1190, originalPrice: 1490 },
      { productName: "Leche Colun descremada 1L (mock)", price: 1090, originalPrice: 1390 },
      { productName: "Leche Soprole pack 6un (mock)", price: 5990, originalPrice: 7490 },
    ],
  },
  {
    id: "pan",
    keywords: ["pan", "marraqueta", "hallulla"],
    products: [
      { productName: "Pan marraqueta 1kg (mock)", price: 2290, originalPrice: null },
      { productName: "Pan hallulla 1kg (mock)", price: 2490, originalPrice: 2990 },
      { productName: "Pan molde integral 500g (mock)", price: 1890, originalPrice: 2290 },
    ],
  },
  {
    id: "arroz",
    keywords: ["arroz", "tucapel"],
    products: [
      { productName: "Arroz Tucapel grado 1 1kg (mock)", price: 1590, originalPrice: 1990 },
      { productName: "Arroz integral 1kg (mock)", price: 1990, originalPrice: 2490 },
    ],
  },
];
