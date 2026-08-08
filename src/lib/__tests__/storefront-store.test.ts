import { describe, it, expect, vi, beforeEach } from "vitest";

const { findFirst } = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { store: { findFirst } } }));

import { resolveStorefrontStore } from "@/lib/storefront-store";

beforeEach(() => {
  findFirst.mockReset();
});

describe("resolveStorefrontStore", () => {
  it("returns the store whose customDomain matches the host", async () => {
    const store = { id: "s1", customDomain: "arabstories.shayma.me" };
    findFirst.mockResolvedValueOnce(store);

    const result = await resolveStorefrontStore("arabstories.shayma.me");

    expect(result).toEqual(store);
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst).toHaveBeenCalledWith({
      where: { customDomain: "arabstories.shayma.me" },
    });
  });

  it("falls back to the primary (earliest-created) store when no custom domain matches", async () => {
    const primaryStore = { id: "s1", customDomain: null };
    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(primaryStore);

    const result = await resolveStorefrontStore("localhost:3000");

    expect(result).toEqual(primaryStore);
    expect(findFirst).toHaveBeenCalledTimes(2);
    expect(findFirst).toHaveBeenNthCalledWith(1, {
      where: { customDomain: "localhost:3000" },
    });
    expect(findFirst).toHaveBeenNthCalledWith(2, {
      orderBy: { createdAt: "asc" },
    });
  });

  it("returns null when no stores exist at all", async () => {
    findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const result = await resolveStorefrontStore("nowhere.example.com");

    expect(result).toBeNull();
  });
});
