# WelcomeScore Evidence Correction & Trust Loop

## 1. Motivation

No automated static scanner can anticipate every bespoke open-source repository convention. When a tool pretends to be 100% objective without an appeal mechanism, it loses maintainer trust.

The **WelcomeScore Correction Loop** gives repository maintainers a direct, respectful, and privacy-preserving channel to report inaccurate, false-positive, or non-standard evidence observations.

---

## 2. Core Operational Rules

1. **No Automatic Score Adjustments:**
   A user correction report NEVER immediately or automatically alters a public WelcomeScore score. Unverified automated edits would enable abuse and gamification.
2. **Deterministic Upstream Outcomes:**
   Every reviewed correction must resolve into one of four concrete outcomes:
   - **Scoring rule enhancement:** Upgrading the scoring engine to recognize a valid conventional pattern (e.g. recognizing `COPYING.md` or `.github/` folder community files).
   - **Regression test:** Adding an automated test fixture representing the repository state.
   - **Documented limitation:** Updating `docs/SIGNALS_AND_LIMITATIONS.md` when an edge case cannot be safely audited automatically.
   - **Rejection with clear explanation:** Informing the submitter why the check outcome stands.
3. **Strict Privacy Boundaries:**
   Correction submissions and triage notes are private to WelcomeScore maintainers. Submissions are stored in `report_corrections` with Row Level Security enabled. Anon and authenticated clients have zero read access to other repositories' correction requests.

---

## 3. Submission Schema & Validation

Submissions to `POST /api/corrections` must provide:

- `repo`: Valid GitHub repository string (`owner/name`).
- `evidenceId`: Identifier of the disputed check (e.g. `license`, `readme-setup`, `contributing-guide`).
- `reason`: One of the following bounded categories:
  - `external_location`: The file exists in a non-standard subfolder or external documentation portal.
  - `custom_license`: The project uses a custom or proprietary source-available license.
  - `external_ci`: Automated CI runs via a non-GitHub Actions platform (e.g. CircleCI, GitLab CI).
  - `monorepo_structure`: The project is organized as a monorepo workspace.
  - `stale_status`: The repository was recently updated or activated.
  - `other`: Other maintainer explanation.
- `explanation`: Detailed description (10–500 characters).
- `sourceUrl`: Optional public HTTP/HTTPS URL validating the claim.

---

## 4. Abuse Protection & Rate Limiting

- **Network-based rate limiting:** Max 5 submissions per hour per IP network bucket.
- **Duplicate detection:** Duplicate open submissions for the same repository and evidence check are deduplicated with status `duplicate`.
- **Sanitization:** All submissions are stripped of HTML tags, scripts, and control characters before storage.
