# Task Dashboard API integration

## Changes

- Reused `getTaskDashboard` in `src/api/trelloApi.js`; optional explicit club/user arguments and AbortSignal preserve no-argument calls from Trello. Club ID must be a positive safe integer. Invalid/missing user ID is omitted. Shared Axios, authentication and response `.data` extraction are unchanged.
- Dashboard fetches `GET /api/tasks/dashboard` independently of members/events/task details/finance. Static 28/14/8 values and the derived authoritative total were removed.
- GET `/api/tasks` remains for Tasks Requiring Attention, deadline sorting and assignee details. Existing member/event calculations and navigation are preserved.
- Refresh loads both task aggregates and the existing data/finance reads. No automatic task polling or new dependencies were added. Reads use abort/active/context guards; club changes clear old data, and old responses cannot overwrite the new context. Storage/focus listeners only synchronize context and do not poll the API.

## All ten fields

| Backend field | Visible use |
| --- | --- |
| totalTasks | Donut center and Total Tasks metric; never replaced by sum of statuses |
| todoTasks | To Do donut segment/legend and metric; contributes to explicitly labeled To Do + In Progress overview |
| doingTasks | In Progress donut segment/legend and metric; contributes to that overview |
| doneTasks | Completed donut segment/legend and metric |
| financeRelatedTasks | Finance-Related Tasks metric |
| eventCriticalTasks | Event-Critical Tasks metric |
| eventCriticalDoneTasks | Completed Event-Critical Tasks metric |
| eventProgressPercentage | Event Task Progress numeric percentage and bar |
| overallProgressPercentage | Overall Task Progress numeric percentage and bar |
| overdueTasksCount | Overdue overview and metric; not calculated from task records |

Counts must be finite nonnegative numbers; both percentages must be finite numbers. Missing/invalid fields produce an error and unavailable metrics, not fabricated zeros. Valid zero totals show “No tasks available.” Percentages remain numerically unchanged; only the bar is clamped to 0–100. A total/status-count mismatch displays an explicit warning while preserving all backend values. Donut colors and Recharts tooltip remain unchanged.

## Verification

Public `https://api.sclub.io.vn/v3/api-docs` was read using GET: it confirms `/api/tasks/dashboard`, required clubId and optional userId. Its response schema is an opaque object, so validation uses the user's supplied ten-field contract. A real authenticated response for a selected production club was not fetched; no production integration success is claimed.

Focused local browser fixture checks passed under React StrictMode: all ten fields, endpoint/query/shared client, mixed/zero values, missing/negative fields, API 500/retry, independent member/finance/detail visibility, slow loading, stale club response, manual Refresh (one additional task request), percentages 0/100/out of range, mismatched total, optional userId omission, invalid club rejection and mobile metric layout. Fixtures deliberately return a detailed task list whose counts differ from the aggregate, verifying that overview counts use the aggregate while task title/assignee remain visible. No task mutation or other production operation was performed.

`npm run build`: PASS, existing >500 kB bundle warning. `npm run lint`: PASS, 22 existing unused import/variable warnings; no new warnings. Pending applications placeholder and unrelated Privacy Policy changes were not modified by this task.

No implementation blocker remains for the supplied contract. Production authorization/actual ten-field response still need verification in an authorized environment. The mismatch case was exercised with fixtures; no real backend inconsistency was observed or alleged.
