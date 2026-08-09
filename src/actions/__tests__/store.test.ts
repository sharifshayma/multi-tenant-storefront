import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireStore, storeFindUnique, storeUpdate } = vi.hoisted(() => ({
  requireStore: vi.fn(),
  storeFindUnique: vi.fn(),
  storeUpdate: vi.fn(),
}));
vi.mock("@/lib/store-context", () => ({ requireStore }));
vi.mock("@/lib/prisma", () => ({
  prisma: { store: { findUnique: storeFindUnique, update: storeUpdate } },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateStoreSlug } from "@/actions/store";

beforeEach(() => {
  requireStore.mockReset();
  storeFindUnique.mockReset();
  storeUpdate.mockReset();
  requireStore.mockResolvedValue({ id: "s1", slug: "shaymas-books" });
  storeFindUnique.mockResolvedValue(null);
});

describe("updateStoreSlug", () => {
  it("updates to a valid, unused slug", async () => {
    const r = await updateStoreSlug("Shaymas Store");
    expect(r).toEqual({ ok: true, slug: "shaymas-store" });
    expect(storeUpdate).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { slug: "shaymas-store" },
    });
  });
  it("rejects a reserved slug without touching the DB", async () => {
    const r = await updateStoreSlug("admin");
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });
  it("rejects a slug already taken by another store", async () => {
    storeFindUnique.mockResolvedValue({ id: "other", slug: "taken" });
    const r = await updateStoreSlug("taken");
    expect(r).toEqual({ ok: false, error: "هذا العنوان مستخدم من متجر آخر" });
    expect(storeUpdate).not.toHaveBeenCalled();
  });
  it("is a no-op success when the slug is unchanged", async () => {
    const r = await updateStoreSlug("shaymas-books");
    expect(r).toEqual({ ok: true, slug: "shaymas-books" });
    expect(storeUpdate).not.toHaveBeenCalled();
  });
});
