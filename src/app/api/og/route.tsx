import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { UrneOgSvg } from "@/components/og/urne-svg";
import { TYPE_LABELS } from "@/lib/metadata";

export const runtime = "edge";

const SIZE = { width: 1200, height: 630 };

const STATUS_LABELS: Record<string, string> = {
  open: "En cours",
  closed: "Terminé",
  tallied: "Dépouillé",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "republique.vote";
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const figtree = await fetch(
    "https://fonts.gstatic.com/s/figtree/v9/_Xmz-HUzqDCFdgfMsYiV_F7wfS-Bs_eYR15e.ttf"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#000091",
        color: "#ffffff",
        padding: "80px",
        fontFamily: "Figtree",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          {type && TYPE_LABELS[type] && (
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 700,
                padding: "6px 16px",
                borderRadius: "4px",
              }}
            >
              {TYPE_LABELS[type]}
            </div>
          )}
          {status && STATUS_LABELS[status] && (
            <div
              style={{
                backgroundColor:
                  status === "open"
                    ? "rgba(34, 197, 94, 0.2)"
                    : "rgba(59, 130, 246, 0.2)",
                color: status === "open" ? "#86efac" : "#93c5fd",
                fontSize: 18,
                fontWeight: 700,
                padding: "6px 16px",
                borderRadius: "4px",
              }}
            >
              {STATUS_LABELS[status]}
            </div>
          )}
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: title.length > 80 ? 32 : 42,
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: "950px",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {title}
        </p>
      </div>

      {/* Bottom row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              REPUBLIQUE
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              .VOTE
            </span>
          </div>
          <p style={{ fontSize: 14, color: "#8585f6" }}>
            Projet de recherche open source
          </p>
        </div>

        <UrneOgSvg height={88} width={80} />
      </div>
    </div>,
    {
      ...SIZE,
      fonts: [
        {
          name: "Figtree",
          data: figtree,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
