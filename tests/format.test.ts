import { describe, expect, it } from "vitest";
import { formatGen, parseGen, shortAddress, STATUS_LABELS } from "@/lib/format";

describe("financial and status formatting", () => {
  it("round-trips whole and fractional GEN", () => {
    expect(parseGen("12.5001")).toBe(12_500_100_000_000_000_000n);
    expect(formatGen(parseGen("12.5001"))).toBe("12.5001 GEN");
  });
  it("rejects invalid precision and zero", () => {
    expect(() => parseGen("0")).toThrow(/greater than zero/);
    expect(() => parseGen("1.0000000000000000001")).toThrow(/valid GEN/);
  });
  it("uses contract-aligned status labels", () => {
    expect(STATUS_LABELS[0]).toBe("FUNDED");
    expect(STATUS_LABELS[5]).toBe("AWARDED");
    expect(shortAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
  });
});
