import { describe, it, expect } from "vitest";
import { formatMoney } from "../format";

describe("formatMoney", () => {
  it("formats a number as GHS currency with no decimals", () => {
    expect(formatMoney(420, "GHS")).toBe("GH₵420");
  });

  it("accepts a Decimal-like string amount", () => {
    expect(formatMoney("780.00", "GHS")).toBe("GH₵780");
  });

  it("defaults to GHS when no currency is given", () => {
    expect(formatMoney(100)).toBe("GH₵100");
  });
});
