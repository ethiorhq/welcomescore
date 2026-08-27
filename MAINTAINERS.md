# Maintainer Guide

WelcomeScore maintainers help keep the project reliable, welcoming, and technically honest. This guide complements `GOVERNANCE.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `CONTRIBUTING.md`.

## Core responsibilities

Maintainers should:

- triage issues and pull requests with clear, respectful communication;
- protect the evidence-bound scoring model and avoid unsupported claims in product copy or Algofox reviews;
- ensure any Hall of Fame, Dev Lounge, sharing, review, or data-changing flow remains explicitly user initiated;
- review changes for secret exposure, privacy impact, accessibility, performance, and compatibility with the current visual system;
- use private reporting for security concerns and avoid publishing exploit details before a safe resolution path exists;
- manage labels accurately, especially `good first issue`, so contributors can trust their meaning;
- credit contributors appropriately and preserve ETHIOR/original-project notices; and
- document decisions that materially affect scoring, licensing, policies, user data, or production behavior.

## Triage standards

A well-triaged issue has a clear status, scope, and next action. Ask for safe reproduction details when required, but do not request credentials, personal information, private repository content, or sensitive logs in a public thread.

Use `good first issue` only for an independently useful task with a bounded outcome, adequate context, no hidden design decision, and no undisclosed security risk. Remove or update the label if the issue no longer meets those conditions.

## Pull-request review

Reviewers should focus on correctness, scope, tests, documentation, safety, and the user outcome. Prefer specific, actionable feedback. Do not request unrelated refactors as a condition of accepting a focused contribution unless they are required for safety, correctness, or maintainability.

Before merging, confirm that the change has appropriate validation, does not expose private keys or privileged Supabase credentials, and does not add unapproved automated writes, tracking, or deceptive enforcement behavior.

## Release and incident communication

Release notes should describe meaningful user-facing behavior, migrations, configuration changes, security impact where safe to disclose, and any required operator action. For an incident, prioritize containment, factual communication, recovery, and learning over blame.

Maintainers serve at the discretion of ETHIOR. This document does not create employment, partnership, fiduciary, or compensation rights.
