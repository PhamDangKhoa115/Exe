# S-Club Outcome 3 — Phase 14 backend verification

Audit date: 12 November 2026 (Asia/Bangkok). Backend: https://api.sclub.io.vn. Official frontend: https://www.sclub.io.vn.

The supplied Admin account authenticated successfully (HTTP 200, Admin role). Authorized requests were limited to reads after authentication. Credentials, tokens, feedback text and customer identifiers were excluded from the evidence. OpenAPI and a non-mutating CORS preflight were also checked. The browser rendering comparison fed real aggregate responses into a local frontend through interception, with mocked access checks and external requests blocked. The automated regression suite used fixtures throughout.

## Release gates

| Gate | Status | Evidence and remaining work |
|---|---|---|
| G3.1 — Cumulative transaction goal | **PASS** for sampled backend and local rendering | HTTP 200 at 7, 30 and 90 days. All five fields matched across those requests. Chrome displayed the sampled goal values and progress correctly. Bank or gateway reconciliation is a separate check. |
| G3.2 — KPIs and Orders Ledger | **PARTIAL** overall. KPIs **PASS**, live ledger **BLOCKED** | Business KPI cards matched the real response. Every Orders request tried returned HTTP 500, including the default query and the exact frontend page-size query. |
| G3.3 — Backend tracking and paid-order attribution | **BLOCKED** for live verification | Public schema and official-origin CORS preflight verified. Frontend request behavior verified with mocked traffic. No authorized staging POST or backend evidence joins a tracking session to a paid order. |
| G3.4 — Reviews, retention and subscription sales | **PARTIAL** | Real analytics aggregates matched local rendering. Real Admin Feedback shape, filters and pagination verified. The current Admin account has no own feedback record, and sampled Admin rows did not provide a non-null order reference. |

## 14.1 Admin Analytics

Endpoint: GET /api/admin/analytics?days=30, with comparison calls at 7 and 90 days. All three returned HTTP 200. The 30-day sample used backend boundaries from 2026-10-13T16:47:31.172254044 to 2026-11-12T16:47:31.172254044, as returned. Timestamp timezone was not specified.

| Expected contract | Actual observed structure and compatibility |
|---|---|
| transactionGoal | targetOrders, paidOrders, remainingOrders and progressPercent were numbers, and achieved was boolean. The identical goal across all three periods was 20 target, 8 qualifying paid, 12 remaining, 40%, achieved false. The 30-day paid-order count was 7, shown separately from the cumulative 8. |
| totals | All nine expected numeric fields present: trackedEvents, visitors, newUsers, checkouts, paidOrders, revenue, totalUsers, payingCustomers and averageOrderValue. Sample period revenue was 1,065,000 VND. The nine KPI values matched in Chrome. |
| channels | Two rows with string source and medium. visitors, newUsers, checkouts, paidOrders, revenue and conversionRate are numeric in the inspected contract/sample. averageOrderValue can be null. Chrome matched both rows, including N/A for null AOV. |
| reviews | All seven expected fields numeric: totalReviews, verifiedReviews, averageRating, payingCustomers, reviewCoveragePercent, repeatPayingCustomers and repeatPurchaseRate. Chrome values matched. |
| revenue, revenueTrend | weekly, monthly, yearly and period objects carry string label/from/to plus numeric amount, paidOrders and previousAmount. growthPercent is nullable and was null in weekly/yearly samples. Trend contained 31 rows with string bucket/label and numeric amount/paidOrders. Chrome matched the four revenue amounts and every numeric trend row. |
| subscriptionSales | from/to strings, numeric paidOrders, revenue, newSubscriptions, renewals and payingClubs, plus byPackage array. All three rows supplied packageId, code, name, cycle, durationDays and the four numeric sales fields. Observed codes: YEARLY, MONTHLY and FLASH_SALE. Chrome matched the summary and package numeric values. |
| Existing subscriptions and funnel | The five subscription counts were numeric. Funnel included five rows, with numeric counts and a nullable conversionFromPrevious at the first step. trendGranularity is a string. |

The source formats nullable numeric fields as N/A and uses the server's progress figure. Frontend and backend counting semantics were not reimplemented. The sample tests verify values returned during this audit. They do not independently prove which real orders met the server's qualification rules.

## 14.2 Admin Orders

Expected endpoint: GET /api/admin/orders with ADMIN Bearer auth, optional status/search/from/to and zero-based page/size. Expected 200 response is a content/page/size/totalElements/totalPages envelope. Row expectations include orderCode, status, transactionNo, referenceSource, customer, club, package and timestamps.

**Observed:** HTTP 500 for all nine query variants in the controlled recheck. These were default query, page=0&size=20, page=1&size=1, each of the four documented statuses with size=1, search=0 with size=1, and a valid from/to range with size=1. An earlier page=0&size=1 also returned 500. The observed error envelope had timestamp, status, error and path. No ledger content was returned. This was reproduced through direct requests using the same authorized account that received HTTP 200 from Analytics and Admin Feedback. Local Chrome displayed the intended retryable server-error state for HTTP 500.

**Blocker:** Backend owner needs to diagnose and restore HTTP 200 on this endpoint. Then verify exact sample-code search, each status, inclusive creation dates, distinct pages, reference fields and authorized detail fields. Mock results cover these frontend paths. The frontend limits search to numeric order codes as documented in the integration report.

### Privacy-safe reconciliation checklist

1. Use an authorized Admin session and existing PAID orders only. Select five eligible records when the ledger is available.
2. Use created dates to narrow the list. Record status, reference source, amount and paid timestamp in a restricted worksheet. Give each sample a local alias. Keep customer contact information and full references out of the shared report.
3. Compare each GATEWAY reference privately to authorized gateway or bank statement evidence. Check amount, timestamp, currency and reference consistency. Record the outcome as matched, discrepant or evidence unavailable.
4. Treat MANUAL as manual confirmation. A displayed gateway reference alone establishes no statement match. Mask identifying fields and references in any evidence shared with reviewers.

## 14.3 Backend event tracking

Endpoint: POST /api/analytics/events. The live public OpenAPI document returned HTTP 200. AnalyticsEventRequest exposes string fields eventName, sessionId, path, referrer, utmSource, utmMedium, utmCampaign and utmContent. The published property is **path**. There is no url property in that schema. The operation description specifies lowercase letters, digits and underscores for eventName. No required-property list, regex schema constraint, length bound or enum was exposed. The supplied examples page_view, pricing_view and checkout_start comply with the description. Their acceptance by the actual POST handler, including rejection behavior, requires staging tests.

Official-origin preflight to the endpoint returned HTTP 200 with Access-Control-Allow-Origin https://www.sclub.io.vn, POST in allowed methods, and content-type allowed. This verifies preflight for the checked origin and headers. No production event POST was made.

The local Chrome fixtures verified the three names, UUID, retained UTM fields within SPA navigation, request deduplication and error isolation. The fixture deliberately returns HTTP 500 while navigation and checkout continue. GA4 events are separately dispatched. For attribution, the published CreatePaymentRequest contains only packageId, clubId and userId. Backend docs state that session and UTM are stored for attribution, but the verified frontend requests contain no shared checkout/session correlation field and the event request excludes account/order IDs. A backend-side association could exist, but its mechanism and end-to-end results are unverified.

**Blocker:** Obtain authorized staging access and verify positive/negative POST cases and the CORS response on actual requests. Obtain the documented backend join mechanism or observe a staging campaign session, authenticated checkout and sandbox paid order attributed to the expected channel. No undocumented payment fields were added.

## 14.4 Feedback

| Endpoint | Expected and observed | Status |
|---|---|---|
| GET /api/feedbacks/me | A record belongs to the authenticated user. Admin account returned HTTP 404 with the known no-feedback error body. Existing code recognizes this exact trimmed error as empty and checks userId when provided on a record. Positive production ownership and non-null orderCode remain unobserved. | **PARTIAL** |
| GET /api/admin/feedbacks | HTTP 200 with numeric page/size/totalElements/totalPages and content array. Observed item types include numeric rating, string comment, boolean verified and null orderCode. Size 1 returned one distinct record on each of pages 0 and 1. The rating=5 sample matched the filter. Reviewer information was omitted from evidence. | **PASS** for observed response and pagination. Non-null reference still unverified. |
| GET /api/admin/feedbacks/summary | HTTP 200 with numeric totalFeedbacks and averageRating and object ratingCounts. Outcome 3 review aggregates come from Analytics reviews. | **PASS** for observed shape. |

Both UIs use strict boolean equality for Verified Purchase. The regression tests cover true and missing verification, owned-feedback reference rendering, ownership rejection and the exact known 404. No production review writes or deletes were performed. Complete live verification with a pre-existing verified review, its authorized order association and an existing account that owns a feedback record.

## 14.5 Privacy audit

- Backend analytics generates a UUID unrelated to account identity. It stores the UUID in sessionStorage with an in-memory fallback. The ID survives a reload in the same tab. UTM values stay in module memory and are lost on reload unless present on the landing URL again. This is a pseudonymous session identifier. Backend retention and reuse for attribution were not verified.
- Tracking sends allowlisted static paths, three campaign fields filtered to short slugs, and the referrer origin. URL query strings, fragments, callback paths, raw referrers and account/payment IDs are omitted. Campaign slugs are still user-controlled and must be treated as such by campaign owners and backend.
- The Axios request uses the fetch adapter, credentials omission, no-referrer policy and explicit authorization suppression. Mock browser requests confirmed absence of Authorization and HTTP Referer even in a signed-in test session. The tracking module does not set cookies. Existing Google-tag behavior and property-side cookie and consent settings require separate verification.
- The privacy page describes account and Google Workspace data, but does not disclose the first-party analytics session ID, UTM/referrer collection or analytics data retention. There is no consent UI or consent gate in the inspected frontend flow. This is a documentation and policy gap. Confirm the appropriate disclosure, retention policy and any consent requirements with the project owner before release. This audit does not establish a legal conclusion or change tracking identifiers, cookies or policy text.

## 14.6 Corrections, tests and production readiness

No source correction was warranted by the observed responses. The Orders error originates from the endpoint with valid inputs and is surfaced by the existing UI. The campaign reload limitation and privacy disclosure gap are recorded for review. Only this report was created in Phase 14.

- npm run build: PASS with the existing large-chunk warning.
- npm run lint: PASS with existing unrelated warnings.
- Authenticated HTTP evidence and the local Chrome comparison using actual Analytics aggregates passed as described above. These are separate from the regression suites using mocked backend traffic.
- The existing GA4 production-stream audit remains separate from this backend check. This phase did not establish GA4 property ingestion or release the new Measurement ID.

**Production readiness: not yet verified.** The release needs a working Orders endpoint, verified staging event acceptance and paid-order attribution, plus positive live verification of the owned feedback and order-reference cases. Analytics goal and KPI evidence is usable as a dated authenticated snapshot.

Regression rerun: all four Chrome suites passed (Outcome 3, My Feedback, Public Marketing and Landing Product Demo). Node reported 17 passing results including parent tests and zero failures. All production analytics/payment mutations were excluded from these suites.
