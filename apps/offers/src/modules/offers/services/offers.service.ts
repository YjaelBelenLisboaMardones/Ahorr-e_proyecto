import { offersCacheRepository } from "../repositories";
import { searchMercadoLibre } from "./scraper.service";
import type { ScrapedOffer } from "./scraper.service";

export const offersService = {
  async search(query: string): Promise<ScrapedOffer[]> {
    // RF2: cache-first, máximo 24h
    const cached = await offersCacheRepository.findFresh(query);
    if (cached) {
      return cached.data as unknown as ScrapedOffer[];
    }

    const offers = await searchMercadoLibre(query);
    if (offers.length > 0) {
      await offersCacheRepository.save(query, offers).catch(() => {});
    }
    return offers;
  },
};
