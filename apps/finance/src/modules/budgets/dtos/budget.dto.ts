export type BudgetDto = {
  id: string;
  userId: string;
  categoryId: string | null;
  name: string;
  amount: string;
  period: "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
