import { describe, it, expect } from "vitest";
import { minorToInput, inputToMinor } from "../money-input";

// Money is stored as integer minor units (×100 of the display currency),
// e.g. totalMinor 4000 = 40.00. These helpers convert at the admin form
// boundary: minorToInput for display, inputToMinor before hitting a server action.

describe("minorToInput", () => {
  it("converts whole-number minor units to a major-unit string", () => {
    expect(minorToInput(4000)).toBe("40");
  });

  it("converts fractional minor units to a major-unit string", () => {
    expect(minorToInput(4010)).toBe("40.1");
  });

  it("converts zero", () => {
    expect(minorToInput(0)).toBe("0");
  });
});

describe("inputToMinor", () => {
  it("converts a whole-number major-unit string to minor units", () => {
    expect(inputToMinor("40")).toBe(4000);
  });

  it("converts a two-decimal major-unit string to minor units", () => {
    expect(inputToMinor("40.50")).toBe(4050);
  });

  it("rounds instead of truncating (40.1 -> 4010, not 4009)", () => {
    expect(inputToMinor("40.1")).toBe(4010);
  });

  it("returns 0 for an empty string", () => {
    expect(inputToMinor("")).toBe(0);
  });

  it("returns 0 for a non-numeric string", () => {
    expect(inputToMinor("abc")).toBe(0);
  });

  it("round-trips with minorToInput", () => {
    expect(inputToMinor(minorToInput(4000))).toBe(4000);
  });
});
