export type OfferResultDto = {
  name: string;
  price: number;
  originalPrice: number | undefined;
  discountPct: number | undefined;
  url: string;
  imageUrl: string | undefined;
  source: string;
};
