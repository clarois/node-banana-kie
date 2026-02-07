import { NextResponse } from "next/server";
import { importCodexTokensIfNeeded } from "@/lib/auth/openaiAuthStore";

export const dynamic = "force-dynamic";

export async function GET() {
  // Import existing Codex tokens from data/auth.json
  const imported = await importCodexTokensIfNeeded();
  
  if (imported?.accessToken) {
    return NextResponse.json({ 
      success: true, 
      connected: true,
      message: "Connected using existing Codex tokens" 
    });
  }

  return NextResponse.json({ 
    success: false, 
    connected: false,
    message: "No valid Codex tokens found. Please run 'opencode auth login' first to authenticate." 
  }, { status: 400 });
}
