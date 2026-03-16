import { createFromRoot } from "codama";
import { rootNodeFromAnchor, type AnchorIdl } from "@codama/nodes-from-anchor";
import { renderVisitor as renderJs } from "@codama/renderers-js";
import { renderVisitor as renderJsUmi } from "@codama/renderers-js-umi";
import { renderVisitor as renderRust } from "@codama/renderers-rust";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Language } from "./codama-types";

export type { Language } from "./codama-types";
export { LANGUAGES } from "./codama-types";

function collectFiles(zip: JSZip, dirPath: string, basePath: string): void {
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const relPath = path.relative(basePath, fullPath);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      collectFiles(zip, fullPath, basePath);
    } else {
      zip.file(relPath, fs.readFileSync(fullPath));
    }
  }
}

export async function generateFromIdl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  idl: Record<string, any>,
  language: Language
): Promise<Buffer> {
  const tmpDir = path.join("/tmp", `castaway-${randomUUID()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    const rootNode = rootNodeFromAnchor(idl as AnchorIdl);
    const codama = createFromRoot(rootNode);

    switch (language) {
      case "typescript":
        codama.accept(
          renderJs(tmpDir, {
            formatCode: false,
            deleteFolderBeforeRendering: false,
          })
        );
        break;
      case "typescript-umi":
        codama.accept(
          renderJsUmi(tmpDir, {
            formatCode: false,
            deleteFolderBeforeRendering: false,
          })
        );
        break;
      case "rust":
        codama.accept(
          renderRust(tmpDir, {
            formatCode: false,
            deleteFolderBeforeRendering: false,
          })
        );
        break;
      default:
        throw new Error(`Unknown language: ${language}`);
    }

    const zip = new JSZip();
    collectFiles(zip, tmpDir, tmpDir);

    return zip.generateAsync({ type: "nodebuffer" });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
