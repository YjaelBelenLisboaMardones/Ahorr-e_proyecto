/**
 * Strategy pattern: cualquier scraper de retailer debe implementar esta interface.
 * Hoy solo `FalabellaScraper`; mañana se puede plugar `JumboScraper`, etc.
 */
export interface Scraper {
  readonly retailer: string;
  scrape(query: string): Promise<ScrapedProduct[]>;
}

export interface ScrapedProduct {
  productName: string;
  productSku: string | null;
  retailer: string;
  price: number; // CLP
  originalPrice: number | null; // CLP — RF4: precio normal antes de oferta
  url: string;
}
