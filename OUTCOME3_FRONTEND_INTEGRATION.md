# S-Club Outcome 3 frontend integration

Audit date: 12 November 2026 (Asia/Bangkok). Work began on local main tracking origin/main with pre-existing changes in index.html and GA4.md and two untracked GA4/EXE201 audit reports. These items were preserved.

## Source and contract audit

The Admin tab shell remains behind AdminRoute, which verifies the profile and an Admin API request. The shared Axios instance and the Admin request wrapper continue to handle Bearer authentication and propagate 401/403 to AdminRoute. The Analytics view already used an abortable request hook, Recharts, server-reported periods, and VND formatting. My Feedback already validated ownership and recognized only the known no-feedback 404 body. Existing payment verification still uses server order state. The existing GA4 audit and all six event names were reviewed.

The public OpenAPI document at https://api.sclub.io.vn/v3/api-docs was retrieved successfully.

| Contract | Public Swagger result | Frontend behavior |
|---|---|---|
| GET /api/admin/analytics?days=30 | Documents the new totals and channel fields plus transactionGoal, reviews and subscriptionSales. The 200 schema is a generic object. | Uses supplied field names at runtime, with N/A or an unavailable state when optional data is absent. Existing period controls and sections remain. |
| GET /api/admin/orders | Documents status, search, from, to, zero-based page and size (maximum 100), and distinguishes gateway and manual references. The 200 schema is a generic object. | Validates supplied pagination envelope and order IDs/statuses before rendering. Reuses shared Admin authorization and request cancellation. |
| POST /api/analytics/events | Public schema specifies path, not url, and also exposes optional utmContent. Event names use lowercase letters, digits and underscores. No exhaustive enum or request-level length constraints were exposed. | Uses path and the three requested UTM fields. Uses only the supplied names page_view, pricing_view and checkout_start. |
| GET /api/feedbacks/me and GET /api/admin/feedbacks | Both endpoints exist. The 200 schemas are generic objects without explicit verified or orderCode properties. | Renders a badge only for boolean true and a numeric reference only when present in the authorized record. Existing response and summary contracts continue to work. |
| POST /api/payments/create-checkout | CreatePaymentRequest exposes packageId, clubId and userId. No session ID or UTM fields are documented. | Sends analytics independently after checkout creation. Checkout body, status checks and payment verification are unchanged. Backend joining of analytics sessions to paid orders still needs verification. |

No authenticated production responses or public event POSTs were used for this audit. Exact response payloads, CORS and event acceptance still need authorized integration checks. A successful mock is evidence of frontend handling.

## Phase status

| Phase | Status | Delivery and verification |
|---|---|---|
| 0 — Audit | PASS | Inspected branch, local diffs, Admin and feedback flows, shared API, payment, GA4, CSS, tests and public OpenAPI. |
| 1 — G3.1 Transaction Goal | PARTIAL | Admin Analytics displays the backend's cumulative target, verified paid orders, remaining orders, exact progress and achieved flag. Only the progress element is clamped. Mock verified 120% text, 100% bar and independent period paid-order totals. Live payload pending. |
| 2 — G3.2 Business KPIs | PARTIAL | Added Total Users, Paying Customers and backend AOV. Paid Orders and Revenue explicitly identify the selected period. Valid zero values are retained. Missing AOV remains N/A. Live payload pending. |
| 3 — G3.2 Orders | PARTIAL | Read-only Orders tab under the existing Admin shell. Status and creation dates filter server-side, with numeric order-code search, page sizes 20/50/100, refresh, retry and expandable details. Fixture checks cover pagination, 401/403, stale search, absence of private data after access loss and 404 recovery. Authorized live response pending. |
| 4 — G3.3 Channel analytics | PARTIAL | Added New Users, Conversion Rate and AOV to the UTM table. Source and medium missing values display Unspecified. Existing revenue trend visualization stays in place. Fixture data exercises supplied conversion and AOV values. Live payload pending. |
| 5 — G3.3 Public tracking | PARTIAL | Public landing and Features page views, pricing panel opens and successful checkout creation are wired. Chrome fixture verified request shape, UTM continuity within the SPA, authentication and referrer exclusion, GA4 coexistence, deduplication and failure isolation. Live POST acceptance and attribution to paid orders pending. |
| 6 — G3.4 Reviews and retention | PARTIAL | Reports all seven server fields and the 50% coverage target. Shows N/A for absent ratios including the zero-customer fixture. Explains repeat purchase rate. Live payload pending. |
| 7 — G3.4 My Feedback | PARTIAL | Strict verified badge and optional order reference verified with fixture. Existing 404, CRUD, confirmation and stale-session tests retained. Live optional fields pending. |
| 8 — G3.4 Admin feedback | PARTIAL | Verified Purchase and Order Code columns. Existing rating filter, pagination, summary and delete action retained. Fixture verifies true and absent verification states. Live optional fields pending. |
| 9 — Subscription sales | PARTIAL | Reports five fields and package breakdown separately. Monthly and yearly system labels can use stable codes for English fallback. Missing breakdown displays unavailable. Live payload pending. |
| 10 — Admin layout | PASS | Orders added to existing navigation. Chrome checked the ledger at 320, 375, 390, 768, 1024, 1440 and 1920 px for page overflow. |
| 11 — API and state | PASS | Shared Axios, abortable loading, guarded pagination and Admin authorization behavior verified with fixtures. Optional analytics additions preserve legacy responses. |
| 12 — Verification | PARTIAL | Build and lint pass. Browser fixture results below. Production ADMIN/USER sign-in, Google sign-in, live payment and production data processing were outside the test environment. |
| 13 — Reporting | PASS | This file records scope, evidence, limitations and safe checks. |

## Reconciliation and data handling

The ledger presents transactionNo and referenceSource as returned. GATEWAY is labeled Gateway Reference and MANUAL is labeled Manual Reference. Reconciliation requires an authorized reviewer to compare the reference against the statement. The all-time goal represents qualification by backend business rules. It is distinct from the period's paid orders and from statement matching.

Search is deliberately limited to numeric order codes. Swagger also supports name, email, club and reference search through a GET query. A body-based contract or an explicitly approved privacy approach is needed before exposing personal-data search. Order details remain component state, use React text rendering and are discarded when Admin access ends. The ledger has no payment mutation controls.

The analytics ID is a browser-generated UUID scoped to sessionStorage for the tab session, with a memory fallback when storage is unavailable. Attribution values stay in memory for the current SPA document. Reload can keep the UUID while clearing the local campaign fields. Only known static paths are submitted, with short campaign slugs in three explicit fields and the original referrer reduced to its origin. The Axios request uses its fetch adapter with no credentials, no Authorization and no HTTP Referer, a finite timeout and no retries. The existing privacy page was reviewed. The app has no consent UI in the inspected code and the integration creates no persistent localStorage identifier. Public tracking excludes authenticated resource paths and callback URLs. Features is also excluded from the existing GA4 club-context event. GA4 payment events and GA4 stream configuration were preserved.

## Files

- Created: src/pages/admin/AdminOrders.jsx, src/api/analyticsApi.js, src/utils/backendAnalytics.js, tests/outcome3.test.mjs and this report.
- Updated: src/pages/admin/AdminDashboardPage.jsx, src/pages/admin/AdminDataViews.jsx and its CSS, src/api/adminApi.js, src/api/api.js, src/components/AnalyticsTracker.jsx, src/components/SubscriptionPanel.jsx and src/components/UserFeedbackPanel.jsx.
- Updated regressions: tests/my-feedback.test.mjs, tests/public-marketing.test.mjs and tests/landing-product-demo.test.mjs. Marketing/demo tests intercept the new public event POST and still reject unrelated API requests.

## Safe follow-up checks

1. With an authorized Admin in staging, open Analytics at two different periods. Capture sanitized response keys and confirm the all-time goal remains independent of the period. Compare reviews and sales against authorized aggregate data.
2. Open Orders and check existing records only. For teacher spot-checks, choose up to the available five or more genuine orders with authorized access and compare their gateway references to statement evidence privately. Mask PII and references in any shared capture.
3. Check My Feedback using existing owned feedback with and without an explicit verified boolean. Confirm optional order reference authorization. Inspect Admin Feedback using existing records and avoid production deletion.
4. On a permitted staging campaign URL, verify one page event per path and review the POST payload in DevTools. Use a sandbox checkout to inspect pricing and checkout events and confirm backend UTM attribution with approved test data. Verify only then that paid-order attribution and reporting agree. Do not submit payment, create production orders or generate fake reviews to make the metrics pass.

## Final local verification

- Build PASS with the existing large-chunk warning. Lint PASS with existing unrelated unused-code warnings.
- Four Chrome suites PASS: Outcome 3, My Feedback, public marketing and landing product demo. Node reported 17 passing results including parent tests and zero failures.
- The Outcome 3 suite intercepted all backend calls. It checked legacy Analytics payloads, progress above 100%, period separation, channel and package data, order filters/pagination, stale responses, missing references, privacy, Admin denial, mock checkout and GA4 coexistence. Public analytics requests deliberately returned 500 in the fixture while navigation and checkout continued.
- No production deployment was performed. Live Admin response shapes, optional feedback fields, event acceptance and attribution remain pending.
