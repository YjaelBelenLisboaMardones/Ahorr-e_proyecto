/**
 * Payload mínimo que produce el scraper y consume el motor de IA.
 * Es la "fuente de verdad" para grounding (RF3): la IA solo razona sobre estos datos.
 */
export interface ProductoScrapeado {
  productName: string;
  retailer: string;
  price: number; // CLP
  originalPrice?: number; // CLP — si aplica precio de lista
  url: string;
  scrapedAt: string; // ISO-8601
}

export interface PayloadGrounding {
  productos: ProductoScrapeado[];
  presupuestoDisponible?: number; // CLP — para RF6/RF7
}
