import { ImageResponse } from "next/og";
import { Ornament } from "@/components/brand/Ornament";
import { BRAND_PEACH, BRAND_NAVY } from "@/lib/brand";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        <Ornament size={26} color={BRAND_NAVY} />
      </div>
    ),
    { ...size }
  );
}
