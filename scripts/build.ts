import { copyStaticAssets, ENTRYPOINTS, OUT_DIR, resetOutput } from "./build-utils.ts";

const start = performance.now();

console.log("🔨 Building Dynamic Tab Groups extension...\n");

await resetOutput();

const result = await Bun.build({
  entrypoints: ENTRYPOINTS,
  outdir: OUT_DIR,
  target: "browser",
  minify: true,
  naming: "[name].[ext]",
});

if (!result.success) {
  console.error("❌ Extension build failed:");
  for (const log of result.logs) console.error("  ", log);
  throw new Error("Extension build failed");
}

console.log("  ✅ background.js");
console.log("  ✅ content.js");

await copyStaticAssets();
console.log("  ✅ manifest.json");
console.log("  ✅ icons/");

const elapsed = (performance.now() - start).toFixed(0);
console.log(`\n🎉 Build complete in ${elapsed}ms → dist/`);
console.log("   Load this folder as an unpacked extension in chrome://extensions");
