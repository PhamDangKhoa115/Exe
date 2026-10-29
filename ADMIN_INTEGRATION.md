# Admin and Feedback integration

## Implemented in source

- `/admin` uses a dedicated `AdminRoute`, separate from club selection. Login and Google sign-in save the returned SYSTEM `role` in a new `systemRole` key without renaming any existing storage keys. ADMIN navigates to `/admin`; USER retains `/select-club`. Email registration still navigates to login.
- The guard checks token/session context, reuses GET user profile and verifies authorization through the real Admin overview endpoint before rendering Admin. A profile role, when present, must be ADMIN. Selected club role never grants Admin access. A successful overview read is reused once to avoid duplicate initial reads; subsequent tab visits/refresh fetch current data.
- JWT expiry is only a client-side expiry hint, never signature verification or authorization. Invalid/opaque tokens require the backend's decision. Expired sessions/401 clear token/systemRole and require login; 403 removes access and returns safely to club selection. Unauthorized module responses notify the guard. Requests associated with an old token cannot invalidate a newer session. Logout follows the existing browser-session clearing behavior; server token revocation remains backend responsibility.
- Existing Admin shell, responsive sidebar/menu, cards/tables/Recharts and GlideList are reused. Navigation now selects Overview, Analytics, Users, Clubs, Feedback and System Activity. Existing Admin Settings remains disabled because no settings contract exists.
- Overview uses all 11 stats independently, 4 resource chart series, backend currentClubs with counts/manager/visibility/status, and recent activities with avatar/action/target/timestamp. Current clubs are not treated as every system club. Unverified growth/feature mock charts, fake status/health claims and all Admin mock data/fallbacks were removed from migrated features.
- Analytics renders totals, funnel count/unit/conversions, UTM channels, weekly/monthly/yearly/selected-period revenue, trend amounts/order counts/granularity and all subscription statistics. Days selector is 7/30/90/365; service validates 1–365. Conversions above 100% remain unchanged; null growth is N/A. Revenue is VND. Known system labels are English; names/comments/club descriptions remain unmodified. English dates replace backend Vietnamese timeAgo; no relative-time/timezone assumptions are introduced.
- Users and Clubs use their documented direct arrays, debounced search and exact filters without invented server pagination. Membership details distinguish system roles from club roles. User role mutation is disabled, and no undocumented club mutation is provided.
- Admin Feedback uses rating filter and actual server page/size/totalPages/totalElements, numeric-rating English labels, summary/distribution chart, and explicit destructive deletion confirmation. Delete is locked against repeat submission. Success refreshes list and summary; an empty last page moves back safely. Failure retains the current list/dialog.
- My Feedback is integrated into existing Settings. Rating-options values are authoritative; own record is loaded, rating required, comment optional/max 2000 characters. Existing feedback is updated with PUT rather than creating another record. Delete requires confirmation. Success waits for the API, then refreshes. Backend errors remain visible. No localStorage feedback data or production mocks were introduced.
- Modules have isolated loading/empty/error/retry states, response validation, abort/active guards and stale-read protection. Missing statistics are never invented as zeros.

## API contracts

Shared Axios/Bearer configuration is unchanged. Verified public Swagger metadata using GET at `https://api.sclub.io.vn/v3/api-docs`; no authenticated production request or mutation was performed.

Admin endpoints connected:

```text
GET /api/admin/dashboard/overview
GET /api/admin/analytics?days=...
GET /api/admin/users?search=...&status=...&authProvider=...
GET /api/admin/clubs?search=...&status=...&visibility=...
GET /api/admin/feedbacks?rating=...&page=...&size=...
GET /api/admin/feedbacks/summary
DELETE /api/admin/feedbacks/{id}
```

User Feedback endpoints connected:

```text
GET /api/feedbacks/rating-options
GET /api/feedbacks/me
POST /api/feedbacks
PUT /api/feedbacks/me
DELETE /api/feedbacks/me
```

`FeedbackRequest` confirms `{ rating, comment }`; rating-options documentation confirms `[{value,label}]`. Login/Google API paths and requests are unchanged. Existing `getUserProfile` only gains an optional AbortSignal for the guard.

## Contract limits / unverified behavior

- `PATCH /api/admin/users/{userId}/role` has an opaque string map request body in Swagger. The exact key/payload and authorization are unverified: Change Role stays disabled; no role-change requests are sent.
- Admin response schemas in Swagger are mostly opaque objects. Rendering follows the detailed structures supplied by the user, with validation and errors for unsupported responses. Production values/envelopes and authorization have not been tested.
- GET `/api/feedbacks/me` now follows the verified direct-record 200 contract and treats only 404 with the exact confirmed no-feedback error as empty. Other failures and malformed 200 responses remain errors. Ownership and session checks are preserved.
- Backend must enforce Admin-only endpoints, token validity, profile ownership, one-feedback-per-user and own-only `/me` actions. Browser filtering/roles are not a security boundary. No backend authorization or token-revocation behavior was changed or certified.
- No production credentials/tokens were embedded or logged by these changes. No global Axios response interceptor, auth redesign, payment/finance/Google role change or dependency change was introduced.

## Files changed

- Routing/auth: `src/App.jsx`, new `src/components/AdminRoute.jsx`, `src/pages/LoginPage.jsx`, `src/pages/RegisterPage.jsx`, optional-signal update in `src/api/userApi.js`.
- Admin: `src/api/adminApi.js`, `src/pages/admin/AdminDashboardPage.jsx`, new `src/pages/admin/AdminDataViews.jsx` and `AdminDataViews.css`.
- Own Feedback: new `src/api/feedbackApi.js`, `src/components/UserFeedbackPanel.jsx`/`.css`, integration in `src/pages/SettingPage.jsx`.
- This document. Existing uncommitted Task Dashboard/Privacy changes were preserved.

## Verification

Mock browser tests intercept every API and block external requests. Passed: unauthenticated Admin denial; ADMIN login/no-club/refresh; USER flow/access denial; mobile menu/logout; session expiry; forged local Admin role rejected by backend profile; 401/403 during entry and module requests; malformed overview/retry; all 11 overview stats/resources/current clubs/activity; Analytics totals, conversions >100%, null growth, revenue/trend/subscriptions and days query; Users/Clubs exact filters/direct arrays, membership details, disabled role mutation and stale search; empty arrays; module 400/404/500/network and retry; Feedback rating/server pagination/summary/distribution, delete cancel/failure/double-submit/last-page refresh; own Feedback create/update/delete with exact payloads, original comments, unknown response rejection, rating validation and 2000-character limit.

These checks do not prove live backend correctness. Real production login/data/mutations, Google sign-in network flow and backend security enforcement remain unverified. No production users/clubs/feedback/financial records were changed.

Final `npm run build`: PASS, existing >500 kB bundle warning. Final `npm run lint`: PASS, 22 pre-existing unused import/variable warnings and no new warnings. Desktop overview and mobile analytics screenshots were visually inspected; the 390 px mobile viewport had document scrollWidth 390 px. All tests passed again after synchronizing Feedback pagination with the page returned by the backend.

## Verified My Feedback follow-up

- Only GET 404 with string `error` equal to `Bạn chưa gửi feedback nào!` after trimming becomes the normal empty state. Unexpected 404, malformed/null 200, authentication, permission, server and network failures remain errors.
- Existing records retain PUT/Delete mode, English numeric rating labels, confirmation, request lock and GET refresh. Both token and user ID are checked before applying asynchronous results; backend ownership remains authoritative.
- Focused mocked browser tests: `tests/my-feedback.test.mjs` and `tests/feedback-harness.jsx`. Start Vite, set `FEEDBACK_TEST_URL` if using another port (default 5174), then run `node --test tests/my-feedback.test.mjs`. `PLAYWRIGHT_MODULE` and `CHROME_PATH` can point to existing installations; no dependencies were added.
- Result: 13 focused scenarios passed (14 Node test results including the parent). Covers verified 200/404, unrelated/non-string 404, 400/401/403/500/network, malformed/null response, ownership rejection, required rating, exact POST/PUT payloads, delete confirmation/cancel, double submit, refresh, English UI and stale token response.
- Build PASS (existing large-bundle warning); lint PASS (22 existing unused-variable warnings). No production mutations were performed. Live backend authorization/ownership enforcement was not tested.
