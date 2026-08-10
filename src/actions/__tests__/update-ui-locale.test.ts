import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireStore, storeUpdate } = vi.hoisted(() => ({
  requireStore: vi.fn(),
  storeUpdate: vi.fn(),
}));
vi.mock("@/lib/store-context", () => ({ requireStore }));
vi.mock("@/lib/prisma", () => ({ prisma: { store: { update: storeUpdate } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateStoreUiLocale } from "@/actions/store";

beforeEach(() => {
  requireStore.mockReset();
  storeUpdate.mockReset();
  requireStore.mockResolvedValue({ id: "store-1" });
  storeUpdate.mockResolvedValue({});
});

describe("updateStoreUiLocale", () => {
  it("stores a valid locale", async () => {
    const r = await updateStoreUiLocale("en");
    expect(r).toEqual({ ok: true });
    expect(storeUpdate).toHaveBeenCalledWith({ where: { id: "store-1" }, data: { uiLocale: "en" } });
  });
  it("rejects an invalid locale without writing", async () => {
    const r = await updateStoreUiLocale("fr");
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });
});
