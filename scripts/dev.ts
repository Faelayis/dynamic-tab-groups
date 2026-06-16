import { watch } from "node:fs";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const OUT_DIR = join(ROOT, "dist");
const SRC_DIR = join(ROOT, "src");

let isBuilding = false;

async function build() {
  if (isBuilding) return;
  isBuilding = true;
  const start = performance.now();

  try {
    if (!existsSync(OUT_DIR)) {
      mkdirSync(OUT_DIR, { recursive: true });
    }

    const result = await Bun.build({
      entrypoints: [
        join(SRC_DIR, "background", "background.ts"),
        join(SRC_DIR, "content", "content.ts"),
      ],
      outdir: OUT_DIR,
      target: "browser",
      minify: false,
      naming: "[name].[ext]",
    });

    if (!result.success) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Build failed:`);
      for (const log of result.logs) console.error("  ", log);
    } else {
      cpSync(join(SRC_DIR, "manifest.json"), join(OUT_DIR, "manifest.json"));
      const elapsed = (performance.now() - start).toFixed(0);
      console.log(
        `[${new Date().toLocaleTimeString()}] ✅ Build complete in ${elapsed}ms`,
      );
    }
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Build error:`, error);
  } finally {
    isBuilding = false;
  }
}

console.log("🔨 Starting dev server...");
await build();

console.log(`👀 Watching for changes in src/...`);

watch(SRC_DIR, { recursive: true }, async (event, filename) => {
  if (filename) {
    await build();
  }
});
