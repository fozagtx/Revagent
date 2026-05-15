import { mkdtemp, rm, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { spawn } from "node:child_process";

export interface ExtractedSlide {
  idx: number;
  imageBuffer: Buffer;
  imageMime: string;
  text: string;
}

export interface ExtractedDeck {
  slides: ExtractedSlide[];
  sourceFilename: string;
}

async function run(cmd: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "pipe" });
    let stderr = "";
    child.stderr.on("data", (c) => (stderr += c.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}: ${stderr.trim()}`));
    });
    child.on("error", reject);
  });
}

/**
 * Extract per-slide PNG images and text from a pitch deck.
 * Supports .pptx, .pdf, and remote URLs (downloads them first).
 *
 * Requires `libreoffice` and `pdftoppm` (poppler-utils) on the host.
 * Both are installed by the runtime stage of the Dockerfile.
 */
export async function extractDeck(args: {
  filename: string;
  buffer?: Buffer;
  url?: string;
}): Promise<ExtractedDeck> {
  const workdir = await mkdtemp(join(tmpdir(), "revagent-deck-"));
  try {
    let buffer = args.buffer;
    let filename = args.filename;
    if (!buffer && args.url) {
      const r = await fetch(args.url);
      if (!r.ok) throw new Error(`Failed to fetch slides URL: ${r.status}`);
      const arr = new Uint8Array(await r.arrayBuffer());
      buffer = Buffer.from(arr);
      const inferred = inferFilenameFromUrl(args.url);
      if (inferred) filename = inferred;
    }
    if (!buffer) throw new Error("Missing deck buffer or URL");

    const srcPath = join(workdir, filename);
    await writeFile(srcPath, buffer);

    const ext = extname(filename).toLowerCase();
    let pdfPath = srcPath;
    if (ext !== ".pdf") {
      try {
        await run("libreoffice", ["--headless", "--convert-to", "pdf", "--outdir", workdir, srcPath]);
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        if (m.includes("ENOENT") || m.toLowerCase().includes("not found")) {
          throw new Error("PPTX conversion requires LibreOffice on the server. Export the deck as PDF and re-upload, or install LibreOffice.");
        }
        throw err;
      }
      const pdfName = filename.replace(extname(filename), ".pdf");
      pdfPath = join(workdir, pdfName);
    }

    // PDF → per-page PNG.
    await run("pdftoppm", ["-png", "-r", "120", pdfPath, join(workdir, "slide")]);

    // Extract per-page text.
    const txtPath = join(workdir, "slides.txt");
    await run("pdftotext", ["-layout", pdfPath, txtPath]);
    const allText = await readFile(txtPath, "utf-8").catch(() => "");
    const pageTexts = allText.split("\f").map((s) => s.trim());

    const files = (await readdir(workdir))
      .filter((f) => f.startsWith("slide-") && f.endsWith(".png"))
      .sort((a, b) => extractPageIdx(a) - extractPageIdx(b));

    const slides: ExtractedSlide[] = [];
    for (let i = 0; i < files.length; i++) {
      const fname = files[i]!;
      const img = await readFile(join(workdir, fname));
      slides.push({
        idx: i,
        imageBuffer: img,
        imageMime: "image/png",
        text: pageTexts[i] ?? "",
      });
    }

    if (slides.length === 0) throw new Error("No slides extracted");
    return { slides, sourceFilename: filename };
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

function extractPageIdx(filename: string): number {
  const m = filename.match(/slide-(\d+)\.png$/);
  return m && m[1] ? parseInt(m[1], 10) : 0;
}

function inferFilenameFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop();
    if (last && last.includes(".")) return last;
    if (url.includes("docs.google.com/presentation")) return "slides.pdf";
    return null;
  } catch { return null; }
}
