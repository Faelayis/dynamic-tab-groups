import { $ } from "bun";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const versionType = process.argv[2];

if (!versionType || versionType === "none") {
  console.log("No version bump requested.");
  process.exit(0);
}

console.log(`Bumping version with bumpp: ${versionType}`);
const bumppResult =
  await $`bunx bumpp ${versionType} --yes --no-tag --no-commit --no-push`.nothrow();

if (bumppResult.exitCode !== 0) {
  console.error("Failed to bump version using bumpp:");
  console.error(bumppResult.stderr.toString());
  process.exit(1);
}

const packageJsonPath = resolve(process.cwd(), "package.json");
const pkgContent = readFileSync(packageJsonPath, "utf-8");
const pkg = JSON.parse(pkgContent);
const newVersion = pkg.version;

const manifestJsonPath = resolve(process.cwd(), "src/manifest.json");
const manifestContent = readFileSync(manifestJsonPath, "utf-8");
const manifest = JSON.parse(manifestContent);
manifest.version = newVersion;

writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
console.log(`Successfully synced version ${newVersion} to src/manifest.json`);

console.log("Formatting files with Biome to ensure consistent code format...");
await $`bunx biome format --write package.json src/manifest.json`.nothrow();

if (process.env.GITHUB_OUTPUT) {
  await $`echo "version=${newVersion}" >> ${process.env.GITHUB_OUTPUT}`;
}
