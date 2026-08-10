import { describe, it, expect, vi, beforeEach } from "vitest";
const findUnique = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { store: { findUnique } } }));
import { resolveStorefrontContext, storeHref } from "@/lib/storefront-context";

beforeEach(() => findUnique.mockReset());

describe("resolveStorefrontContext", () => {
  it("custom-domain host: resolves the store by host, basePath empty", async () => {
    findUnique.mockResolvedValue({ id: "s1", slug: "my-store", customDomain: "shop.example.com" });
    const ctx = await resolveStorefrontContext({ slugParam: "anything", host: "shop.example.com" });
    expect(ctx).toEqual({
      store: { id: "s1", slug: "my-store", customDomain: "shop.example.com" },
      basePath: "",
    });
    expect(findUnique).toHaveBeenCalledWith({ where: { customDomain: "shop.example.com" } });
  });
  it("custom-domain host: still resolves after the store's slug changes", async () => {
    // slug is now "new-slug" but the host lookup does not depend on the slug
    findUnique.mockResolvedValue({ id: "s1", slug: "new-slug", customDomain: "shop.example.com" });
    const ctx = await resolveStorefrontContext({ slugParam: "my-store", host: "shop.example.com" });
    expect(ctx?.store.slug).toBe("new-slug");
    expect(ctx?.basePath).toBe("");
    expect(findUnique).toHaveBeenCalledWith({ where: { customDomain: "shop.example.com" } });
  });
  it("custom-domain host: normalizes port and case", async () => {
    findUnique.mockResolvedValue({ id: "s1", slug: "my-store", customDomain: "shop.example.com" });
    await resolveStorefrontContext({ slugParam: null, host: "SHOP.EXAMPLE.COM:443" });
    expect(findUnique).toHaveBeenCalledWith({ where: { customDomain: "shop.example.com" } });
  });
  it("platform host: basePath is /{slug}, resolved by slug", async () => {
    findUnique.mockResolvedValue({ id: "s2", slug: "janes-crafts", customDomain: null });
    const ctx = await resolveStorefrontContext({ slugParam: "janes-crafts", host: "store.thatsmy.app" });
    expect(ctx).toEqual({
      store: { id: "s2", slug: "janes-crafts", customDomain: null },
      basePath: "/janes-crafts",
    });
    expect(findUnique).toHaveBeenCalledWith({ where: { slug: "janes-crafts" } });
  });
  it("returns null when the store slug does not exist", async () => {
    findUnique.mockResolvedValue(null);
    expect(await resolveStorefrontContext({ slugParam: "nope", host: "store.thatsmy.app" })).toBeNull();
  });
});

describe("storeHref", () => {
  it("joins basePath and path", () => {
    expect(storeHref("/janes-crafts", "/cart")).toBe("/janes-crafts/cart");
    expect(storeHref("", "/cart")).toBe("/cart");
  });
});
