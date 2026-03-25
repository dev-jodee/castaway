import { NextRequest, NextResponse } from "next/server";
import { fetchIdl, DEFAULT_RPC_URL } from "@/lib/fetch-idl";
import { isIdlSource, type IdlSource } from "@/lib/idl-source";
import { rateLimit, getIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

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

  let body: { idlSource?: string; programId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { programId } = body;
  const idlSource: IdlSource =
    body.idlSource == null ? "auto" : body.idlSource;

  if (!programId || typeof programId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid `programId` field" },
      { status: 400 }
    );
  }

  if (!isIdlSource(idlSource)) {
    return NextResponse.json(
      { error: "Missing or invalid `idlSource` field" },
      { status: 400 }
    );
  }

  const resolvedRpcUrl = process.env.SOLANA_RPC_URL || DEFAULT_RPC_URL;

  try {
    const idl = await fetchIdl(programId.trim(), resolvedRpcUrl, idlSource);
    return NextResponse.json(
      { idl },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch IDL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
