# WelcomeScore GitHub Action

The official first-party GitHub Action for WelcomeScore: run evidence-based contributor readiness and JavaScript health audits directly in CI, generate portable artifacts, and suggest one clear Next Useful Move.

## Quickstart

Add `.github/workflows/welcomescore.yml` to your repository:

```yaml
name: WelcomeScore

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run WelcomeScore Audit
        uses: ethiorhq/welcomescore-action@v1
        with:
          threshold: 80
          format: json
          upload-report: true
```

## Pull Request Comments (Optional & Idempotent)

If you enable PR comments, grant `pull-requests: write` permission. The action will update a single bot-owned comment using an invisible marker (`<!-- welcomescore-audit-comment -->`) to avoid spamming the PR conversation:

```yaml
name: WelcomeScore PR Audit

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ethiorhq/welcomescore-action@v1
        with:
          threshold: 80
          comment-on-pr: true
```

## Inputs

| Input | Description | Default |
|---|---|---|
| `threshold` | Minimum passing score (0-100). | `80` |
| `comment-on-pr` | Post or update an idempotent PR comment. | `false` |
| `upload-report` | Save the generated report artifact. | `true` |
| `format` | Output report artifact format (`json` or `markdown`). | `json` |
| `fail-on` | Failure condition: `threshold` (fails if score < threshold) or `never`. | `threshold` |
| `cwd` | Working directory to inspect. | `.` |
| `github-token` | Token used for PR comments. | `${{ github.token }}` |

## Outputs

| Output | Description |
|---|---|
| `score` | The final numeric score (0-100). |
| `grade` | The letter grade (`A`, `B`, `C`, `D`, `F`). |
| `report-path` | Path to the generated local report artifact. |
| `next-useful-move` | Title of the highest priority Next Useful Move. |
| `report-url` | Public explanation URL on WelcomeScore. |

## Security & Privacy Boundary

- **Read-Only Inspection:** The action audits local repository files and package metadata. No source files, environment variables, or secrets are uploaded.
- **Least Privilege:** Requires only `contents: read` for auditing and `pull-requests: write` only when PR comments are explicitly enabled.
- **No Automatic PRs or Issues:** WelcomeScore never automatically creates branches, pull requests, or issues on your repository.
