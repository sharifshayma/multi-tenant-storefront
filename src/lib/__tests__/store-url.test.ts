import { describe, it, expect } from "vitest";
import { platformStoreUrl, storefrontUrls } from "@/lib/store-url";

describe("store-url", () => {
  it("builds the platform URL from the default origin", () => {
    expect(platformStoreUrl("my-store")).toBe("https://store.thatsmy.app/my-store");
  });
  it("returns both platform and custom-domain URLs when a custom domain is set", () => {
    expect(storefrontUrls({ slug: "my-store", customDomain: "shop.example.com" })).toEqual({
      platform: "https://store.thatsmy.app/my-store",
      customDomain: "https://shop.example.com",
    });
  });
  it("returns null customDomain when the store has none", () => {
    expect(storefrontUrls({ slug: "janes-crafts", customDomain: null }).customDomain).toBeNull();
  });
});
