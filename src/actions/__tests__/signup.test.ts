import { describe, it, expect, vi, beforeEach } from "vitest";

const { signUpEmail, storeFindUnique, storeCreate } = vi.hoisted(() => ({
  signUpEmail: vi.fn(),
  storeFindUnique: vi.fn(),
  storeCreate: vi.fn(),
}));

vi.mock("@/lib/auth-server", () => ({ auth: { api: { signUpEmail } } }));
vi.mock("@/lib/prisma", () => ({
  prisma: { store: { findUnique: storeFindUnique, create: storeCreate } },
}));

import { signUpAndCreateStore } from "@/actions/signup";

beforeEach(() => {
  signUpEmail.mockReset();
  storeFindUnique.mockReset();
  storeCreate.mockReset();
  storeFindUnique.mockResolvedValue(null);
});

describe("signUpAndCreateStore", () => {
  it("creates an account and a store owned by the new user", async () => {
    signUpEmail.mockResolvedValue({
      token: "tok",
      user: { id: "u1", email: "a@b.co", name: "My Bookstore" },
    });
    storeCreate.mockResolvedValue({ id: "s1", slug: "my-bookstore", name: "My Bookstore", ownerId: "u1" });

    const result = await signUpAndCreateStore({
      email: "a@b.co",
      password: "secret123",
      storeName: "My Bookstore",
    });

    expect(signUpEmail).toHaveBeenCalledWith({
      body: { email: "a@b.co", password: "secret123", name: "My Bookstore" },
    });
    expect(storeCreate).toHaveBeenCalledWith({
      data: { slug: "my-bookstore", name: "My Bookstore", ownerId: "u1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects invalid input without calling signUpEmail", async () => {
    const result = await signUpAndCreateStore({
      email: "not-an-email",
      password: "secret123",
      storeName: "My Bookstore",
    });

    expect(result.ok).toBe(false);
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it("maps an already-registered email to a friendly error", async () => {
    signUpEmail.mockRejectedValue(
      Object.assign(new Error("USER_ALREADY_EXISTS"), {
        status: "UNPROCESSABLE_ENTITY",
        body: { message: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
      })
    );

    const result = await signUpAndCreateStore({
      email: "taken@b.co",
      password: "secret123",
      storeName: "My Bookstore",
    });

    expect(result).toEqual({ ok: false, error: "هذا البريد الإلكتروني مستخدم بالفعل" });
    expect(storeCreate).not.toHaveBeenCalled();
  });

  it("derives a unique slug when the base slug is taken", async () => {
    signUpEmail.mockResolvedValue({
      token: "tok",
      user: { id: "u2", email: "c@b.co", name: "My Bookstore" },
    });
    storeFindUnique.mockResolvedValueOnce({ id: "existing" }).mockResolvedValueOnce(null);
    storeCreate.mockResolvedValue({ id: "s2", slug: "my-bookstore-2", name: "My Bookstore", ownerId: "u2" });

    const result = await signUpAndCreateStore({
      email: "c@b.co",
      password: "secret123",
      storeName: "My Bookstore",
    });

    expect(storeCreate).toHaveBeenCalledWith({
      data: { slug: "my-bookstore-2", name: "My Bookstore", ownerId: "u2" },
    });
    expect(result).toEqual({ ok: true });
  });
});
