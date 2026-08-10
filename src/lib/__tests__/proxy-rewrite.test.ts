import { describe, it, expect } from "vitest";
import { storefrontRewritePath } from "@/lib/custom-domains";

describe("storefrontRewritePath", () => {
  it("rewrites a bare custom-domain path to /{slug}/...", () => {
    expect(storefrontRewritePath("shop.example.com", "/books/x")).toBe("/my-store/books/x");
    expect(storefrontRewritePath("shop.example.com", "/")).toBe("/my-store");
  });
  it("does not rewrite admin/api paths on a custom domain", () => {
    expect(storefrontRewritePath("shop.example.com", "/admin/orders")).toBeNull();
    expect(storefrontRewritePath("shop.example.com", "/api/auth/x")).toBeNull();
  });
  it("does not rewrite on the platform host", () => {
    expect(storefrontRewritePath("store.thatsmy.app", "/janes-crafts")).toBeNull();
  });
  it("does not rewrite root metadata routes on a custom domain", () => {
    expect(storefrontRewritePath("shop.example.com", "/icon")).toBeNull();
    expect(storefrontRewritePath("shop.example.com", "/apple-icon")).toBeNull();
    expect(storefrontRewritePath("shop.example.com", "/opengraph-image")).toBeNull();
  });
});
