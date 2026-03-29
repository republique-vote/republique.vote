import { ImageResponse } from "next/og";
import { UrneOgSvg } from "@/components/og/urne-svg";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#000091",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px 128px",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: 80,
              fontWeight: 700,
              letterSpacing: "2px",
            }}
          >
            republique.vote
          </span>
        </div>
        <p
          style={{
            fontSize: 36,
            color: "#c3c3f5",
            lineHeight: 1.4,
            marginBottom: "48px",
          }}
        >
          Le vote, partout, pour tous. Par le peuple, pour le peuple.
        </p>

        <div style={{ display: "flex", gap: "48px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: "6px solid #8585f6",
              paddingLeft: "24px",
            }}
          >
            <span
              style={{
                fontSize: 26,
                color: "#8585f6",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Anonymat
            </span>
            <span style={{ fontSize: 24, color: "#c3c3f5" }}>
              Blind signatures RSA-PSS
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: "6px solid #8585f6",
              paddingLeft: "24px",
            }}
          >
            <span
              style={{
                fontSize: 26,
                color: "#8585f6",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Vérifiable
            </span>
            <span style={{ fontSize: 24, color: "#c3c3f5" }}>
              Merkle tree public
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: "6px solid #8585f6",
              paddingLeft: "24px",
            }}
          >
            <span
              style={{
                fontSize: 26,
                color: "#8585f6",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Transparent
            </span>
            <span style={{ fontSize: 24, color: "#c3c3f5" }}>
              Sigstore + GitHub
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: "6px solid #8585f6",
              paddingLeft: "24px",
            }}
          >
            <span
              style={{
                fontSize: 26,
                color: "#8585f6",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Open source
            </span>
            <span style={{ fontSize: 24, color: "#c3c3f5" }}>AGPL-3.0</span>
          </div>
        </div>
      </div>

      {/* Right: large urne */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingRight: "128px",
        }}
      >
        <UrneOgSvg height={320} width={280} />
      </div>
    </div>,
    { width: 2560, height: 640 }
  );
}
