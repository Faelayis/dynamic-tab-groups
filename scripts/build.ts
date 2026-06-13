import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const OUT_DIR = join(ROOT, "dist");
const SRC_DIR = join(ROOT, "src");

async function build(): Promise<void> {
  const start = performance.now();

  if (existsSync(OUT_DIR)) {
    rmSync(OUT_DIR, { recursive: true, force: true });
  }
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("🔨 Building Dynamic Tab Groups extension...\n");

  const bgResult = await Bun.build({
    entrypoints: [
      join(SRC_DIR, "background", "background.ts"),
      join(SRC_DIR, "content", "content.ts")
    ],
    outdir: OUT_DIR,
    target: "browser",
    minify: true,
    naming: "[name].[ext]",
  });

  if (!bgResult.success) {
    console.error("❌ Background build failed:");
    for (const log of bgResult.logs) console.error("  ", log);
    process.exit(1);
  }
  console.log("  ✅ background.js");
  console.log("  ✅ content.js");

  cpSync(join(SRC_DIR, "manifest.json"), join(OUT_DIR, "manifest.json"));
  console.log("  ✅ manifest.json");

  const elapsed = (performance.now() - start).toFixed(0);
  console.log(`\n🎉 Build complete in ${elapsed}ms → dist/`);
  console.log("   Load this folder as an unpacked extension in chrome://extensions");
}

build();
