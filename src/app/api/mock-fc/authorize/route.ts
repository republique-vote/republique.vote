import { NextRequest } from "next/server";
import { TEST_USERS } from "../test-users";
import { storeAuthCode } from "../store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get("redirect_uri") || "";
  const state = searchParams.get("state") || "";
  const nonce = searchParams.get("nonce") || "";

  const userCards = TEST_USERS.map(
    (user) => `
    <form method="POST" action="/api/mock-fc/authorize">
      <input type="hidden" name="redirect_uri" value="${redirectUri}">
      <input type="hidden" name="state" value="${state}">
      <input type="hidden" name="nonce" value="${nonce}">
      <input type="hidden" name="user_sub" value="${user.sub}">
      <button type="submit">
        <div class="user-card">
          <h3>${user.given_name} ${user.family_name}</h3>
          <p>${user.email} — ${user.gender === "female" ? "née" : "né(e)"} le ${user.birthdate.split("-").reverse().join("/")}</p>
          <p class="login">Login: <code>${user.login}</code> / Mot de passe: <code>${user.password}</code></p>
        </div>
      </button>
    </form>`,
  ).join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mock FranceConnect - Connexion</title>
  <style>
    body { font-family: 'Marianne', Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
    h1 { color: #000091; font-size: 1.5rem; }
    .banner { background: #f5f5fe; border-left: 4px solid #000091; padding: 12px; margin-bottom: 24px; font-size: 0.9rem; }
    .user-card { border: 1px solid #ddd; padding: 16px; margin: 8px 0; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
    .user-card:hover { background: #f0f0ff; border-color: #000091; }
    .user-card h3 { margin: 0 0 4px; }
    .user-card p { margin: 0; color: #666; font-size: 0.85rem; }
    .user-card .login { margin-top: 4px; color: #999; font-size: 0.8rem; }
    .user-card code { background: #eee; padding: 1px 4px; border-radius: 2px; }
    form { display: inline; }
    button { background: none; border: none; cursor: pointer; width: 100%; text-align: left; padding: 0; }
  </style>
</head>
<body>
  <h1>🔒 Mock FranceConnect</h1>
  <div class="banner">
    Simulateur FranceConnect pour le développement.<br>
    Données issues du <a href="https://github.com/france-connect/sources/blob/main/docker/volumes/fcp-low/mocks/idp/databases/citizen/base.csv">jeu de test officiel</a>.
  </div>
  <div>${userCards}</div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const redirectUri = formData.get("redirect_uri") as string;
  const state = formData.get("state") as string;
  const userSub = formData.get("user_sub") as string;

  const code = crypto.randomUUID();
  storeAuthCode(code, { userId: userSub, redirectUri });

  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  url.searchParams.set("state", state);

  return Response.redirect(url.toString(), 302);
}
