import type { RepoRef } from "./repo-url";

const API = "https://api.github.com";

export class GithubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "GithubError";
  }
}

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "RepoLens",
};

async function gh<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers });
  if (response.status === 404) throw new GithubError(404, "That repository could not be found. Is it public?");
  if (response.status === 403)
    throw new GithubError(403, "GitHub is rate limiting us right now. Please try again in a few minutes.");
  if (!response.ok) throw new GithubError(response.status, `GitHub returned an error (${response.status}).`);
  return (await response.json()) as T;
}

export type RepoMeta = {
  fullName: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  defaultBranch: string;
  htmlUrl: string;
  license: string | null;
};

export type RepoContext = {
  meta: RepoMeta;
  files: string[];
  truncated: boolean;
  readme: string;
  manifests: { path: string; content: string }[];
};

const MANIFEST_FILES = [
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Gemfile",
  "pom.xml",
  "build.gradle",
];

async function fetchTextFile(ref: RepoRef, branch: string, path: string): Promise<string | null> {
  const response = await fetch(
    `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}/${path}`,
    { headers: { "User-Agent": "RepoLens" } },
  );
  if (!response.ok) return null;
  const text = await response.text();
  return text.slice(0, 12_000);
}

/** Loads the public metadata, file list and key text files for a repository. */
export async function loadRepoContext(ref: RepoRef): Promise<RepoContext> {
  const repo = await gh<{
    full_name: string;
    description: string | null;
    language: string | null;
    topics?: string[];
    stargazers_count: number;
    default_branch: string;
    html_url: string;
    license: { spdx_id?: string; name?: string } | null;
  }>(`/repos/${ref.owner}/${ref.repo}`);

  const meta: RepoMeta = {
    fullName: repo.full_name,
    description: repo.description,
    language: repo.language,
    topics: repo.topics ?? [],
    stars: repo.stargazers_count,
    defaultBranch: repo.default_branch,
    htmlUrl: repo.html_url,
    license: repo.license?.spdx_id ?? repo.license?.name ?? null,
  };

  const tree = await gh<{
    truncated: boolean;
    tree: { path: string; type: string; size?: number }[];
  }>(`/repos/${ref.owner}/${ref.repo}/git/trees/${meta.defaultBranch}?recursive=1`);

  const ignored =
    /(^|\/)(node_modules|dist|build|\.git|vendor|coverage|\.next|target|__pycache__|\.venv)(\/|$)|\.(png|jpe?g|gif|svg|ico|webp|woff2?|ttf|otf|mp4|zip|lock)$|(^|\/)(package-lock\.json|yarn\.lock|bun\.lock)$/i;

  const files = tree.tree
    .filter((entry) => entry.type === "blob" && !ignored.test(entry.path))
    .map((entry) => entry.path)
    .slice(0, 600);

  const readmeCandidates = ["README.md", "readme.md", "README.rst", "README.txt", "docs/README.md"];
  let readme = "";
  for (const candidate of readmeCandidates) {
    const content = await fetchTextFile(ref, meta.defaultBranch, candidate);
    if (content) {
      readme = content;
      break;
    }
  }

  const manifestPaths = files.filter((path) => MANIFEST_FILES.includes(path)).slice(0, 3);
  const manifests: { path: string; content: string }[] = [];
  for (const path of manifestPaths) {
    const content = await fetchTextFile(ref, meta.defaultBranch, path);
    if (content) manifests.push({ path, content: content.slice(0, 4_000) });
  }

  return { meta, files, truncated: tree.truncated, readme, manifests };
}

/** Compact text description of the repo for the model prompt. */
export function contextToPrompt(context: RepoContext) {
  return [
    `Repository: ${context.meta.fullName}`,
    `Description: ${context.meta.description ?? "(none)"}`,
    `Primary language: ${context.meta.language ?? "unknown"}`,
    context.meta.topics.length ? `Topics: ${context.meta.topics.join(", ")}` : "",
    `Default branch: ${context.meta.defaultBranch}`,
    "",
    `File list (${context.files.length}${context.truncated ? "+, truncated" : ""}):`,
    context.files.join("\n"),
    "",
    context.manifests.map((manifest) => `--- ${manifest.path} ---\n${manifest.content}`).join("\n\n"),
    "",
    context.readme ? `--- README ---\n${context.readme}` : "(no README found)",
  ]
    .filter(Boolean)
    .join("\n");
}
