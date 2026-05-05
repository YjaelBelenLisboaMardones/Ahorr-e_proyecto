/**
 * Helpers de formato compartidos en toda la app.
 */

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatCLP(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "$0";
  return CLP.format(n);
}

const FECHA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatFecha(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return FECHA.format(date);
}

/**
 * Convierte un Date a `YYYY-MM-DD` para inputs de tipo date.
 */
export function toDateInputValue(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
