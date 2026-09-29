export type RepoRef = { owner: string; repo: string };

const GITHUB_RE =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?:\/(?:tree|blob)\/[^\s]*)?\/?$/;

/**
 * Parses a public GitHub repository URL. Returns null when the input is not one.
 */
export function parseRepoUrl(input: string): RepoRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const shorthand = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(trimmed);
  if (shorthand && shorthand[1] && shorthand[2]) {
    return { owner: shorthand[1], repo: shorthand[2].replace(/\.git$/, "") };
  }

  const match = GITHUB_RE.exec(trimmed);
  if (!match) return null;
  const [, owner, repo] = match;
  if (!owner || !repo || owner === "orgs" || owner === "settings") return null;
  return { owner, repo };
}

export function repoSlug(ref: RepoRef) {
  return `${ref.owner}/${ref.repo}`;
}
