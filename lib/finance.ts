export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface MoneyRecord {
  amount: number;
  status?: InvoiceStatus;
}

export function sumAmounts(records: MoneyRecord[]): number {
  return records.reduce((total, record) => {
    if (!Number.isFinite(record.amount) || record.amount < 0) {
      throw new Error("Amounts must be finite, non-negative numbers.");
    }
    return total + record.amount;
  }, 0);
}

export function calculateNetPosition(revenue: number, expenses: number): number {
  if (![revenue, expenses].every(value => Number.isFinite(value) && value >= 0)) {
    throw new Error("Revenue and expenses must be finite, non-negative numbers.");
  }
  return revenue - expenses;
}

export function outstandingInvoiceTotal(invoices: MoneyRecord[]): number {
  return sumAmounts(invoices.filter(invoice => invoice.status !== "paid" && invoice.status !== "cancelled"));
}
