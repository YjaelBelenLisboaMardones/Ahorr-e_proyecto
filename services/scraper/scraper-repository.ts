import "server-only";

import { prisma } from "@/app/lib/prisma";
import type { ScrapedPrice } from "@prisma/client";
import type { ScrapedProduct } from "./types";

/**
 * Repository para `scraped_prices`. Aplica la regla de TTL del RF2:
 * los registros con `scrapedAt` > 24h se consideran expirados.
 */

const TTL_MS = 24 * 60 * 60 * 1000;

export async function findFreshByQuery(query: string): Promise<ScrapedPrice[]> {
  const cutoff = new Date(Date.now() - TTL_MS);
  return prisma.scrapedPrice.findMany({
    where: {
      productName: { contains: query, mode: "insensitive" },
      scrapedAt: { gte: cutoff },
    },
    orderBy: { price: "asc" },
  });
}

export async function findAnyByQuery(query: string): Promise<ScrapedPrice[]> {
  return prisma.scrapedPrice.findMany({
    where: {
      productName: { contains: query, mode: "insensitive" },
    },
    orderBy: { price: "asc" },
    take: 30,
  });
}

/**
 * Reemplaza los registros previos del mismo retailer para los SKUs que llegan
 * en el batch nuevo, e inserta los nuevos. Mantiene el caché actualizado sin
 * crecer indefinidamente.
 */
export async function upsertBatch(products: ScrapedProduct[]): Promise<void> {
  if (products.length === 0) return;

  const skus = products.map((p) => p.productSku).filter((s): s is string => !!s);

  await prisma.$transaction([
    skus.length > 0
      ? prisma.scrapedPrice.deleteMany({
          where: {
            retailer: products[0].retailer,
            productSku: { in: skus },
          },
        })
      : prisma.scrapedPrice.deleteMany({ where: { id: "__never__" } }),
    prisma.scrapedPrice.createMany({
      data: products.map((p) => ({
        productName: p.productName,
        productSku: p.productSku,
        retailer: p.retailer,
        price: p.price,
        originalPrice: p.originalPrice,
        url: p.url,
      })),
    }),
  ]);
}
