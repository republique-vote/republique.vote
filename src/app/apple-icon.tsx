import { ImageResponse } from "next/og";
import { UrneIconSvg } from "@/components/og/urne-svg";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000091",
      }}
    >
      <UrneIconSvg height={130} width={120} />
    </div>,
    { ...size }
  );
}
