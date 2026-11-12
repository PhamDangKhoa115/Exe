# S-Club Outcome 3 — Phase 15A Orders verification

Verification date: 12 November 2026 (Asia/Bangkok). Local branch main, HEAD 5d7dee9. Existing worktree changes were preserved. The only file added in this phase is this report.

## Contract and test boundaries

The existing published Admin Orders contract is GET /api/admin/orders with optional status, search, from, to, page and size. Dates use yyyy-MM-dd, page is zero-based, and size supports up to 100. The existing frontend uses AdminRoute, the shared authenticated Axios client and the Admin request wrapper. It submits numeric order-code searches only. The broader backend search contract also describes customer, club and reference search.

The previous Phase 14 audit saw HTTP 500 for the default request and filter variants. Phase 15A performed authenticated read-only Orders requests after Admin sign-in. Local Chrome rendered privacy-masked copies of real GET responses through interception and used fixture access checks. Regression suites used mock traffic. No credentials, customer data or complete transaction references are included in this report.

## Live findings

| Check | Status | Observed evidence |
|---|---|---|
| Baseline list | PASS | GET with page=0&size=20 returned HTTP 200. Envelope: content array of 20 rows, page=0, size=20, totalElements=38, totalPages=2. |
| Row shape | PASS | All requested keys were present on the first page. Numeric: id, orderCode, amount. String: status, paymentMethod, referenceSource, customerName, customerEmail, clubName, packageName, createdAt. String or null: transactionNo, customerPhone, paidAt, cancelledAt. |
| Numeric search | BLOCKED | A known code from the returned records, a short nonexistent numeric code, and a 20-digit numeric probe each returned HTTP 500. An existing code combined with status and date filters also returned HTTP 500. The expected match and empty results could not be verified live. |
| Search interaction | PASS for dispatch and failure handling | Chrome confirmed Enter and click, reset to page 0, preserved status and date filters, omitted search on clear, suppressed repeated identical submissions and showed the server error with Retry. Mock regression confirmed successful match, empty result and protection against stale responses. |
| Status filters | PASS | All four returned HTTP 200. Totals were PAID 11, PENDING 5, CANCELLED 22 and EXPIRED 0. Every returned row matched the requested status. EXPIRED returned an empty array. |
| Created-date filters | PASS | Same-day from/to using an existing record's date returned HTTP 200 and seven rows for that day. Chrome sent the literal yyyy-MM-dd values. Combined status and date rendered successfully. Adding search to that combination produced the server error. |
| Pagination | PASS | Page 1 at size 20 returned 18 rows with no overlapping IDs from page 0. Sizes 50 and 100 each returned all 38 rows on one page. Chrome verified Next, Previous, first and last boundary controls, page reset on search and status change, and size change. |
| Order details | PASS for sampled rows | Chrome compared a row's amount, status, payment method, package, source and timestamps against the masked live response. Opening details matched its ID and optional values, including N/A for missing fields where applicable. Opening a different row replaced the expanded details. Changing pages cleared the expansion. Names, contacts, clubs and references were masked for the browser comparison. |
| Responsive and keyboard checks | PASS | Local Chrome checked 320, 375, 390, 768, 1024, 1440 and 1920 px. Search input/button heights matched, controls stacked or aligned as intended, text fit, page had no horizontal overflow and keyboard focus was visible. Wide tables use their existing scroll container. Masked references retained original lengths. No reproducible frontend defect required correction. |

Search is an isolated backend blocker in this sample. The same authorized session returned successful list, status, date and pagination responses. Backend follow-up should reproduce with the search parameter and a real existing numeric code, then verify HTTP 200 for both a match and an empty result. Search that contains personal information was outside scope.

## Reconciliation readiness

The PAID sample contained **eight** rows classified by the backend as GATEWAY with distinct, nonempty transaction references, numeric order codes, positive amounts and paid timestamps. These fields support selection of at least five records for a spot-check.

**Records available for reconciliation; external statement matching pending.**

Use five local aliases (R-01, R-02, R-03, R-04, R-05) for the private sample. For each alias, confirm PAID and Gateway Reference in Admin, then compare the amount, currency, paid timestamp and reference with authorized PayOS or bank evidence. Record Matched, Discrepancy or Evidence unavailable. Keep the alias-to-record mapping and full references in a restricted reconciliation workspace. Publish only aliases, outcomes and any approved aggregate results. MANUAL records should be identified separately. This audit did not have statement access and does not establish whether any specific order matches a statement.

## Regression and readiness

- npm run build: PASS, existing bundle-size warning.
- npm run lint: PASS, existing unrelated warnings.
- Outcome 3 and Admin Delete User Chrome suites: PASS, 16 reported results including parent tests, zero failures. The Orders regression is part of Outcome 3. All mutation requests in the suites were intercepted.
- Live requests in this phase read Orders after authentication. No production order, payment, user or feedback mutation was performed. No push or deployment was performed.

**G3.2 readiness: PARTIAL.** Admin Orders listing, filters, pagination, details and access to reconciliation fields are verified against sampled live responses. Successful live numeric search remains blocked by HTTP 500. External statement reconciliation remains pending. The authenticated KPI comparison from Phase 14 is recorded separately.
