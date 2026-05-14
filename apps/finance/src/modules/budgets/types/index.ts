export type CreateBudgetInput = {
  name: string;
  amount: number;
  categoryId?: string;
  period: "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate: string;
  endDate?: string;
};
