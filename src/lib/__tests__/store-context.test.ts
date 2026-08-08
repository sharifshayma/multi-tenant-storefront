import { describe, it, expect, vi, beforeEach } from "vitest";

const { getCurrentUser, findFirst } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ getCurrentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: { store: { findFirst } } }));

import { getCurrentStore, requireStore } from "@/lib/store-context";

beforeEach(() => { getCurrentUser.mockReset(); findFirst.mockReset(); });

describe("getCurrentStore", () => {
  it("returns null when no user", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect(await getCurrentStore()).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });
  it("returns the user's store", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co", name: "A" });
    findFirst.mockResolvedValue({ id: "s1", ownerId: "u1" });
    expect(await getCurrentStore()).toEqual({ id: "s1", ownerId: "u1" });
    expect(findFirst).toHaveBeenCalledWith({ where: { ownerId: "u1" } });
  });
});

describe("requireStore", () => {
  it("throws when there is no store", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.co", name: "A" });
    findFirst.mockResolvedValue(null);
    await expect(requireStore()).rejects.toThrow("No store");
  });
});
