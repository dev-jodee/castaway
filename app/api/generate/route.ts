import { NextRequest, NextResponse } from "next/server";
import { generateFromIdl, Language, LANGUAGES } from "@/lib/codama-generate";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: { idl?: unknown; language?: string };
  try {
    body = await req.json();
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
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
