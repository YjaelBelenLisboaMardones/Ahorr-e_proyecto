export type CreateTransactionInput = {
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId?: string;
  budgetId?: string;
  description?: string;
  date?: string;
};
