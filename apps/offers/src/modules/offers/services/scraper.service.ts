export type ScrapedOffer = {
  name: string;
  price: number;
  originalPrice: number | undefined;
  discountPct: number | undefined;
  url: string;
  imageUrl: string | undefined;
  source: "dummyjson";
};

type DummyProduct = {
  id: number;
  title: string;
  price: number;
  discountPercentage: number;
  thumbnail: string;
  brand: string;
};

type DummyResponse = {
  products: DummyProduct[];
};

// 1 USD ≈ 950 CLP
const USD_TO_CLP = 950;

function getMockOffers(query: string): ScrapedOffer[] {
  const q = query.toLowerCase();
  return [
    {
      name: `Samsung Galaxy A15 5G 128GB — ${q}`,
      price: 219990,
      originalPrice: 289990,
      discountPct: 24,
      url: `https://www.google.com/search?q=Samsung+Galaxy+A15+5G&tbm=shop`,
      imageUrl: undefined,
      source: "dummyjson",
    },
    {
      name: `Smart TV LG 55" 4K UHD ThinQ AI — ${q}`,
      price: 429990,
      originalPrice: 579990,
      discountPct: 26,
      url: `https://www.google.com/search?q=Smart+TV+LG+55+4K&tbm=shop`,
      imageUrl: undefined,
      source: "dummyjson",
    },
    {
      name: `Notebook HP 15.6" Intel Core i5 512GB SSD — ${q}`,
      price: 499990,
      originalPrice: 649990,
      discountPct: 23,
      url: `https://www.google.com/search?q=Notebook+HP+15+i5&tbm=shop`,
      imageUrl: undefined,
      source: "dummyjson",
    },
    {
      name: `Auriculares Sony WH-1000XM5 Noise Cancelling — ${q}`,
      price: 259990,
      originalPrice: 399990,
      discountPct: 35,
      url: `https://www.google.com/search?q=Sony+WH-1000XM5&tbm=shop`,
      imageUrl: undefined,
      source: "dummyjson",
    },
    {
      name: `Aspiradora Inalámbrica Electrolux PowerPro — ${q}`,
      price: 89990,
      originalPrice: 129990,
      discountPct: 31,
      url: `https://www.google.com/search?q=Aspiradora+Electrolux+PowerPro&tbm=shop`,
      imageUrl: undefined,
      source: "dummyjson",
    },
  ];
}

export async function searchMercadoLibre(query: string): Promise<ScrapedOffer[]> {
  if (process.env["SCRAPER_MOCK"] === "true") {
    return getMockOffers(query);
  }

  // DummyJSON — API pública real, sin autenticación requerida
  const encoded = encodeURIComponent(query);
  const apiUrl = `https://dummyjson.com/products/search?q=${encoded}&limit=10`;

  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("[DummyJSON] error:", res.status);
      return [];
    }

    const json = (await res.json()) as DummyResponse;
    const products = json.products ?? [];

    return products.map((p) => {
      const priceClp = Math.round(p.price * USD_TO_CLP);
      const discountPct =
        p.discountPercentage > 0 ? Math.round(p.discountPercentage) : undefined;
      const originalPriceClp = discountPct
        ? Math.round(priceClp / (1 - discountPct / 100))
        : undefined;
      const name = p.brand ? `${p.brand} ${p.title}` : p.title;

      return {
        name,
        price: priceClp,
        originalPrice: originalPriceClp,
        discountPct,
        url: `https://www.google.com/search?q=${encodeURIComponent(name)}&tbm=shop`,
        imageUrl: p.thumbnail,
        source: "dummyjson" as const,
      };
    });
  } catch (err) {
    console.error("[DummyJSON] fetch error:", err);
    return [];
  }
}
