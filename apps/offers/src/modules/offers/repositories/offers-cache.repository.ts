import { prisma } from "@ahorre/database";
import type { ScrapedOffer } from "../services/scraper.service";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h (RF2)

export const offersCacheRepository = {
  async findFresh(query: string, source = "dummyjson") {
    const now = new Date();
    const cached = await prisma.offerCache.findFirst({
      where: { query, source, expiresAt: { gt: now } },
      orderBy: { fetchedAt: "desc" },
    });
    return cached;
  },

  async save(query: string, offers: ScrapedOffer[], source = "dummyjson") {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    return prisma.offerCache.create({
      data: {
        query,
        source,
        data: offers as unknown as Parameters<typeof prisma.offerCache.create>[0]["data"]["data"],
        expiresAt,
      },
    });
  },
};
