const ROOT_URL = new URL("../", import.meta.url);
const FILES = [
  { label: "package.json", url: new URL("package.json", ROOT_URL) },
  { label: "src/manifest.json", url: new URL("src/manifest.json", ROOT_URL) },
] as const;

const VERSION_RE = /("version"\s*:\s*")([^"]+)(")/;

type BumpType = "patch" | "minor" | "major";
const BUMP_TYPES: readonly BumpType[] = ["patch", "minor", "major"];

function isBumpType(value: string | undefined): value is BumpType {
  return value !== undefined && BUMP_TYPES.some((type) => type === value);
}

function readVersion(content: string, label: string): string {
  const match = content.match(VERSION_RE);
  if (!match?.[2]) throw new Error(`No "version" field found in ${label}`);
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

const requestedType = Bun.argv[2];
if (!isBumpType(requestedType)) {
  throw new Error(
    `Invalid bump type "${requestedType}". Must be one of: ${BUMP_TYPES.join(", ")}`,
  );
}

const files = await Promise.all(
  FILES.map(async (file) => {
    const content = await Bun.file(file.url).text();
    return { ...file, content, version: readVersion(content, file.label) };
  }),
);
const versions = new Set(files.map((file) => file.version));

if (versions.size !== 1) {
  const list = files.map((file) => `${file.label}=${file.version}`).join(", ");
  throw new Error(`Version mismatch across files: ${list}`);
}

const current = versions.values().next().value;
if (!current) throw new Error("Unable to determine the current version");

const next = bumpVersion(current, requestedType);

for (const file of files) {
  const updated = file.content.replace(VERSION_RE, `$1${next}$3`);
  if (updated === file.content) {
    throw new Error(`Failed to replace version in ${file.label}`);
  }

  await Bun.write(file.url, updated);
  console.error(`  ✅ ${file.label}: ${current} → ${next}`);
}

console.error(`\n🚀 Bumped ${requestedType}: ${current} → ${next}`);
console.log(next);
