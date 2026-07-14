import { readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const FILES = [join(ROOT, "package.json"), join(ROOT, "src", "manifest.json")];

const VERSION_RE = /("version"\s*:\s*")([^"]+)(")/;

type BumpType = "patch" | "minor" | "major";
const BUMP_TYPES: readonly BumpType[] = ["patch", "minor", "major"] as const;

function readVersion(file: string): string {
  const content = readFileSync(file, "utf8");
  const match = content.match(VERSION_RE);
  if (!match?.[2]) {
    throw new Error(`No "version" field found in ${relative(ROOT, file)}`);
  }
  return match[2];
}

function bumpVersion(current: string, type: BumpType): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!match) {
    throw new Error(`Invalid semver "${current}" (expected major.minor.patch)`);
  }
  const major = Number.parseInt(match[1] ?? "0", 10);
  const minor = Number.parseInt(match[2] ?? "0", 10);
  const patch = Number.parseInt(match[3] ?? "0", 10);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

function main(): void {
  const type = process.argv[2] as BumpType;
  if (!BUMP_TYPES.includes(type)) {
    throw new Error(
      `Invalid bump type "${process.argv[2]}". Must be one of: ${BUMP_TYPES.join(", ")}`,
    );
  }

  const versions = new Set(FILES.map(readVersion));
  if (versions.size !== 1) {
    const list = FILES.map((f) => `${relative(ROOT, f)}=${readVersion(f)}`).join(", ");
    throw new Error(`Version mismatch across files: ${list}`);
  }

  const current = versions.values().next().value as string;
  const next = bumpVersion(current, type);
  if (next === current) {
    throw new Error(`Bump resulted in the same version (${current})`);
  }

  for (const file of FILES) {
    const content = readFileSync(file, "utf8");
    const updated = content.replace(VERSION_RE, `$1${next}$3`);
    if (updated === content) {
      throw new Error(`Failed to replace version in ${relative(ROOT, file)}`);
    }
    writeFileSync(file, updated);
    console.error(`  ✅ ${relative(ROOT, file)}: ${current} → ${next}`);
  }

  console.error(`\n🚀 Bumped ${type}: ${current} → ${next}`);
  console.log(next);
}

main();
