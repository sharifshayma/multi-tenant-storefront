import { describe, it, expect } from "vitest";
import { buildStoreData } from "@/../scripts/adopt-store";

describe("buildStoreData", () => {
  it("returns the tenant #1 defaults", () => {
    expect(buildStoreData("owner_1")).toEqual({
      ownerId: "owner_1",
      slug: "shaymas-books",
      name: "Arab Roots, Global Wings",
      currency: "ILS",
      defaultLocale: "ar",
      customDomain: "arabstories.shayma.me",
    });
  });

  it("allows overriding every default", () => {
    expect(
      buildStoreData("owner_2", {
        slug: "My Custom Slug!",
        name: "Custom Store",
        currency: "USD",
        defaultLocale: "en",
        customDomain: "custom.example.com",
      }),
    ).toEqual({
      ownerId: "owner_2",
      slug: "my-custom-slug",
      name: "Custom Store",
      currency: "USD",
      defaultLocale: "en",
      customDomain: "custom.example.com",
    });
  });

  it("allows an explicit null customDomain override", () => {
    expect(buildStoreData("owner_3", { customDomain: null })).toEqual(
      expect.objectContaining({ customDomain: null }),
    );
  });
});
