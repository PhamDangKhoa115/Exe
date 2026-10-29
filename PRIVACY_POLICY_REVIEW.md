# Privacy Policy implementation and owner review

The page implements the supplied English baseline, dated October 27, 2026, with all eight requested sections. It does not add disconnect/account-deletion functionality, change OAuth scopes, alter analytics, or certify compliance. **Publication readiness remains blocked on the material owner/backend checks below.** No deployment was performed.

## Evidence and discrepancies

| Topic | Evidence available | Required owner/backend verification |
| --- | --- | --- |
| Google authentication | `src/api/authApi.js` sends Google identity/profile fields for login. | Confirm the backend's actual handling and storage of Google identity data. |
| Calendar/Docs | `src/api/eventApi.js`, `src/api/documentApi.js` implement event sync and document operations. | Confirm the actual OAuth scopes, remote data access and all backend-side transfers. |
| Sheets/Forms | `src/api/googleSheetsApi.js` reads/edits sheet values; `src/api/googleFormsApi.js` handles forms, questions and responses. | The supplied policy does not explicitly name Sheets/Forms or form response data. Owner should approve additional accurate disclosures before publication. |
| Drive limitation | Frontend uses backend Google connection and document APIs; no server scope configuration is available here. | The claim that access is limited to files created by S-Club or explicitly selected cannot be proven from this frontend. Verify actual Drive scopes and enforcement. |
| Google disconnection | `src/api/googleApi.js` and Home UI expose connection/status only. Public `/v3/api-docs` inspected using GET lists connect/status but no Google disconnect/revoke endpoint. | The baseline statement about disconnecting at any time needs a verified process (for example provider-side revocation) and instructions. No in-app disconnect action was invented. |
| Account deletion | Profile exposes update/change-password; public Swagger lists user GET/PUT and change-password, not user DELETE. | The supplied policy promises a support request, not an in-app deletion feature. Verify the support mailbox is monitored and there is an operational process covering identity verification, associated data and backups. |
| Retention | Frontend stores authentication/profile/club data in localStorage and recovery/dedup markers in sessionStorage. No backend retention jobs, backup schedule or token deletion policy is available. | Confirm the broad retention statement, actual retention/deletion practice and any exceptions. No periods or guarantees were invented. |
| Analytics/storage | `index.html` loads GA4; `src/utils/analytics.js` sends page views, auth events, club ID/name and payment order/value events. `GA4.md` records account-setting verification still needed. | Baseline does not describe GA4, possible cookies/identifiers, browser storage or consent/retention settings. Owner must review actual GA4 account configuration, recipients and applicable disclosure requirements. Do not infer absence of advertising/profiling from frontend event code alone. |
| Third parties/sharing | Google services, Trello, PayOS, analytics and externally hosted assets appear in the frontend. | Verify who receives which data, service providers/subprocessors, backend logging and sharing practices. Baseline non-sale/non-sharing assertions cannot be established from source alone. |
| Security and Limited Use | Frontend uses shared Bearer auth and external HTTPS services; backend infrastructure/security controls were not audited. | Owner must verify access controls, encryption, backups, organizational measures, no advertising/profiling use, and actual Limited Use practices. The page is not a certification or OAuth approval. |

The baseline wording was retained rather than silently replaced with unverified implementation promises. Material discrepancies were reported during implementation and remain listed here for owner review.

Reference reviewed: [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy). It requires accurate disclosures about data access/use/storage/sharing; adding the link and statement does not demonstrate compliance.

## UI, routing and metadata

- Public `/privacy` route stays unchanged and does not require authentication.
- Scoped CSS uses the current purple/white palette, a centered maximum 860 px reading card, semantic headings/lists/date and readable mobile spacing.
- Title: `Privacy Policy | S-Club`.
- Description: `Read the S-Club Privacy Policy to understand how we access, use, protect, and manage personal information and Google user data.`
- Canonical: `https://sclub.io.vn/privacy`.
- No existing metadata library/helper was found. Page-local effect reuses existing description/canonical tags or creates one; cleanup restores/removes its changes on route exit. No global metadata configuration was changed.
- This remains a client-rendered SPA. These route-specific head tags appear after JavaScript runs, not necessarily in the initial HTML returned to crawlers. Initial-response SEO/production deployment is not verified.

## Validation

`npm run build`: PASS (existing bundle-size warning and a Vite plugin-timing advisory). `npm run lint`: PASS (22 existing unused import/variable warnings; no new warnings).

Local browser checks passed: public access with no token, one H1 and all eight H2 sections, ten list items, exact date/Google link/mailto link, 860 px maximum card width and no horizontal overflow at 390 px. Desktop/mobile screenshots were visually reviewed. Title/description/canonical are set on entry; no duplicate canonical is introduced; both newly created metadata removal and pre-existing metadata restoration passed on navigation to Terms. Protected Dashboard still redirects unauthenticated users to Login. No runtime errors or API requests occurred during these checks; external requests were blocked. No production data mutation or live account deletion/disconnection was attempted.
