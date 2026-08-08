import { describe, it, expect, vi, beforeEach } from "vitest";
const findUnique = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { store: { findUnique } } }));
import { resolveStorefrontContext, storeHref } from "@/lib/storefront-context";

beforeEach(() => findUnique.mockReset());

describe("resolveStorefrontContext", () => {
  it("custom-domain host: basePath empty, store from the domain's slug", async () => {
    findUnique.mockResolvedValue({ id: "s1", slug: "shaymas-books" });
    const ctx = await resolveStorefrontContext({ slugParam: "shaymas-books", host: "arabstories.shayma.me" });
    expect(ctx).toEqual({ store: { id: "s1", slug: "shaymas-books" }, basePath: "" });
    expect(findUnique).toHaveBeenCalledWith({ where: { slug: "shaymas-books" } });
  });
  it("platform host: basePath is /{slug}", async () => {
    findUnique.mockResolvedValue({ id: "s2", slug: "janes-crafts" });
    const ctx = await resolveStorefrontContext({ slugParam: "janes-crafts", host: "store.thatsmy.app" });
    expect(ctx).toEqual({ store: { id: "s2", slug: "janes-crafts" }, basePath: "/janes-crafts" });
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
