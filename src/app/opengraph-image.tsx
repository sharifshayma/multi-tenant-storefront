import { ImageResponse } from "next/og";
import { Ornament } from "@/components/brand/Ornament";
import { BRAND_PEACH, BRAND_NAVY } from "@/lib/brand";

export const alt = "جذور عربية، أجنحة عالمية — Arab Roots, Global Wings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_PEACH,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <span
            style={{
              fontSize: 84,
              fontWeight: 700,
              color: BRAND_NAVY,
              letterSpacing: 6,
            }}
          >
            ARAB
          </span>
          <Ornament size={80} color={BRAND_NAVY} />
          <span
            style={{
              fontSize: 84,
              fontWeight: 700,
              color: BRAND_NAVY,
              letterSpacing: 6,
            }}
          >
            ROOTS
          </span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 46,
            color: BRAND_NAVY,
            letterSpacing: 3,
          }}
        >
          global wings
        </div>
      </div>
    ),
    { ...size }
  );
}
