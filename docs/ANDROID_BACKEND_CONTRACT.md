# WelcomeScore Native Android Integration Contract

## 1. Executive Summary & Principles
The WelcomeScore native Android application serves as a mobile client for repository health, contributor readiness, and maintainer guidance.

### Cardinal Architectural Principles
1. **Never Reimplement Scoring on Mobile**: All scoring rules, signal checks, and grade computations remain 100% deterministic and server-side. The Android app is a consumer of versioned JSON reports, not an independent scoring engine.
2. **Zero Bundled Secrets**: The Android APK must NEVER contain Supabase service keys, GitHub API tokens, or server-side credentials. All API communication uses public endpoints with rate limiting.
3. **Controlled Web Handoff for Protected Writes**: Read operations (auditing, viewing reports, viewing timelines, browsing Hall of Fame) are fully native. Writes requiring anti-abuse verification (Cloudflare Turnstile, cryptographic proofs, or community lounge moderation) use a secure Chrome Custom Tab handoff to the web platform.
4. **Transparent Freshness**: Mobile views must display the exact audit timestamp and freshness state (`ReportFreshness`). Cached data must never masquerade as a live audit.

---

## 2. API Endpoints for Android Client

All endpoints use standard HTTPS GET requests and return `application/json; charset=utf-8`.

### A. Repository Public Report Contract
- **Endpoint**: `GET /api/report?repo={owner}/{repo}`
- **Optional Params**: `&fresh=true` (forces live recheck if rate limits allow)
- **Caching**: `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`
- **Kotlin Data Contract**:
```kotlin
data class WelcomeScoreReportDto(
    val schemaVersion: String,
    val toolVersion: String,
    val repository: RepositoryRefDto,
    val analyzedAt: String,
    val analyzedCommit: String?,
    val score: Int,
    val grade: String,
    val coverage: CoverageDto,
    val checks: List<EvidenceCheckDto>,
    val goodFirstIssues: List<GoodFirstIssueDto>,
    val nextUsefulMove: NextUsefulMoveDto?,
    val publicLinks: PublicLinksDto,
    val limitations: List<String>
)

data class RepositoryRefDto(
    val owner: String,
    val name: String,
    val fullName: String,
    val defaultBranch: String,
    val source: String
)

data class EvidenceCheckDto(
    val id: String,
    val category: String, // "documentation" | "governance" | "automation" | "community"
    val label: String,
    val status: String,   // "pass" | "warn" | "fail" | "neutral"
    val points: Int,
    val maxPoints: Int,
    val explanation: String,
    val sourceUrl: String?,
    val sourcePath: String?,
    val confidence: String
)

data class NextUsefulMoveDto(
    val id: String,
    val title: String,
    val evidenceIds: List<String>,
    val whyItMatters: String,
    val smallestSafeNextStep: String,
    val expectedOutcome: String,
    val effortBand: String, // "low" | "medium" | "high"
    val acceptanceCriteria: List<String>,
    val suggestedFiles: List<String>,
    val issueDraft: IssueDraftDto?,
    val patchPlan: PatchPlanDto?
)
```

### B. JavaScript Health Dashboard
- **Endpoint**: `GET /api/js-health?repo={owner}/{repo}`
- **Purpose**: Ecosystem health metrics (ESM/CJS compatibility, TypeScript types, exports map, Node engine boundaries, dependency security flags).

### C. Improvement History Timeline
- **Endpoint**: `GET /api/timeline?repo={owner}/{repo}&limit=20`
- **Purpose**: Chronological audit progression, score deltas (+15 pts), completed moves, and changed signals.
```kotlin
data class ImprovementEventDto(
    val id: String,
    val repo: String,
    val analyzedAt: String,
    val previousScore: Int?,
    val newScore: Int,
    val scoreDelta: Int?,
    val previousGrade: String?,
    val newGrade: String,
    val defaultBranch: String?,
    val commitSha: String?,
    val changedSignals: List<ChangedSignalDto>,
    val completedMoves: List<String>,
    val remainingMoveId: String?
)
```

### D. Hall of Fame
- **Endpoint**: `GET /api/leaderboard?limit=25`
- **Purpose**: Displays exemplary open-source JavaScript/TypeScript repositories with high WelcomeScore readiness.

---

## 3. Mobile Security & Write Boundary

```
+-------------------------------------------------------------+
|                     Android Application                     |
|                                                             |
|  [Native Read UI]                   [Protected Actions]     |
|   - Repo Score                       - Report Correction    |
|   - Next Useful Move                 - Dev Lounge Posting   |
|   - Improvement Timeline             - Proof Verification   |
|         │                                    │              |
+─────────┼────────────────────────────────────┼──────────────+
          │ (HTTPS GET)                        │ (Chrome Custom Tab)
          ▼                                    ▼
+──────────────────────+             +────────────────────────+
| WelcomeScore REST API|             | WelcomeScore Web Handoff|
| /api/report          |             | Turnstile + Signed RLS |
+──────────────────────+             +────────────────────────+
```

### Controlled Web Handoff Deep Links
When the user clicks:
1. **"Report Incorrect Signal"**: Opens `https://welcomescore.vercel.app/report/{owner}/{repo}#report-signal` in a secure Custom Tab.
2. **"Join Dev Lounge Discussion"**: Opens `https://welcomescore.vercel.app/lounge/{threadId}` with existing web session / Turnstile validation.

---

## 4. Environment & Distribution Guidelines
The web frontend references the Android application via environment variables:
- `NEXT_PUBLIC_ANDROID_APP_URL`: Direct link to Google Play Store or official verified APK release.
- `NEXT_PUBLIC_ANDROID_APP_VERSION`: Current stable release version string (e.g. `1.0.0`).

### Production Safety Guardrails
- **Never publish or link to debug builds** (`assembleDebug`).
- When `NEXT_PUBLIC_ANDROID_APP_URL` is empty, the website UI displays "Android app coming soon" or gracefully conceals download prompts.
- All network operations must enforce HTTPS and Certificate Pinning where feasible in production Android network security configs.
