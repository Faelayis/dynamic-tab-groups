import { $ } from "bun";

export const ROOT_URL = new URL("../", import.meta.url);
export const SRC_URL = new URL("src/", ROOT_URL);
export const OUT_URL = new URL("dist/", ROOT_URL);

export const SRC_DIR = Bun.fileURLToPath(SRC_URL);
export const OUT_DIR = Bun.fileURLToPath(OUT_URL);
export const ENTRYPOINTS = [
  Bun.fileURLToPath(new URL("background/background.ts", SRC_URL)),
  Bun.fileURLToPath(new URL("content/content.ts", SRC_URL)),
];

const STATIC_ASSET_GLOB = new Bun.Glob("icons/**/*");

async function getStaticAssetPaths(): Promise<string[]> {
  const paths = ["manifest.json"];

  for await (const path of STATIC_ASSET_GLOB.scan({ cwd: SRC_DIR, onlyFiles: true })) {
    paths.push(path.replaceAll("\\", "/"));
  }

  return paths.sort();
}

export async function resetOutput(): Promise<void> {
  await $`rm -rf ${OUT_DIR}`.quiet();
  await $`mkdir -p ${OUT_DIR}`.quiet();
}

export async function copyStaticAssets(): Promise<void> {
  const paths = await getStaticAssetPaths();

  for (const path of paths) {
    const source = new URL(path, SRC_URL);
    const destination = new URL(path, OUT_URL);
    const destinationDirectory = Bun.fileURLToPath(new URL("./", destination));

    await $`mkdir -p ${destinationDirectory}`.quiet();
    await Bun.write(destination, Bun.file(source));
  }
}

export async function getStaticAssetsFingerprint(): Promise<string> {
  const paths = await getStaticAssetPaths();
  const fingerprints: string[] = [];

  for (const path of paths) {
    const file = Bun.file(new URL(path, SRC_URL));
    const metadata = (await file.exists())
      ? `${file.size}:${file.lastModified}`
      : "missing";
    fingerprints.push(`${path}:${metadata}`);
  }

  return fingerprints.join("|");
}
