import { describe, it, expect, vi, beforeEach } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({ Resend: vi.fn(() => ({ emails: { send } })) }));

beforeEach(() => {
  send.mockReset();
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("RESEND_FROM_EMAIL", "store@example.com");
});

describe("sendPasswordResetOtp", () => {
  it("sends the OTP to the given email with the code in the body", async () => {
    const { sendPasswordResetOtp } = await import("@/lib/resend");
    await sendPasswordResetOtp("owner@example.com", "123456");
    expect(send).toHaveBeenCalledTimes(1);
    const arg = send.mock.calls[0][0];
    expect(arg.to).toBe("owner@example.com");
    expect(arg.from).toBe("store@example.com");
    expect(arg.html).toContain("123456");
  });
});
