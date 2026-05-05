import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { searchProducts } from "@/services/scraper/search-products";

/**
 * Endpoint del microservicio de scraping (RF2).
 * GET /api/scraper?q=<termino>
 *
 * Requiere sesión activa: solo usuarios autenticados pueden invocarlo
 * (alineado con RNF1 + RNF3). El cache-aside garantiza que no se golpee
 * la fuente externa más de lo necesario.
 */
export async function GET(request: NextRequest) {
  await requireUser();

  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json(
      { error: "Query debe tener al menos 2 caracteres" },
      { status: 400 },
    );
  }

  const result = await searchProducts(q);

  return NextResponse.json({
    source: result.source,
    count: result.products.length,
    products: result.products.map((p) => ({
      id: p.id,
      productName: p.productName,
      retailer: p.retailer,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      url: p.url,
      scrapedAt: p.scrapedAt.toISOString(),
    })),
  });
}
