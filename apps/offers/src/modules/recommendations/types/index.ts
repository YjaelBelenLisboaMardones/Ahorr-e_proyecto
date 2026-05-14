export type RecommendationRequest = {
  query: string;
  userContext?: string;
};

export type RecommendationResponse = {
  query: string;
  recommendation: string;
  offersCount: number;
};
