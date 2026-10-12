# Payment, Finance and Fund Campaign integration

## Existing behavior reused

- Shared Axios client, environment base URL and Bearer interceptor.
- Dashboard subscription panel, PayOS callback routes, QR modal, backend permission check, create-checkout and subscription refresh (404 means no active subscription).
- Finance layout, transaction form/table, GlideSelect filters, toast and existing Recharts dependency.
- Club member API verifies the current actor's club role; no LEADER/PRESIDENT alias is introduced.

## Implemented

- Pending payment recovery stores only orderCode in sessionStorage, keyed by club/user. Backend GET verifies ownership/status; storage never activates a subscription.
- Closing QR is separate from cancel. One sequential polling loop continues for the pending order, cleans up on unmount/identity change, and stops on terminal status. Network/429 errors back off up to 30 seconds and stop after six consecutive failures; 401/403/404 stop immediately. Retry is explicit.
- Finance summary, six-month overview, category breakdown and server-paginated transactions replace the previous mock financial data. Dashboard finance chart also reads the real overview API.
- Search debounces 350 ms; filters reset page to zero. Reads abort/ignore stale responses on club changes.
- PRESIDENT/TREASURER can create transactions and approve/cancel pending transactions, with a fresh backend role check before mutation. Default create status is PENDING; status updates use COMPLETED/CANCELLED. The UI waits for backend success and refreshes list/summary/charts.
- Export uses authenticated Blob responses, checks MIME and file signature, reads Content-Disposition, and revokes object URLs. JSON/text is rejected; real export response contract still needs backend confirmation.

## Documented endpoints

Payment endpoints were reused unchanged: packages, check-permission, create-checkout, order GET/cancel and club subscription. No webhook or confirm-test requests were added.

Finance service uses `/api/clubs/{clubId}/finance`: `summary`, `overview-chart?periodMonths=6`, `category-breakdown`, `transactions` (GET/POST), `transactions/{id}/status` (PATCH with status query), `transactions/{id}` (GET/PUT and DELETE helper only) and `export`.

Fund service now connects GET list, GET detail and GET contributions plus POST creation/proof/reminders and PATCH quick-tick. The UI is a Fund Campaign section inside the existing Finance page, with detail/create/proof/confirmation dialogs. No new routes or upload endpoints are added.

## Fund Campaign and Finance Edit completion (2026-10-12)

- API contracts were checked with the public Swagger `/v3/api-docs` using GET only. Swagger summaries describe treasurer management actions and member proof submission; they do not document an exact role authorization matrix.
- The user explicitly confirmed PRESIDENT and TREASURER management rights (view all contributions, create, quick-tick and reminders). MEMBER views only their own contribution. All three roles submit proof only for their own contribution. No LEADER alias is used.
- Role is derived from the current actor in the selected club's backend member list. Missing role disables mutations; each action checks role again immediately before sending. Backend 403 is surfaced, dialogs close and permissions/data refresh. No production mutation was used to test backend enforcement.
- MEMBER contribution records are filtered before state storage and again before render. If backend returns other members' rows, a scope warning is shown without displaying their details. This is not server security: BE must filter/restrict `GET /api/clubs/{clubId}/fund-campaigns/{campaignId}/contributions` for MEMBER and enforce proof ownership.
- List/detail show backend totals and progress, zero-safe target/member counts, bank information, dates and creator. Contributions show names/avatars/email, actual status, proof image/link and payment date, with null fallbacks. Unknown statuses stay unchanged. PENDING_APPROVAL is rendered as pending verification only when returned by backend.
- Creation validates fields and future deadline, serializes the chosen local date to ISO and requires a separate confirmation explaining possible notifications/emails. Reminders also require explicit confirmation and never run from effects.
- Quick-tick uses contribution `id`, not `userId`, and offers explicit paid/unpaid actions with boolean query. It is a manual status update, not an invented proof approval endpoint. Proof uses an HTTP/HTTPS URL, Axios query encoding and only the current user's row. Local file paths and invalid URLs are rejected.
- Mutation locks prevent duplicate submissions; no optimistic PAID state is used. Success refreshes campaign list, detail and contributions. Abort/active guards ignore stale reads on switching campaigns/clubs/unmount. No Finance transactions are fabricated or refreshed on the assumption that fund contributions create them; that relationship remains unconfirmed.
- Finance Edit reuses the existing transaction modal, loads the latest transaction with documented GET, sends the full PUT object and refreshes transactions/summary/charts/categories while retaining filters/page. Amount/description/enums are validated. Status is read-only in Edit, preserved in PUT and rechecked before save to avoid overwriting a concurrent Approve/Cancel. Backend restrictions on COMPLETED/CANCELLED updates and 403/validation failures are respected.

## Remaining backend checks

- BE authorization must be verified in an authorized test environment. The frontend now follows the user's confirmed business rules; Swagger alone does not prove server enforcement. In particular check PRESIDENT on POST fund-campaigns, PATCH quick-tick and POST remind; MEMBER filtering on contributions; and own-only POST proof for every role. Any 403 is reported rather than interpreted as success or bypassed.
- The existing chat upload helper uses JSON `{file}` and chat file URLs; a compatible public image URL/upload contract for Fund proof has not been verified. It was not repurposed or changed. URL submission works; direct proof upload remains unavailable.
- Delete Transaction authorization and real Export response format remain the previous unrelated blockers. Delete stays disabled; JSON/text export is rejected.

## Validation scope

Browser checks used StrictMode and intercepted all API calls with fixtures. No real payment, transaction mutation, contribution update, club deletion or reminder email was performed.

Covered: finance backend data/charts, debounce and page queries, create PENDING payload, approval/cancellation and refresh, double-submit, MEMBER restriction, TREASURER access, 400/403 behavior, mobile form; payment permission true/false, packages error/retry/empty, checkout deduplication, subscription 404, close vs cancel, sequential polling, reload recovery, PAID/CANCELLED/EXPIRED cleanup, return URL status ignored and cancel callback submitted once; fund mutation helper paths/query/body and invalid proof URL rejection; export JSON response rejection.

The remaining modules (authentication, Members/Google Permissions, Settings, departments/chat/notifications) were not modified. Full end-to-end regression against a live backend was not performed.

Final validation: `npm run build` and `npm run lint` both exited successfully. Build retains the existing large-bundle warning; lint reports 22 existing unused-variable/import warnings and no new warnings from this integration. No dependency/environment/backend changes were made.

Completion tests (fixtures only): campaign list/detail/contributions/empty, real and unknown statuses, zero totals, create validation/email confirmation, paid/unpaid quick-tick, own proof URL encoding, reminder confirmation/cancel, duplicate guards, refresh, 400/401/403/404/500/network failures, MEMBER own-only display, PRESIDENT/TREASURER management, stale campaign response, mobile; Finance Edit GET prefill/full PUT/immutable status/invalid amount/400/403/filters/page retention; unchanged Payment QR polling terminal flow. No real campaign emails or finance mutations were sent.

Additional checks passed: concurrent transaction status change blocks PUT; role loss prevents a Fund mutation and hides other-member data; switching clubs closes dialogs and loads the new club. Final build/lint succeeded again with the same existing large-bundle warning and 22 unused-variable/import warnings. Payment, Dashboard and unrelated modules were not edited in this completion task.
