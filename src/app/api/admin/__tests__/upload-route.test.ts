import { describe, it, expect, vi, beforeEach } from "vitest";

const { getCurrentUser } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
}));

const { handleUpload } = vi.hoisted(() => ({
  handleUpload: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({ getCurrentUser }));
vi.mock("@vercel/blob/client", () => ({ handleUpload }));

import { POST } from "@/app/api/admin/upload/route";

beforeEach(() => {
  getCurrentUser.mockReset();
  handleUpload.mockReset();
});

describe("POST /api/admin/upload", () => {
  it("returns 401 and never calls handleUpload when there is no session", async () => {
    getCurrentUser.mockResolvedValue(null);

    const request = new Request("http://localhost/api/admin/upload", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(handleUpload).not.toHaveBeenCalled();
  });
});
