import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FalabellaScraper } from "./falabella-scraper";

describe("FalabellaScraper — modo mock con whitelist", () => {
  const originalEnv = process.env.SCRAPER_MOCK;

  beforeEach(() => {
    process.env.SCRAPER_MOCK = "true";
  });

  afterEach(() => {
    process.env.SCRAPER_MOCK = originalEnv;
  });

  it("expone el retailer correctamente", () => {
    const scraper = new FalabellaScraper();
    expect(scraper.retailer).toBe("Falabella");
  });

  it("devuelve productos cuando el query matchea la whitelist (fanta)", async () => {
    const scraper = new FalabellaScraper();
    const productos = await scraper.scrape("fanta");
    expect(productos.length).toBeGreaterThan(0);
    productos.forEach((p) => {
      expect(p.retailer).toBe("Falabella");
      expect(p.price).toBeGreaterThan(0);
      expect(p.productName).toMatch(/Fanta/i);
    });
  });

  it("matchea aunque el usuario escriba más palabras (fanta naranja)", async () => {
    const scraper = new FalabellaScraper();
    const productos = await scraper.scrape("fanta naranja");
    expect(productos.length).toBeGreaterThan(0);
  });

  it("matchea por sinónimo: 'coca' devuelve productos Coca-Cola", async () => {
    const scraper = new FalabellaScraper();
    const productos = await scraper.scrape("coca");
    expect(productos.length).toBeGreaterThan(0);
    expect(productos[0].productName).toMatch(/Coca/i);
  });

  it("devuelve array vacío cuando el query no está en la whitelist", async () => {
    const scraper = new FalabellaScraper();
    const productos = await scraper.scrape("xyzabc");
    expect(productos).toEqual([]);
  });

  it("devuelve array vacío para queries absurdos (clave para grounding RF3)", async () => {
    const scraper = new FalabellaScraper();
    const queries = ["sasalska", "asdfgh", "1234567"];
    for (const q of queries) {
      const productos = await scraper.scrape(q);
      expect(productos, `query "${q}" no debería devolver productos`).toEqual([]);
    }
  });

  it("cada producto tiene SKU único en el batch", async () => {
    const scraper = new FalabellaScraper();
    const productos = await scraper.scrape("leche");
    const skus = productos.map((p) => p.productSku);
    const unique = new Set(skus);
    expect(unique.size).toBe(productos.length);
  });

  it("incluye originalPrice cuando el producto está en oferta", async () => {
    const scraper = new FalabellaScraper();
    const productos = await scraper.scrape("fanta");
    const enOferta = productos.filter((p) => p.originalPrice !== null);
    expect(enOferta.length).toBeGreaterThan(0);
    enOferta.forEach((p) => {
      expect(p.originalPrice!).toBeGreaterThan(p.price);
    });
  });
});
