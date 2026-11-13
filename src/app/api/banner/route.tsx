import { ImageResponse } from "next/og";
import { UrneOgSvg } from "@/components/og/urne-svg";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#5b2a91",
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
            color: "#d8c8f4",
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
              borderLeft: "6px solid #c9adf2",
              paddingLeft: "24px",
            }}
          >
            <span
              style={{
                fontSize: 26,
                color: "#c9adf2",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Anonymat
            </span>
            <span style={{ fontSize: 24, color: "#d8c8f4" }}>
              Blind signatures RSA-PSS
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: "6px solid #c9adf2",
              paddingLeft: "24px",
            }}
          >
            <span
              style={{
                fontSize: 26,
                color: "#c9adf2",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Vérifiable
            </span>
            <span style={{ fontSize: 24, color: "#d8c8f4" }}>
              Merkle tree public
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: "6px solid #c9adf2",
              paddingLeft: "24px",
            }}
          >
            <span
              style={{
                fontSize: 26,
                color: "#c9adf2",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Transparent
            </span>
            <span style={{ fontSize: 24, color: "#d8c8f4" }}>
              Sigstore + GitHub
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderLeft: "6px solid #c9adf2",
              paddingLeft: "24px",
            }}
          >
            <span
              style={{
                fontSize: 26,
                color: "#c9adf2",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Open source
            </span>
            <span style={{ fontSize: 24, color: "#d8c8f4" }}>AGPL-3.0</span>
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
