import { requireUser } from "@/app/lib/supabase/auth";
import { searchProducts } from "@/services/scraper/search-products";
import { formatCLP, formatFecha } from "@/app/lib/format";
import { SearchForm } from "./search-form";
import { RecommendButton } from "./recommend-button";

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const result = query.length >= 2 ? await searchProducts(query) : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
        Ofertas
      </h1>

      <SearchForm defaultQuery={query} />

      {result && (
        <SourceBadge source={result.source} count={result.products.length} />
      )}

      {result && result.products.length > 0 && <RecommendButton query={query} />}

      {!result && (
        <p className="rounded-2xl bg-white p-4 text-sm text-zinc-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-400">
          Busca un producto para comparar precios. Los resultados se almacenan
          hasta 24 h para no golpear las tiendas externas (RF2).
        </p>
      )}

      {result && result.products.length === 0 && (
        <p className="rounded-2xl bg-white p-4 text-sm text-zinc-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-400">
          Sin resultados para <strong>{query}</strong>. Intenta con otro término.
        </p>
      )}

      {result && result.products.length > 0 && (
        <ul className="flex flex-col gap-3">
          {result.products.map((p) => {
            const price = Number(p.price);
            const original = p.originalPrice ? Number(p.originalPrice) : null;
            const ahorro = original ? original - price : 0;
            return (
              <li key={p.id}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {p.productName}
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                      {formatCLP(price)}
                    </span>
                    {original && (
                      <span className="text-sm text-zinc-500 line-through dark:text-zinc-500">
                        {formatCLP(original)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {p.retailer} · {formatFecha(p.scrapedAt)}
                    </span>
                    {ahorro > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        Ahorras {formatCLP(ahorro)}
                      </span>
                    )}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SourceBadge({
  source,
  count,
}: {
  source: "cache" | "live" | "stale-fallback";
  count: number;
}) {
  const map = {
    cache: { label: "📦 Desde caché (≤24h)", tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
    live: { label: "🌐 Datos frescos", tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    "stale-fallback": { label: "⚠️ Caché expirada (fuente caída)", tone: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  } as const;
  const { label, tone } = map[source];
  return (
    <p className={`rounded-md px-3 py-1.5 text-xs ${tone}`}>
      {label} · {count} producto{count === 1 ? "" : "s"}
    </p>
  );
}
