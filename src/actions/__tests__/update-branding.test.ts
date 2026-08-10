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
  backgroundColor: "",
  textColor: "",
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
        backgroundColor: null,
        textColor: null,
      },
    });
  });

  it("rejects an invalid non-empty color without writing", async () => {
    const r = await updateBranding({ ...base, brandColor: "blue" });
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });

  it("rejects an invalid background/text color without writing", async () => {
    const bg = await updateBranding({ ...base, backgroundColor: "notacolor" });
    expect(bg.ok).toBe(false);
    const text = await updateBranding({ ...base, textColor: "#fff" });
    expect(text.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });

  it("stores valid background and text colors", async () => {
    const r = await updateBranding({ ...base, backgroundColor: "#101820", textColor: "#f5f5f5" });
    expect(r).toEqual({ ok: true });
    expect(storeUpdate).toHaveBeenCalledWith({
      where: { id: "store-1" },
      data: expect.objectContaining({ backgroundColor: "#101820", textColor: "#f5f5f5" }),
    });
  });

  it("rejects an empty name", async () => {
    const r = await updateBranding({ ...base, name: "   " });
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });

  it("rejects a non-blob logoUrl without writing", async () => {
    const r = await updateBranding({ ...base, logoUrl: "https://evil.com/x.png" });
    expect(r.ok).toBe(false);
    expect(storeUpdate).not.toHaveBeenCalled();
  });

  it("stores a valid Vercel-blob logoUrl", async () => {
    const r = await updateBranding({
      ...base,
      logoUrl: "https://abc.public.blob.vercel-storage.com/logo.png",
    });
    expect(r).toEqual({ ok: true });
    expect(storeUpdate).toHaveBeenCalledWith({
      where: { id: "store-1" },
      data: expect.objectContaining({
        logoUrl: "https://abc.public.blob.vercel-storage.com/logo.png",
      }),
    });
  });
});
