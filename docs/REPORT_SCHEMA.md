# WelcomeScore Report Schema v1.0

## 1. Overview

The WelcomeScore Report Schema defines the standardized, machine-readable contract for repository readiness audits across all WelcomeScore platforms:
- **Next.js Web UI** (`/report/[owner]/[repo]`)
- **CLI** (`@ethiorhq/welcomescore`)
- **First-Party GitHub Action** (`ethiorhq/welcomescore-action`)
- **Public API** (`/api/report`)
- **Native Android Client**
- **Badges and Artifacts**

The core principle is **one evidence engine, many clients and artifacts**. The schema is strictly versioned (`schemaVersion: "1.0"`). Clients and parsers MUST reject unrecognized or future major schema versions.

---

## 2. JSON Schema Specification

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "WelcomeScoreReport",
  "type": "object",
  "required": [
    "schemaVersion",
    "toolVersion",
    "repository",
    "analyzedAt",
    "score",
    "grade",
    "coverage",
    "checks",
    "nextUsefulMove",
    "goodFirstIssues",
    "limitations",
    "publicLinks"
  ],
  "properties": {
    "schemaVersion": {
      "type": "string",
      "enum": ["1.0"]
    },
    "toolVersion": {
      "type": "string"
    },
    "repository": {
      "type": "object",
      "required": ["owner", "name", "fullName", "defaultBranch", "source"],
      "properties": {
        "owner": { "type": "string" },
        "name": { "type": "string" },
        "fullName": { "type": "string" },
        "defaultBranch": { "type": "string" },
        "source": { "type": "string", "enum": ["github"] }
      }
    },
    "analyzedAt": {
      "type": "string",
      "format": "date-time"
    },
    "analyzedCommit": {
      "type": "string"
    },
    "score": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "grade": {
      "type": "string",
      "enum": ["A", "B", "C", "D", "F"]
    },
    "coverage": {
      "type": "object",
      "required": ["observed", "possible", "percentage"],
      "properties": {
        "observed": { "type": "integer", "minimum": 0 },
        "possible": { "type": "integer", "minimum": 0 },
        "percentage": { "type": "integer", "minimum": 0, "maximum": 100 }
      }
    },
    "checks": {
      "type": "array",
      "items": { "$ref": "#/definitions/EvidenceItem" }
    },
    "nextUsefulMove": {
      "type": ["object", "null"],
      "properties": { "$ref": "#/definitions/NextUsefulMove" }
    },
    "goodFirstIssues": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["title", "url"],
        "properties": {
          "title": { "type": "string" },
          "url": { "type": "string", "format": "uri" }
        }
      }
    },
    "limitations": {
      "type": "array",
      "items": { "type": "string" }
    },
    "publicLinks": {
      "type": "object",
      "required": ["report", "badge", "repository"],
      "properties": {
        "report": { "type": "string", "format": "uri" },
        "badge": { "type": "string", "format": "uri" },
        "repository": { "type": "string", "format": "uri" }
      }
    }
  },
  "definitions": {
    "EvidenceItem": {
      "type": "object",
      "required": [
        "id",
        "category",
        "label",
        "status",
        "points",
        "maxPoints",
        "explanation",
        "observedAt",
        "confidence"
      ],
      "properties": {
        "id": { "type": "string" },
        "category": { "type": "string" },
        "label": { "type": "string" },
        "status": {
          "type": "string",
          "enum": ["pass", "partial", "missing", "unknown"]
        },
        "points": { "type": "number", "minimum": 0 },
        "maxPoints": { "type": "number", "minimum": 1 },
        "explanation": { "type": "string" },
        "sourceUrl": { "type": "string", "format": "uri" },
        "sourcePath": { "type": "string" },
        "observedAt": { "type": "string", "format": "date-time" },
        "confidence": {
          "type": "string",
          "enum": ["high", "medium", "low"]
        },
        "limitations": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "NextUsefulMove": {
      "type": "object",
      "required": [
        "id",
        "title",
        "whyItMatters",
        "evidenceIds",
        "effort",
        "expectedOutcome",
        "acceptanceCriteria"
      ],
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "whyItMatters": { "type": "string" },
        "evidenceIds": {
          "type": "array",
          "items": { "type": "string" }
        },
        "effort": {
          "type": "string",
          "enum": ["small", "medium", "large"]
        },
        "expectedOutcome": { "type": "string" },
        "acceptanceCriteria": {
          "type": "array",
          "items": { "type": "string" }
        },
        "suggestedFiles": {
          "type": "array",
          "items": { "type": "string" }
        },
        "issueDraft": {
          "type": "object",
          "required": ["title", "body", "labels"],
          "properties": {
            "title": { "type": "string" },
            "body": { "type": "string" },
            "labels": { "type": "array", "items": { "type": "string" } }
          }
        },
        "patchPlan": {
          "type": "object",
          "required": ["files", "operations", "safety"],
          "properties": {
            "files": { "type": "array", "items": { "type": "string" } },
            "operations": { "type": "array", "items": { "type": "string" } },
            "safety": { "type": "string", "enum": ["low-risk", "review-required"] }
          }
        },
        "limitations": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  }
}
```

---

## 3. Evidence Status Semantics

| Status | Meaning |
|---|---|
| `pass` | The expected signal or artifact is present and meets all criteria. Full points awarded. |
| `partial` | An incomplete or preliminary signal was detected (e.g. some starter issues present, but fewer than ideal; or starter issue template present without issue labels). Partial points awarded. |
| `missing` | The signal was checked and definitively not found. Zero points awarded. |
| `unknown` | Upstream limits, network timeouts, or missing permissions prevented observation. Zero points awarded, confidence marked `low`, and excluded from observed coverage. |

---

## 4. Next Useful Move Contract

Every report highlights at most **one primary Next Useful Move** rather than a long list of grievances.
A move includes:
1. `id`: Unique identifier (e.g. `readme-setup`, `contributing-guide`, `code-of-conduct`, `license`, `starter-issue-quality`).
2. `evidenceIds`: Direct links to the failing or partial evidence item IDs.
3. `whyItMatters`: Practical impact on first-time contributors or maintainers.
4. `expectedOutcome`: Specific, bounded result.
5. `effort`: Bounded effort band (`small` <= 15 min, `medium` <= 30 min, `large` > 30 min).
6. `acceptanceCriteria`: Testable checklist items.
7. `suggestedFiles`: Optional paths to inspect or create.
8. `issueDraft`: Ready-to-copy GitHub issue draft with title, Markdown body, and labels.
9. `patchPlan`: Safe modification plan with safety classification (`low-risk` vs `review-required`).

---

## 5. Security & Privacy Boundaries

- Reports evaluate only publicly observable repository metadata and public issue search results.
- No repository source code, environment variables, or private files are stored or serialized into reports.
- All report files and API responses include an explicit `analyzedAt` timestamp and `limitations` notice clarifying that WelcomeScore scores are educational maintainer readiness observations, not security audits or legal certifications.
