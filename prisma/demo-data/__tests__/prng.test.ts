import { describe, it, expect } from "vitest";
import { mulberry32, randInt, pick, weightedIndex } from "@/../prisma/demo-data/prng";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });
  it("produces values in [0,1)", () => {
    const r = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("randInt", () => {
  it("stays within inclusive bounds", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const v = randInt(r, 3, 6);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("weightedIndex", () => {
  it("only returns indices with non-zero weight", () => {
    const r = mulberry32(9);
    for (let i = 0; i < 200; i++) {
      const idx = weightedIndex(r, [0, 5, 0, 2]);
      expect([1, 3]).toContain(idx);
    }
  });
});

describe("pick", () => {
  it("returns an element of the array", () => {
    const r = mulberry32(3);
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 50; i++) expect(arr).toContain(pick(r, arr));
  });
});
