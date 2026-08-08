import { describe, it, expect } from "vitest";
import { storefrontRewritePath } from "@/lib/custom-domains";

describe("storefrontRewritePath", () => {
  it("rewrites a bare custom-domain path to /{slug}/...", () => {
    expect(storefrontRewritePath("arabstories.shayma.me", "/books/x")).toBe("/shaymas-books/books/x");
    expect(storefrontRewritePath("arabstories.shayma.me", "/")).toBe("/shaymas-books");
  });
  it("does not rewrite admin/api paths on a custom domain", () => {
    expect(storefrontRewritePath("arabstories.shayma.me", "/admin/orders")).toBeNull();
    expect(storefrontRewritePath("arabstories.shayma.me", "/api/auth/x")).toBeNull();
  });
  it("does not rewrite on the platform host", () => {
    expect(storefrontRewritePath("store.thatsmy.app", "/janes-crafts")).toBeNull();
  });
});
