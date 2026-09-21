import { describe, expect, it } from "vitest";
import { parseDelimitedText } from "./parse-table";

describe("parseDelimitedText", () => {
  it("infers count, currency, percent, and ratio columns", () => {
    const input = [
      "Week,Signups,Revenue,Growth,ConversionRate",
      "1,1204,$4500,19.3%,2.5",
      "2,1436,$5200,25.0%,2.75",
    ].join("\n");

    const result = parseDelimitedText(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.table.columns).toEqual([
      { name: "Week", type: "count" },
      { name: "Signups", type: "count" },
      { name: "Revenue", type: "currency", currencySymbol: "$" },
      { name: "Growth", type: "percent" },
      { name: "ConversionRate", type: "ratio" },
    ]);

    expect(result.table.rows[0]).toEqual({
      Week: 1,
      Signups: 1204,
      Revenue: 4500,
      Growth: 0.193,
      ConversionRate: 2.5,
    });
    expect(result.table.rows[1].Signups).toBe(1436);
  });

  it("handles thousands separators", () => {
    const input = ["Metric,Value", "Total,1,204,500"].join("\n");
    const result = parseDelimitedText(input);
    // Note: comma is both the column delimiter and the thousands separator here,
    // so this specific ambiguous case is expected to misparse into extra columns.
    expect(result.ok).toBe(false);
  });

  it("parses thousands separators when using tab delimiter", () => {
    const input = ["Metric\tValue", "Total\t1,204,500"].join("\n");
    const result = parseDelimitedText(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.rows[0].Value).toBe(1204500);
  });

  it("infers unambiguous ISO dates", () => {
    const input = ["Date,Count", "2026-01-05,10", "2026-01-12,15"].join("\n");
    const result = parseDelimitedText(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.columns[0].type).toBe("date");
    expect(result.table.rows[0].Date).toBeInstanceOf(Date);
  });

  it("infers slash dates only when the convention is unambiguous across the column", () => {
    // Every value has a component > 12, so DD/MM is the only valid convention.
    const input = ["Date,Count", "25/01/2026,10", "13/02/2026,15"].join("\n");
    const result = parseDelimitedText(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.columns[0].type).toBe("date");
    const date = result.table.rows[0].Date as Date;
    expect(date.getUTCDate()).toBe(25);
    expect(date.getUTCMonth()).toBe(0); // January
  });

  it("falls back to string when slash-date convention is ambiguous", () => {
    // Every value has both components <= 12, so MDY vs DMY can't be determined.
    const input = ["Date,Count", "01/02/2026,10", "03/04/2026,15"].join("\n");
    const result = parseDelimitedText(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.columns[0].type).toBe("string");
  });

  it("fails loudly with a specific message when a numeric column has an inconsistent value", () => {
    const input = ["Metric,Value", "Signups,120", "Revenue,N/A"].join("\n");
    const result = parseDelimitedText(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain("Value");
    expect(result.error.message).toContain("N/A");
    expect(result.error.rowIndex).toBe(1);
  });

  it("treats a purely categorical column as string, not an error", () => {
    const input = ["Region,Count", "EMEA,10", "APAC,20"].join("\n");
    const result = parseDelimitedText(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.columns[0].type).toBe("string");
  });

  it("rejects rows with the wrong number of columns", () => {
    const input = ["A,B", "1,2", "3"].join("\n");
    const result = parseDelimitedText(input);
    expect(result.ok).toBe(false);
  });

  it("rejects a duplicate header", () => {
    const input = ["A,A", "1,2"].join("\n");
    const result = parseDelimitedText(input);
    expect(result.ok).toBe(false);
  });

  it("requires at least a header and one data row", () => {
    const result = parseDelimitedText("just,a,header");
    expect(result.ok).toBe(false);
  });

  it("supports quoted fields containing the delimiter", () => {
    const input = ['Name,Note', '"Acme, Inc.",120'].join("\n");
    const result = parseDelimitedText(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.rows[0].Name).toBe("Acme, Inc.");
  });
});

describe("parseDelimitedText currency symbols", () => {
  it("records the symbol the data used", () => {
    const result = parseDelimitedText(["Week,Revenue", "1,£4500", "2,£5200.50"].join("\n"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.columns[1]).toEqual({ name: "Revenue", type: "currency", currencySymbol: "£" });
  });

  it("reads the symbol through a leading minus sign", () => {
    const result = parseDelimitedText(["Week,Profit", "1,-£1200", "2,£300"].join("\n"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.columns[1].currencySymbol).toBe("£");
  });

  it("fails loudly, with the row, when a column mixes £ and $", () => {
    const result = parseDelimitedText(["Week,Revenue", "1,£4500", "2,$5200"].join("\n"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.columnName).toBe("Revenue");
    expect(result.error.rowIndex).toBe(1);
    expect(result.error.message).toContain("mixes currency symbols");
  });
});
