import { describe, it, expect } from "vitest";
import { isHexColor } from "@/lib/hex-color";

describe("isHexColor", () => {
  it("accepts #rrggbb", () => {
    expect(isHexColor("#b5542c")).toBe(true);
    expect(isHexColor("#FFFFFF")).toBe(true);
  });
  it("rejects malformed values", () => {
    expect(isHexColor("b5542c")).toBe(false);   // no #
    expect(isHexColor("#fff")).toBe(false);       // shorthand
    expect(isHexColor("#b5542cff")).toBe(false);  // 8 digits
    expect(isHexColor("#zzzzzz")).toBe(false);    // non-hex
    expect(isHexColor("")).toBe(false);
  });
});
