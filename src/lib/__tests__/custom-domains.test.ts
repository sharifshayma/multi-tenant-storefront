import { describe, it, expect } from "vitest";
import { customDomainSlug, storefrontRewritePath } from "@/lib/custom-domains";

describe("customDomainSlug", () => {
  it("maps the bookstore domain to its slug", () => {
    expect(customDomainSlug("shop.example.com")).toBe("my-store");
  });
  it("ignores port and case", () => {
    expect(customDomainSlug("SHOP.EXAMPLE.COM:443")).toBe("my-store");
  });
  it("returns null for the platform host", () => {
    expect(customDomainSlug("store.thatsmy.app")).toBeNull();
  });
});

describe("storefrontRewritePath", () => {
  const HOST = "shop.example.com";

  it("rewrites the bare root to the store slug", () => {
    expect(storefrontRewritePath(HOST, "/")).toBe("/my-store");
  });
  it("rewrites bare storefront routes under the slug", () => {
    expect(storefrontRewritePath(HOST, "/books/mo-salah")).toBe("/my-store/books/mo-salah");
    expect(storefrontRewritePath(HOST, "/collections/science")).toBe(
      "/my-store/collections/science",
    );
  });
  it("does NOT rewrite static public assets (they would 404 under the slug)", () => {
    expect(storefrontRewritePath(HOST, "/images/books/mo-salah/cover.jpg")).toBeNull();
    expect(storefrontRewritePath(HOST, "/file.svg")).toBeNull();
  });
  it("leaves admin/api/login/signup and metadata routes untouched", () => {
    expect(storefrontRewritePath(HOST, "/admin")).toBeNull();
    expect(storefrontRewritePath(HOST, "/api/foo")).toBeNull();
    expect(storefrontRewritePath(HOST, "/signup")).toBeNull();
    expect(storefrontRewritePath(HOST, "/robots.txt")).toBeNull();
  });
  it("returns null on non-custom-domain hosts", () => {
    expect(storefrontRewritePath("store.thatsmy.app", "/books/mo-salah")).toBeNull();
  });
});
