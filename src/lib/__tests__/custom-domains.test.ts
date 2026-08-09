import { describe, it, expect } from "vitest";
import { customDomainSlug, storefrontRewritePath } from "@/lib/custom-domains";

describe("customDomainSlug", () => {
  it("maps the bookstore domain to its slug", () => {
    expect(customDomainSlug("arabstories.shayma.me")).toBe("shaymas-books");
  });
  it("ignores port and case", () => {
    expect(customDomainSlug("ARABSTORIES.shayma.me:443")).toBe("shaymas-books");
  });
  it("returns null for the platform host", () => {
    expect(customDomainSlug("store.thatsmy.app")).toBeNull();
  });
});

describe("storefrontRewritePath", () => {
  const HOST = "arabstories.shayma.me";

  it("rewrites the bare root to the store slug", () => {
    expect(storefrontRewritePath(HOST, "/")).toBe("/shaymas-books");
  });
  it("rewrites bare storefront routes under the slug", () => {
    expect(storefrontRewritePath(HOST, "/books/mo-salah")).toBe("/shaymas-books/books/mo-salah");
    expect(storefrontRewritePath(HOST, "/collections/science")).toBe(
      "/shaymas-books/collections/science",
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
