import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireStore, storeUpdate } = vi.hoisted(() => ({
  requireStore: vi.fn(),
  storeUpdate: vi.fn(),
}));
vi.mock("@/lib/store-context", () => ({ requireStore }));
vi.mock("@/lib/prisma", () => ({ prisma: { store: { update: storeUpdate } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateBranding } from "@/actions/store";

const base = {
  name: "متجر مكياج",
  heroTitle: "",
  heroSubtitle: "",
  footerText: "",
  logoUrl: "",
  brandColor: "#aa3366",
  accentColor: "",
  goldColor: "",
};

beforeEach(() => {
  requireStore.mockReset();
  storeUpdate.mockReset();
  requireStore.mockResolvedValue({ id: "store-1", slug: "make-up" });
  storeUpdate.mockResolvedValue({});
});

describe("updateBranding", () => {
  it("stores trimmed values and nulls empty strings, scoped to the caller's store", async () => {
    const r = await updateBranding({ ...base, heroSubtitle: "  مرحبا  " });
    expect(r).toEqual({ ok: true });
    expect(storeUpdate).toHaveBeenCalledWith({
      where: { id: "store-1" },
      data: {
        name: "متجر مكياج",
        heroTitle: null,
        heroSubtitle: "مرحبا",
        footerText: null,
        logoUrl: null,
        brandColor: "#aa3366",
        accentColor: null,
        goldColor: null,
      },
    });
  });

  it("rejects an invalid non-empty color without writing", async () => {
    const r = await updateBranding({ ...base, accentColor: "blue" });
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });

  it("rejects an empty name", async () => {
    const r = await updateBranding({ ...base, name: "   " });
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });
});
