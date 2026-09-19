export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-ZW", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}