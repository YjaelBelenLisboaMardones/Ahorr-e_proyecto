export type Transaction = {
  id: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  date: string;
  budgetId: string | null;
};

export function formatCLP(amount: string | number): string {
  return Number(amount).toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getBudgetSpent(transactions: Transaction[], budgetId: string): number {
  const now = new Date();
  return transactions
    .filter((t) => t.type === "EXPENSE" && t.budgetId === budgetId)
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + Number(t.amount), 0);
}
