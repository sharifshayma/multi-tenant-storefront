import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth-server", () => ({ auth: { api: { getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { getCurrentUser, requireUser } from "@/lib/auth-guard";

beforeEach(() => getSession.mockReset());

describe("getCurrentUser", () => {
  it("returns the user when a session exists", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", email: "a@b.co", name: "A" } });
    expect(await getCurrentUser()).toEqual({ id: "u1", email: "a@b.co", name: "A" });
  });

  it("returns null when there is no session", async () => {
    getSession.mockResolvedValue(null);
    expect(await getCurrentUser()).toBeNull();
  });
});

describe("requireUser", () => {
  it("throws Unauthorized when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("Unauthorized");
  });

  it("returns the user when signed in", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", email: "a@b.co", name: "A" } });
    expect(await requireUser()).toEqual({ id: "u1", email: "a@b.co", name: "A" });
  });
});
