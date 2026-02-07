import { NextResponse } from "next/server";
import { buildAuthUrl, createCodeChallenge, generateRandomString } from "@/lib/auth/openaiOAuth";
import { setOAuthHandshake, importCodexTokensIfNeeded } from "@/lib/auth/openaiAuthStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // First try to import existing Codex tokens from data/auth.json
  const imported = await importCodexTokensIfNeeded();
  if (imported?.accessToken) {
    return NextResponse.json({ 
      success: true, 
      connected: true,
      message: "Connected using existing Codex tokens" 
    });
  }

  // If no valid Codex tokens, try OAuth flow (requires proper client ID)
  const url = new URL(request.url);
  const origin = url.origin;
  const redirectUri = process.env.OPENAI_OAUTH_REDIRECT_URI || `${origin}/api/auth/openai/callback`;

  const state = generateRandomString(24);
  const codeVerifier = generateRandomString(48);
  const codeChallenge = createCodeChallenge(codeVerifier);

  await setOAuthHandshake(state, codeVerifier);

  const authUrl = buildAuthUrl({ state, codeChallenge, redirectUri, clientId: process.env.OPENAI_OAUTH_CLIENT_ID });

  return NextResponse.json({ url: authUrl });
}
