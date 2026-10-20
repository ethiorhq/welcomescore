export const DEFAULT_GITHUB_REPO_OWNER = "ethiorhq";
export const DEFAULT_GITHUB_REPO_NAME = "welcomescore";
export const GITHUB_REPO_URL = `https://github.com/${DEFAULT_GITHUB_REPO_OWNER}/${DEFAULT_GITHUB_REPO_NAME}`;

export function getGitHubRepoUrl(
  owner = DEFAULT_GITHUB_REPO_OWNER,
  name = DEFAULT_GITHUB_REPO_NAME,
): string {
  return `https://github.com/${owner}/${name}`;
}

export function getShieldsStarBadgeUrl(
  owner = DEFAULT_GITHUB_REPO_OWNER,
  name = DEFAULT_GITHUB_REPO_NAME,
): string {
  return `https://img.shields.io/github/stars/${owner}/${name}?style=social`;
}
