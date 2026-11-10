import { describe, expect, it } from "vitest";
import { calculateNetPosition, outstandingInvoiceTotal, sumAmounts } from "./finance";

describe("finance calculations", () => {
  it("sums valid amounts", () => {
    expect(sumAmounts([{ amount: 12.5 }, { amount: 7.5 }])).toBe(20);
  });

  it("rejects invalid amounts", () => {
    expect(() => sumAmounts([{ amount: -1 }])).toThrow();
    expect(() => sumAmounts([{ amount: Number.NaN }])).toThrow();
  });

  it("calculates net position", () => {
    expect(calculateNetPosition(1200, 350)).toBe(850);
  });

  it("excludes paid and cancelled invoices from outstanding totals", () => {
    expect(outstandingInvoiceTotal([
      { amount: 100, status: "sent" },
      { amount: 80, status: "overdue" },
      { amount: 50, status: "paid" },
      { amount: 20, status: "cancelled" }
    ])).toBe(180);
  });
});
