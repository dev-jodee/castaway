import { NextRequest, NextResponse } from "next/server";
import { generateFromIdl, Language, LANGUAGES } from "@/lib/codama-generate";
import { rateLimit, getIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_BYTES = 512 * 1024; // 512 KiB

export async function POST(req: NextRequest) {
  const { allowed, remaining, resetAt } = rateLimit(getIp(req), "generate");

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

  // Enforce body size before parsing to avoid memory pressure from huge payloads.
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json(
      { error: "Failed to read request body." },
      { status: 400 }
    );
  }

  if (bodyText.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Request body too large. IDL must be under 512 KiB." },
      { status: 413 }
    );
  }

  let body: { idl?: unknown; language?: string };
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { idl, language } = body;

  if (!idl || typeof idl !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid `idl` field" },
      { status: 400 }
    );
  }

  const validLanguages = LANGUAGES.map((l) => l.id);
  if (!language || !validLanguages.includes(language as Language)) {
    return NextResponse.json(
      {
        error: `Invalid language. Must be one of: ${validLanguages.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    const zipBuffer = await generateFromIdl(
      idl as Record<string, unknown>,
      language as Language
    );

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="generated-client.zip"`,
        "Content-Length": zipBuffer.length.toString(),
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
