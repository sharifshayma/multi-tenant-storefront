import { describe, it, expect } from "vitest";
import { auth } from "@/lib/auth-server";

describe("auth-server", () => {
  it("exposes a handler and api", () => {
    expect(typeof auth.handler).toBe("function");
    expect(auth.api).toBeDefined();
    expect(typeof auth.api.getSession).toBe("function");
  });
});
