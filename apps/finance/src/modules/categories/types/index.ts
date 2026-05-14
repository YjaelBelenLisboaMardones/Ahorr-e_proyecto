export type CreateCategoryInput = {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon?: string;
  color?: string;
};
