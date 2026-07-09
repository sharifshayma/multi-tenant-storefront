import { ImageResponse } from "next/og";
import { Ornament } from "@/components/brand/Ornament";
import { BRAND_PEACH, BRAND_NAVY } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_PEACH,
        }}
      >
        <Ornament size={130} color={BRAND_NAVY} />
      </div>
    ),
    { ...size }
  );
}
