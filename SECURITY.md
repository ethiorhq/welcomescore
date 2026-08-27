# Security Policy

## Supported project

Security reports for the canonical WelcomeScore repository are welcome. This policy applies to the current default branch and the current production deployment of the canonical project. Forks, modified deployments, abandoned branches, third-party integrations, and infrastructure not controlled by ETHIOR may have different security ownership and support.

## Report privately

Please **do not** open a public GitHub issue, Dev Lounge message, pull request, discussion, social post, or chat message for a suspected vulnerability. Public disclosure can expose users before a fix is available.

Use the private vulnerability-reporting feature of the canonical [WelcomeScore repository](https://github.com/ethiorhq/welcomescore) when it is enabled. If that feature is unavailable, contact the project maintainers through the canonical repository and ask for a private reporting channel without including exploit details in the public message.

## What to include

A useful report contains:

- a concise description of the affected feature and security impact;
- reproducible steps or a minimal proof of concept;
- affected URLs, routes, versions, or commit references;
- any suggested mitigation, if you have one;
- whether you have already disclosed the issue elsewhere; and
- a safe contact method for follow-up.

Remove or redact credentials, session tokens, API keys, private keys, personal information, private repository data, and production user content. Do not access, alter, download, or delete data that you do not own or have permission to test.

## Scope examples

Potentially in scope issues may include authorization failures, unintended exposure of server-only secrets, insecure Supabase access controls, unsafe handling of user input, cross-site scripting, request forgery, denial-of-service conditions, or bypasses of documented safety boundaries.

Out of scope reports generally include social-engineering attempts, rate-limit observations without a demonstrated security impact, public information already intentionally available, vulnerabilities solely in a third-party service, or attacks that require unauthorized access to another person’s account or data. A report outside scope may still receive a good-faith response, but ETHIOR has no obligation to do so.

## Coordinated disclosure

Allow ETHIOR a reasonable opportunity to investigate and, where appropriate, release a fix before public disclosure. Do not publish exploit code or sensitive details while users may remain exposed. ETHIOR may acknowledge reporters in release notes only with their permission and only after the report is resolved or otherwise safe to disclose.

## No safe harbor guarantee

ETHIOR appreciates good-faith security research, but this policy does not authorize testing that violates law, platform rules, third-party rights, access controls, or this project’s terms. It does not create a bounty, payment obligation, employment relationship, endorsement, or legal safe harbor. If you are uncertain whether a test is authorized, stop and request clarification through the private reporting route.
