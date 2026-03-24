import { NextRequest, NextResponse } from "next/server";
import { consumeAuthCode, storeAccessToken } from "../store";

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const code = body.get("code") as string;

  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  const authData = consumeAuthCode(code);
  if (!authData) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  const accessToken = crypto.randomUUID();
  storeAccessToken(accessToken, authData.userId);

  return NextResponse.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
  });
}
