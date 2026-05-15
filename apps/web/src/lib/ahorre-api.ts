import { apiRequest } from "./api";

// ─── Finance ─────────────────────────────────────────────────────────────────

export const financeApi = {
  getBudgets: (token: string) => apiRequest<unknown[]>("finance", "/budgets", { token }),

  createBudget: (
    token: string,
    data: {
      name: string;
      amount: number;
      period: "WEEKLY" | "MONTHLY" | "YEARLY";
      startDate: string;
      categoryId?: string;
      endDate?: string;
    }
  ) => apiRequest<unknown>("finance", "/budgets", { method: "POST", body: data, token }),

  getTransactions: (token: string) =>
    apiRequest<unknown[]>("finance", "/transactions", { token }),

  createTransaction: (
    token: string,
    data: {
      amount: number;
      type: "INCOME" | "EXPENSE";
      categoryId?: string;
      budgetId?: string;
      description?: string;
      date?: string;
    }
  ) => apiRequest<unknown>("finance", "/transactions", { method: "POST", body: data, token }),

  getCategories: (token: string) => apiRequest<unknown[]>("finance", "/categories", { token }),

  createCategory: (
    token: string,
    data: { name: string; type: "INCOME" | "EXPENSE"; icon?: string; color?: string }
  ) => apiRequest<unknown>("finance", "/categories", { method: "POST", body: data, token }),
};

// ─── Offers ──────────────────────────────────────────────────────────────────

export const offersApi = {
  searchOffers: (token: string, query: string) =>
    apiRequest<unknown[]>("offers", `/offers/search?q=${encodeURIComponent(query)}`, { token }),

  getRecommendations: (token: string, data: { query: string; userContext?: string }) =>
    apiRequest<{ query: string; recommendation: string; offersCount: number }>(
      "offers",
      "/recommendations",
      { method: "POST", body: data, token }
    ),
};
