import { describe, it, expect } from "vitest";
import { storeNoun } from "@/lib/store-noun";

describe("storeNoun", () => {
  it("returns the store's singular/plural item nouns", () => {
    expect(storeNoun({ itemNounSingular: "كتاب", itemNounPlural: "كتب" })).toEqual({
      singular: "كتاب",
      plural: "كتب",
    });
  });

  it("returns the default product noun for a store without a custom noun", () => {
    expect(storeNoun({ itemNounSingular: "منتج", itemNounPlural: "منتجات" })).toEqual({
      singular: "منتج",
      plural: "منتجات",
    });
  });
});
