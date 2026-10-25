# English UI conversion

## Scope and implementation

Frontend-owned Vietnamese UI strings have been translated to English. The audit covered `src/`, textual files in `public/` and `index.html`, including conditional JSX, errors, validation, notifications, accessible labels, chart labels, dialogs and loading/empty states. Existing English pages and components were retained without unnecessary edits.

No dependencies, CSS/layout/theme, route paths, storage keys, API endpoints/methods/payload values, role rules, analytics identifiers or payment/finance algorithms were changed by this language task. Existing uncommitted Club Deletion and Event ID removal changes were preserved.

Display dates/times and currency formatting now use `en-US` while retaining VND, the original timestamps and explicit timezone options. FullCalendar is explicitly English; the existing Google sign-in button locale is English without changing authentication. Title sorting still uses the existing `localeCompare(..., 'vi', ...)` in Sheets, Forms and the Workspace picker: this is internal sorting of user-authored content, not a Vietnamese interface label, and was left intact to preserve behavior.

Known document type/category enum values receive English display labels even when API `displayName` is Vietnamese. Requests still use the exact original enum values. Unknown external labels are preserved instead of guessed.

## Files changed by this task

- Payment: `src/api/paymentApi.js`, `src/components/SubscriptionPanel.jsx`.
- Shared/club UI: `src/components/ClubGovernance.jsx`, `src/components/ConfirmToast.jsx`, `src/components/Topbar.jsx`.
- Documents/Workspace: `src/components/CreateDocumentModal.jsx`, `src/components/DocumentPickerModal.jsx`, `src/components/GoogleWorkspacePickerModal.jsx`, `src/pages/DocumentDetailPage.jsx`, `src/pages/GoogleDocsPage.jsx`, `src/pages/GoogleFormsPage.jsx`, `src/pages/GoogleSheetsPage.jsx`, new `src/utils/documentLabels.js`.
- Dashboard/events/chat: `src/pages/DashboardPage.jsx`, `src/pages/CalendarPage.jsx`, `src/pages/DepartmentChatPage.jsx`.
- Finance/Fund: `src/pages/FinancePage.jsx`, `src/components/FundCampaignPanel.jsx`.
- Authentication/home/tasks/notifications: `src/pages/LoginPage.jsx`, `src/pages/RegisterPage.jsx`, `src/pages/HomePage.jsx`, `src/pages/TrelloPage.jsx`, `src/pages/GlobalNotificationsPage.jsx`.
- This report: `ENGLISH_UI_AUDIT.md`.

Landing, member/department management, Google Permissions, Settings, Admin, Privacy/Terms and the other authentication pages already had English interface text. `index.html` already declares `lang="en"`; public SVG/text assets have no Vietnamese interface text. They were inspected rather than unnecessarily rewritten.

## Deliberately preserved Vietnamese/external content

These are outside frontend-owned interface copy and are not automatically translated:

- Personal names in existing Admin fixtures: `src/api/adminApi.js` lines 6, 13, 20, 27, 34, 137, 153, 161, 199, 206, 213. Names/actors/creators remain unchanged; no mock business data was replaced or added.
- Internal Vietnamese comments in source/CSS. They are not rendered UI and were not edited.
- Backend free-text errors: `src/utils/getApiError.js` retains original backend `message/error/detail`; several pages also display backend messages directly. They can remain Vietnamese when the server supplies Vietnamese. No error is hidden or replaced with a misleading message.
- API plan names, descriptions and features: `src/components/SubscriptionPanel.jsx` renders `subscription.packageName`, `item.name`, `item.description`, `item.features`, `paymentOrder.packageName`. Backend English content is needed if these must always be English.
- Names, club/department/campaign/document titles and descriptions, notifications, chat messages, form content, payment proofs and other user-generated/API data retain their original language.
- Unknown future backend type/category labels, and opaque metadata in `GoogleWorkspaceResultModal`, remain external content. Only known system enums are mapped.
- External/provider-hosted checkout pages or account dialogs cannot be fully controlled by this frontend.

The final source audit found no remaining frontend-owned Vietnamese interface copy or `vi-VN` display formatting. This does not mean arbitrary user/backend content is English.

## Verification

- `npm run build`: PASS. Existing large-bundle warning remains.
- `npm run lint`: PASS. 22 existing unused import/variable warnings remain; no new warnings.
- Mock browser smoke checks rendered 23 routes: landing, login, registration, forgot/reset password, privacy/terms, club selection/creation, home/dashboard, members/departments, calendar, Docs/Sheets/Forms, Trello, Finance/Fund, notifications, profile, Settings and Admin. No runtime errors in those checks.
- Create Document fixture test: Vietnamese API enum display names show English, original EVENT/MEETING_MINUTES/title/query values are preserved, and eventId is still absent as required by the preceding task.
- Payment fixture test: English subscription/plans/QR fallback/cancel feedback, original checkout payload, and untranslated external package name preserved. No webhook or confirm-test request.
- Additional checks cover English event creation dialog and payment dialog width on a 390 px mobile viewport.
- All API requests in browser checks were intercepted with fixtures; external requests were blocked. No production payment, document creation, financial mutation, destructive request or reminder email was performed.

These are source audits and representative mock checks, not full live-backend end-to-end verification or an automated translation service for external content.
