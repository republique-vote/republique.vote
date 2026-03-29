import { ImageResponse } from "next/og";
import { UrneIconSvg } from "@/components/og/urne-svg";

export function GET() {
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
      <UrneIconSvg height={780} width={720} />
    </div>,
    { width: 1080, height: 1080 }
  );
}
