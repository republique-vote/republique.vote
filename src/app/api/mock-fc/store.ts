const authCodes = new Map<string, { userId: string; codeChallenge?: string; redirectUri: string }>();
const accessTokens = new Map<string, string>();

export function storeAuthCode(
  code: string,
  data: { userId: string; codeChallenge?: string; redirectUri: string },
) {
  authCodes.set(code, data);
  setTimeout(() => authCodes.delete(code), 5 * 60 * 1000);
}

export function consumeAuthCode(code: string) {
  const data = authCodes.get(code);
  authCodes.delete(code);
  return data;
}

export function storeAccessToken(token: string, userId: string) {
  accessTokens.set(token, userId);
  setTimeout(() => accessTokens.delete(token), 60 * 60 * 1000);
}

export function getUserIdFromToken(token: string) {
  return accessTokens.get(token);
}
