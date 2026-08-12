import { describe, it, expect } from "vitest";
import { isVercelBlobUrl } from "@/lib/blob-url";

describe("isVercelBlobUrl", () => {
  it("accepts an https Vercel Blob public URL", () => {
    expect(
      isVercelBlobUrl("https://abc123.public.blob.vercel-storage.com/cover-x9.jpg"),
    ).toBe(true);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(
      isVercelBlobUrl("  https://abc.public.blob.vercel-storage.com/a.png  "),
    ).toBe(true);
  });

  it("rejects a static /images path (a seeded cover)", () => {
    expect(isVercelBlobUrl("/images/books/mo-salah/cover.jpg")).toBe(false);
  });

  it("rejects http (non-https) blob URLs", () => {
    expect(
      isVercelBlobUrl("http://abc.public.blob.vercel-storage.com/a.jpg"),
    ).toBe(false);
  });

  it("rejects an arbitrary other host", () => {
    expect(isVercelBlobUrl("https://evil.example.com/a.jpg")).toBe(false);
  });

  it("rejects empty / non-URL input", () => {
    expect(isVercelBlobUrl("")).toBe(false);
    expect(isVercelBlobUrl("not a url")).toBe(false);
  });
});
