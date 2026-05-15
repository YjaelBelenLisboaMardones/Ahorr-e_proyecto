import { describe, it, expect, vi, afterEach } from "vitest";
import { searchMercadoLibre } from "../services/scraper.service";

afterEach(() => {
  delete process.env["SCRAPER_MOCK"];
  vi.restoreAllMocks();
});

describe("searchMercadoLibre — modo mock", () => {
  it("retorna 5 ofertas cuando SCRAPER_MOCK=true", async () => {
    process.env["SCRAPER_MOCK"] = "true";
    const result = await searchMercadoLibre("laptop");
    expect(result).toHaveLength(5);
  });

  it("todas las ofertas mock tienen source dummyjson", async () => {
    process.env["SCRAPER_MOCK"] = "true";
    const result = await searchMercadoLibre("tv");
    result.forEach((offer) => expect(offer.source).toBe("dummyjson"));
  });

  it("las ofertas mock incluyen el término buscado en el nombre", async () => {
    process.env["SCRAPER_MOCK"] = "true";
    const result = await searchMercadoLibre("zapatillas");
    result.forEach((offer) =>
      expect(offer.name.toLowerCase()).toContain("zapatillas")
    );
  });

  it("todas las ofertas mock tienen precio positivo", async () => {
    process.env["SCRAPER_MOCK"] = "true";
    const result = await searchMercadoLibre("notebook");
    result.forEach((offer) => expect(offer.price).toBeGreaterThan(0));
  });
});

describe("searchMercadoLibre — conversión de precios", () => {
  it("convierte precio USD a CLP multiplicando por 950", async () => {
    process.env["SCRAPER_MOCK"] = "false";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [
            { id: 1, title: "Producto Test", price: 100, discountPercentage: 0, thumbnail: "", brand: "" },
          ],
        }),
      })
    );
    const result = await searchMercadoLibre("test");
    expect(result[0].price).toBe(95000);
  });

  it("calcula precio original correctamente cuando hay descuento", async () => {
    process.env["SCRAPER_MOCK"] = "false";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [
            { id: 1, title: "Auricular", price: 50, discountPercentage: 50, thumbnail: "", brand: "Brand" },
          ],
        }),
      })
    );
    const result = await searchMercadoLibre("auricular");
    expect(result[0].price).toBe(47500);
    expect(result[0].originalPrice).toBeGreaterThan(result[0].price);
  });

  it("combina brand y title en el nombre del producto", async () => {
    process.env["SCRAPER_MOCK"] = "false";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [
            { id: 1, title: "Galaxy S24", price: 10, discountPercentage: 0, thumbnail: "", brand: "Samsung" },
          ],
        }),
      })
    );
    const result = await searchMercadoLibre("samsung");
    expect(result[0].name).toBe("Samsung Galaxy S24");
  });
});

describe("searchMercadoLibre — manejo de errores", () => {
  it("retorna arreglo vacío si fetch lanza excepción", async () => {
    process.env["SCRAPER_MOCK"] = "false";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const result = await searchMercadoLibre("laptop");
    expect(result).toEqual([]);
  });

  it("retorna arreglo vacío si la API responde con status no-ok", async () => {
    process.env["SCRAPER_MOCK"] = "false";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );
    const result = await searchMercadoLibre("laptop");
    expect(result).toEqual([]);
  });
});
