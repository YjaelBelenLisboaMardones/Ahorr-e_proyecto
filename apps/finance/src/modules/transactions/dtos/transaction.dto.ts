export type TransactionDto = {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};
