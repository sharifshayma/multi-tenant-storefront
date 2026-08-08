import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "secret123" }).success).toBe(true);
  });
  it("rejects a bad email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "secret123" }).success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts a valid email, password, and store name", () => {
    expect(
      signupSchema.safeParse({ email: "a@b.co", password: "secret123", storeName: "My Bookstore" })
        .success
    ).toBe(true);
  });
  it("rejects a bad email", () => {
    expect(
      signupSchema.safeParse({ email: "nope", password: "secret123", storeName: "My Bookstore" })
        .success
    ).toBe(false);
  });
  it("rejects a password shorter than 8 characters", () => {
    expect(
      signupSchema.safeParse({ email: "a@b.co", password: "short1", storeName: "My Bookstore" })
        .success
    ).toBe(false);
  });
  it("rejects an empty store name", () => {
    expect(
      signupSchema.safeParse({ email: "a@b.co", password: "secret123", storeName: "" }).success
    ).toBe(false);
  });
});
