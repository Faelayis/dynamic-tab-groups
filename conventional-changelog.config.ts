import createPreset, {
  type ChangelogTransform,
  DEFAULT_COMMIT_TYPES,
} from "conventional-changelog-conventionalcommits";

interface GitHubCommit {
  author: { login: string } | null;
  sha: string;
}

function runGit(...args: string[]): string {
  const result = Bun.spawnSync(["git", ...args]);
  if (!result.success) {
    throw new Error(result.stderr.toString().trim() || `git ${args.join(" ")} failed`);
  }

  return result.stdout.toString().trim();
}

function getRepository(): string | undefined {
  if (Bun.env.GITHUB_REPOSITORY) return Bun.env.GITHUB_REPOSITORY;

  const remote = runGit("remote", "get-url", "origin");
  return remote.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/i)?.[1];
}

async function getGithubAuthors(): Promise<Map<string, string>> {
  const repository = getRepository();
  if (!repository) return new Map<string, string>();

  const apiUrl = Bun.env.GITHUB_API_URL ?? "https://api.github.com";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dynamic-tab-groups-changelog",
  };
  if (Bun.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${Bun.env.GITHUB_TOKEN}`;
  }

  try {
    const authors = new Map<string, string>();
    const head = Bun.env.GITHUB_SHA ?? runGit("rev-parse", "HEAD");

    for (let page = 1; ; page++) {
      const url = new URL(`${apiUrl}/repos/${repository}/commits`);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", "100");
      url.searchParams.set("sha", head);

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const commits = (await response.json()) as GitHubCommit[];
      for (const commit of commits) {
        if (commit.author?.login) authors.set(commit.sha, commit.author.login);
      }
      if (commits.length < 100) break;
    }

    return authors;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[changelog] GitHub author lookup failed: ${message}`);
    return new Map<string, string>();
  }
}

const types = DEFAULT_COMMIT_TYPES.map(({ hidden: _, ...type }) => type);
const preset = await createPreset({ types });
const authors = await getGithubAuthors();
const transform: ChangelogTransform = preset.writer.transform;

preset.writer.transform = (commit, context) => {
  const transformedCommit = transform(commit, context);
  if (!transformedCommit) return;

  return {
    ...transformedCommit,
    author: commit.hash ? authors.get(commit.hash) : undefined,
  };
};
const authorAttribution =
  Bun.env.GITHUB_RELEASE_NOTES === "1"
    ? " by @{{author}}"
    : " by [@{{author}}]({{@root.host}}/{{author}})";

preset.writer.commitPartial = `${preset.writer.commitPartial.trimEnd()}{{#if author}}${authorAttribution}{{/if}}\n`;

export default preset;
