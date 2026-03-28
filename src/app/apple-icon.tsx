import { ImageResponse } from "next/og";

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
      <svg
        aria-label="Urne de vote"
        fill="none"
        height="130"
        role="img"
        viewBox="0 0 22 24"
        width="120"
      >
        {/* Bulletin (tilted rectangle coming from top) */}
        <rect
          fill="#ffffff"
          height="10"
          opacity="0.85"
          rx="0"
          transform="rotate(8, 11, 5)"
          width="6"
          x="8"
          y="0"
        />
        {/* Urne body */}
        <rect fill="#ffffff" height="14" rx="0" width="18" x="2" y="8" />
        {/* Fente */}
        <rect fill="#000091" height="2" rx="0" width="8" x="7" y="8" />
        {/* Shadow line */}
        <rect
          fill="#ffffff"
          height="2"
          opacity="0.5"
          rx="0"
          width="18"
          x="2"
          y="22"
        />
      </svg>
    </div>,
    { ...size }
  );
}
