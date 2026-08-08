import { describe, it, expect } from "vitest";
import { customDomainSlug } from "@/lib/custom-domains";

describe("customDomainSlug", () => {
  it("maps the bookstore domain to its slug", () => {
    expect(customDomainSlug("arabstories.shayma.me")).toBe("shaymas-books");
  });
  it("ignores port and case", () => {
    expect(customDomainSlug("ARABSTORIES.shayma.me:443")).toBe("shaymas-books");
  });
  it("returns null for the platform host", () => {
    expect(customDomainSlug("store.thatsmy.app")).toBeNull();
  });
});
