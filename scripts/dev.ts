import {
  copyStaticAssets,
  ENTRYPOINTS,
  getStaticAssetsFingerprint,
  OUT_DIR,
  resetOutput,
} from "./build-utils.ts";

const bunExecutable = Bun.argv[0];
if (!bunExecutable) throw new Error("Unable to locate the Bun executable");

console.log("🔨 Starting dev build...");

await resetOutput();
await copyStaticAssets();

let staticAssetsFingerprint = await getStaticAssetsFingerprint();
let isCopyingStaticAssets = false;

async function syncStaticAssets(): Promise<void> {
  if (isCopyingStaticAssets) return;

  isCopyingStaticAssets = true;
  try {
    const nextFingerprint = await getStaticAssetsFingerprint();
    if (nextFingerprint === staticAssetsFingerprint) return;

    await copyStaticAssets();
    staticAssetsFingerprint = nextFingerprint;
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Static assets updated`);
  } catch (error) {
    console.error(
      `[${new Date().toLocaleTimeString()}] ❌ Static asset copy failed:`,
      error,
    );
  } finally {
    isCopyingStaticAssets = false;
  }
}

const builder = Bun.spawn({
  cmd: [
    bunExecutable,
    "build",
    ...ENTRYPOINTS,
    "--outdir",
    OUT_DIR,
    "--target",
    "browser",
    "--entry-naming",
    "[name].[ext]",
    "--watch",
  ],
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

const staticAssetsTimer = setInterval(() => {
  void syncStaticAssets();
}, 500);

console.log("👀 Watching TypeScript and static assets in src/...");

try {
  const exitCode = await builder.exited;
  if (exitCode !== 0) throw new Error(`Bun build watcher exited with code ${exitCode}`);
} finally {
  clearInterval(staticAssetsTimer);
}
