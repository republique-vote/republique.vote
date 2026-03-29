import { eq } from "drizzle-orm";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { UrneOgSvg } from "@/components/og/urne-svg";
import { db } from "@/db";
import { poll } from "@/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const sequence = searchParams.get("sequence") || "?";
  const hash = searchParams.get("hash") || "";
  const token = searchParams.get("token") || "";
  const date = searchParams.get("date") || "";

  const p = await db.query.poll.findFirst({ where: eq(poll.id, pollId) });

  if (!p) {
    return new Response("poll not found", { status: 404 });
  }

  const figtree = await fetch(
    "https://fonts.gstatic.com/s/figtree/v9/_Xmz-HUzqDCFdgfMsYiV_F7wfS-Bs_eYR15e.ttf"
  ).then((res) => res.arrayBuffer());

  const formattedDate = date
    ? new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#000091",
        color: "#ffffff",
        padding: "96px 128px",
        fontFamily: "Figtree",
        position: "relative",
      }}
    >
      {/* Header: logo + site name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          marginBottom: "64px",
        }}
      >
        <UrneOgSvg height={62} width={56} />
        <span
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          REPUBLIQUE.VOTE
        </span>
        <div
          style={{
            backgroundColor: "#fbbf24",
            color: "#000000",
            fontSize: 16,
            fontWeight: 700,
            padding: "5px 14px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginLeft: "8px",
          }}
        >
          POC
        </div>
      </div>

      {/* Center: vote proof */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <p style={{ fontSize: 30, color: "#c3c3f5", marginBottom: "12px" }}>
          {p.title}
        </p>
        <p
          style={{
            fontSize: 80,
            fontWeight: 700,
            marginBottom: "56px",
            lineHeight: 1.1,
          }}
        >
          Preuve de vote #{sequence}
        </p>

        {/* Info cards */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "20px 28px",
              backgroundColor: "rgba(255,255,255,0.08)",
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: "#8585f6",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Empreinte
            </span>
            <span
              style={{
                fontSize: 16,
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {hash}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "20px 28px",
              backgroundColor: "rgba(255,255,255,0.08)",
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: "#8585f6",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Code de vérification
            </span>
            <span
              style={{
                fontSize: 16,
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {token}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "20px 28px",
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: "#8585f6",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Date
            </span>
            <span style={{ fontSize: 22 }}>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{ fontSize: 18, color: "#8585f6", marginTop: "auto" }}>
        Conservez cette preuve. Elle permet de retrouver votre vote dans le
        registre public et de vérifier qu&apos;il n&apos;a pas été modifié. Elle
        ne révèle pas le contenu du vote.
      </p>
    </div>,
    {
      width: 1920,
      height: 1008,
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
