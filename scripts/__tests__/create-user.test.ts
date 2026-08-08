import { describe, it, expect } from "vitest";
import { parseArgs } from "@/../scripts/create-user";

describe("parseArgs", () => {
  it("parses email, password, and name", () => {
    expect(parseArgs(["a@b.co", "secret123", "Owner"])).toEqual({
      email: "a@b.co", password: "secret123", name: "Owner",
    });
  });

  it("throws when email or password is missing", () => {
    expect(() => parseArgs(["a@b.co"])).toThrow("Usage");
  });
});
