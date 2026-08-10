import { describe, it, expect, vi, beforeEach } from "vitest";
import { ar } from "@/i18n/dictionaries/ar";

const { signUpEmail, storeFindUnique, storeCreate, getCurrentUser, getCurrentStore } = vi.hoisted(
  () => ({
    signUpEmail: vi.fn(),
    storeFindUnique: vi.fn(),
    storeCreate: vi.fn(),
    getCurrentUser: vi.fn(),
    getCurrentStore: vi.fn(),
  })
);

vi.mock("@/lib/auth-server", () => ({ auth: { api: { signUpEmail } } }));
vi.mock("@/lib/prisma", () => ({
  prisma: { store: { findUnique: storeFindUnique, create: storeCreate } },
}));
vi.mock("@/lib/auth-guard", () => ({ getCurrentUser }));
vi.mock("@/lib/store-context", () => ({ getCurrentStore }));

import { signUpAndCreateStore } from "@/actions/signup";

beforeEach(() => {
  signUpEmail.mockReset();
  storeFindUnique.mockReset();
  storeCreate.mockReset();
  getCurrentUser.mockReset();
  getCurrentStore.mockReset();
  storeFindUnique.mockResolvedValue(null);
  // Default: no existing session, so tests exercise the fresh-signup path
  // unless they explicitly opt into the recovery path.
  getCurrentUser.mockResolvedValue(null);
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

    expect(result).toEqual({ ok: false, error: ar.errors.signup.emailTaken });
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

  it("returns ok:false instead of throwing when store creation fails after a successful signUpEmail", async () => {
    signUpEmail.mockResolvedValue({
      token: "tok",
      user: { id: "u3", email: "d@b.co", name: "My Bookstore" },
    });
    storeCreate.mockRejectedValue(new Error("unique constraint violation"));

    const result = await signUpAndCreateStore({
      email: "d@b.co",
      password: "secret123",
      storeName: "My Bookstore",
    });

    expect(result).toEqual({ ok: false, error: ar.errors.signup.storeCreationFailed });
  });

  it("recovers an authenticated, store-less session by creating the store without re-signing-up", async () => {
    getCurrentUser.mockResolvedValue({ id: "u4", email: "e@b.co", name: "My Bookstore" });
    getCurrentStore.mockResolvedValue(null);
    storeCreate.mockResolvedValue({ id: "s4", slug: "my-bookstore", name: "My Bookstore", ownerId: "u4" });

    const result = await signUpAndCreateStore({
      email: "e@b.co",
      password: "secret123",
      storeName: "My Bookstore",
    });

    expect(signUpEmail).not.toHaveBeenCalled();
    expect(storeCreate).toHaveBeenCalledWith({
      data: { slug: "my-bookstore", name: "My Bookstore", ownerId: "u4" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("refuses to create a second store for a user who already has one", async () => {
    getCurrentUser.mockResolvedValue({ id: "u5", email: "f@b.co", name: "My Bookstore" });
    getCurrentStore.mockResolvedValue({ id: "existing-store", ownerId: "u5" });

    const result = await signUpAndCreateStore({
      email: "f@b.co",
      password: "secret123",
      storeName: "My Bookstore",
    });

    expect(signUpEmail).not.toHaveBeenCalled();
    expect(storeCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: ar.errors.signup.alreadyHaveStore });
  });
});
