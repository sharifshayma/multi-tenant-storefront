import { describe, it, expect } from "vitest";
import { platformStoreUrl, storefrontUrls } from "@/lib/store-url";

describe("store-url", () => {
  it("builds the platform URL from the default origin", () => {
    expect(platformStoreUrl("shaymas-books")).toBe("https://store.thatsmy.app/shaymas-books");
  });
  it("returns both platform and custom-domain URLs when a custom domain is set", () => {
    expect(storefrontUrls({ slug: "shaymas-books", customDomain: "arabstories.shayma.me" })).toEqual({
      platform: "https://store.thatsmy.app/shaymas-books",
      customDomain: "https://arabstories.shayma.me",
    });
  });
  it("returns null customDomain when the store has none", () => {
    expect(storefrontUrls({ slug: "janes-crafts", customDomain: null }).customDomain).toBeNull();
  });
});
