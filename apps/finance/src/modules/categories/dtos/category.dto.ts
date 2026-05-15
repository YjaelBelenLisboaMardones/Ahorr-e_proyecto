export type CategoryDto = {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "INCOME" | "EXPENSE";
  createdAt: Date;
  updatedAt: Date;
};
