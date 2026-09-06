// Accepts Prisma's Decimal (or anything else numeric-like) alongside plain
// number/string, since money fields come back as Decimal from the database.
export function formatMoney(
  amount: number | string | { toString(): string },
  currency: string = "GHS",
): string {
  const value = typeof amount === "number" ? amount : Number(amount.toString());
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
