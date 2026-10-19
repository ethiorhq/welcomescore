# WelcomeScore Improvement Timeline Specification

## Purpose
The WelcomeScore Improvement Timeline provides an evidence-based, privacy-safe audit history for repositories over time.

Unlike competitive leaderboards or social feeds that incentivize artificial engagement and stars, the timeline's exclusive purpose is **progress and maintainability**:
- Showing what improved (e.g. "Score progressed from 65 to 85 (+20 pts)").
- Showing which specific signals were resolved (e.g. `CONTRIBUTING.md` added, issue templates configured).
- Highlighting completed Next Useful Moves.
- Guiding the maintainer toward the next high-leverage move.

## Data Model
Each event records:
- `id`: Unique event UUID.
- `repo_path`: Normalized `owner/repo`.
- `analyzed_at`: ISO 8601 audit timestamp.
- `previous_score` & `new_score`: Verified scores calculated by the deterministic WelcomeScore scoring engine.
- `score_delta`: Difference (`new_score - previous_score`), or `null` for baseline audit.
- `previous_grade` & `new_grade`: WelcomeScore letter grades (`A+` to `F`).
- `default_branch` & `commit_sha`: Git commit information when available.
- `changed_signals`: Array of `{ id, label, beforePassed, afterPassed, pointsDelta }`.
- `completed_moves`: Array of move IDs that were completed between audits.
- `remaining_move_id`: Next Useful Move recommended by the system.
- `confidence`: Coverage confidence indicator (`high`, `medium`, `limited`).

## Security & Privacy Boundary
- **Only Public Repository Data**: Only records public GitHub repository signals and public audits.
- **Zero Community Data**: No user emails, passwords, community lounge messages, or private notes are attached.
- **Service Role Writes**: Insertion into `public.repo_improvement_events` is restricted to the server-side audit service via Supabase RLS.
- **Right to Be Forgotten**: Maintainers can request timeline deletion (`deleteRepoTimeline(repo)`), purging all historical audit records for their repository.

## API Endpoints
- `GET /api/timeline?repo=owner/repo&limit=20`
  - Returns `{ repo: string, events: ImprovementEvent[], totalEvents: number }`
  - Cached: `Cache-Control: public, s-maxage=120, stale-while-revalidate=300`.
