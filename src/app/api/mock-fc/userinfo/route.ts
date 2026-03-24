import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromToken } from "../store";
import { TEST_USERS } from "../test-users";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const user = TEST_USERS.find((u) => u.sub === userId);
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    sub: user.sub,
    given_name: user.given_name,
    family_name: user.family_name,
    preferred_username: user.preferred_username || undefined,
    birthdate: user.birthdate,
    birthplace: user.birthplace,
    birthcountry: user.birthcountry,
    gender: user.gender,
    email: user.email,
  });
}
