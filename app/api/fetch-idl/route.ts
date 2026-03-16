import { NextRequest, NextResponse } from "next/server";
import { fetchIdl, DEFAULT_RPC_URL } from "@/lib/fetch-idl";
import { rateLimit, getIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

// SSRF protection — block private/internal endpoints.
const PRIVATE_HOSTNAME = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // AWS/GCP metadata, link-local
  /^100\.6[4-9]\.\d+\.\d+$|^100\.[7-9]\d\.\d+\.\d+$|^100\.1[01]\d\.\d+\.\d+$|^100\.12[0-7]\.\d+\.\d+$/, // RFC 6598
  /^::1$/,
  /^0\.0\.0\.0$/,
  /^metadata\.google\.internal$/i,
];

function validateRpcUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid RPC URL.");
  }

  if (url.protocol !== "https:") {
    throw new Error("RPC URL must use HTTPS.");
  }

  for (const pattern of PRIVATE_HOSTNAME) {
    if (pattern.test(url.hostname)) {
      throw new Error("RPC URL must point to a public endpoint.");
    }
  }
}

export async function POST(req: NextRequest) {
  const { allowed, remaining, resetAt } = rateLimit(getIp(req), "fetch-idl");

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  let body: { programId?: string; rpcUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { programId, rpcUrl } = body;

  if (!programId || typeof programId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid `programId` field" },
      { status: 400 }
    );
  }

  // Validate user-supplied RPC URL against SSRF vectors before using it.
  const userRpc = rpcUrl?.trim();
  if (userRpc) {
    try {
      validateRpcUrl(userRpc);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid RPC URL." },
        { status: 400 }
      );
    }
  }

  // Priority: validated user URL → server env var (secret) → public default
  const resolvedRpcUrl =
    userRpc || process.env.SOLANA_RPC_URL || DEFAULT_RPC_URL;

  try {
    const idl = await fetchIdl(programId.trim(), resolvedRpcUrl);
    return NextResponse.json(
      { idl },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch IDL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
