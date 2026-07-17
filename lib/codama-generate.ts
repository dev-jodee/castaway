import { createFromRoot } from "codama";
import { rootNodeFromAnchor, type AnchorIdl } from "@codama/nodes-from-anchor";
import { renderVisitor as renderJs } from "@codama/renderers-js";
import { renderVisitor as renderJsUmi } from "@codama/renderers-js-umi";
import { renderVisitor as renderRust } from "@codama/renderers-rust";
import { renderVisitor as renderGo } from "@codama/renderers-go";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createRequire } from "module";
import type { Language } from "./codama-types";
import { assertLanguageSupportedForIdl } from "./codama-compat";
import { getCodamaRootNode, getIdlProgramName } from "./idl-utils";

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

  const programName = getIdlProgramName(idl);

  try {
    assertLanguageSupportedForIdl(idl, language);

    const codamaRoot = getCodamaRootNode(idl);
    const rootNode = codamaRoot
      ? (codamaRoot as unknown as Parameters<typeof createFromRoot>[0])
      : rootNodeFromAnchor(idl as AnchorIdl);
    const codama = createFromRoot(rootNode);

    switch (language) {
      case "typescript":
        await codama.accept(
          renderJs(tmpDir, {
            formatCode: false,
            deleteFolderBeforeRendering: false,
          })
        );
        break;
      case "typescript-umi":
        await codama.accept(
          renderJsUmi(tmpDir, {
            formatCode: false,
            deleteFolderBeforeRendering: false,
          })
        );
        break;
      case "rust": {
        const rustDir = path.join(tmpDir, `${programName}-rust-client`);
        fs.mkdirSync(rustDir, { recursive: true });
        codama.accept(
          renderRust(rustDir, {
            formatCode: false,
            deleteFolderBeforeRendering: false,
          })
        );
        break;
      }
      case "go": {
        const goDir = path.join(tmpDir, `${programName}-go-client`);
        fs.mkdirSync(goDir, { recursive: true });
        codama.accept(
          renderGo(goDir, {
            formatCode: false,
            deleteFolderBeforeRendering: false,
          })
        );
        break;
      }
      case "dart": {
        const dartDir = path.join(tmpDir, `${programName}-dart-client`);
        fs.mkdirSync(dartDir, { recursive: true });
        // codama-renderers-dart@0.4.x mispublishes its ESM entry (exports `import` -> a
        // .mjs absent from the tarball); load the working CJS build lazily here so a
        // resolution failure can't break the other renderers at module load time.
        const renderDart = createRequire(
          path.join(process.cwd(), "package.json")
        )("codama-renderers-dart")
          .renderVisitor as typeof import("codama-renderers-dart").renderVisitor;
        codama.accept(
          renderDart(dartDir, {
            formatCode: false,
            deleteFolderBeforeRendering: false,
          })
        );
        break;
      }
      default:
        throw new Error(`Unknown language: ${language}`);
    }

    const zip = new JSZip();
    collectFiles(zip, tmpDir, tmpDir);

    return await zip.generateAsync({ type: "nodebuffer" });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
