import { describe, it, expect } from "vitest";
import { loginSchema } from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "secret123" }).success).toBe(true);
  });
  it("rejects a bad email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "secret123" }).success).toBe(false);
  });
});
