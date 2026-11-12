# S-Club Admin Delete User integration

## Source audit

Work began on main at 5d7dee9 with existing Outcome 3, Orders Search and GA4 changes in the working tree. The change uses AdminUsers inside AdminDataViews.jsx, the existing Admin shell and AdminRoute, the shared Axios client, the Admin API request wrapper, React Toastify, existing admin modal styling and the abortable user-list hook. Feedback continues using the existing confirmation component. Delete User uses a native modal so the browser makes the background inert and the destructive action can manage keyboard focus independently.

Public Swagger documents DELETE /api/admin/users/{userId}, required int32 path ID, Admin-only access, self-deletion and club-president restrictions, and HTTP 200 with a generic object response. The supplied business rules describe active club protection and automatic membership cleanup. Swagger gives no rejection examples, status mapping or structured business error codes. An authorized profile read confirmed that the Admin profile uses userId and role ADMIN. The audit output contained only match flags.

## Implementation

- The Users Actions column includes a red Delete User button. It identifies the target by the numeric row userId. The AdminRoute profile and successful Admin access check provide the current identity. Missing or mismatched profile identity, changed session, invalid target and self-deletion disable the operation.
- The dialog displays the selected name, available email and user ID, warns of permanent deletion and membership removal, and requires an explicit confirmation checkbox. Cancel receives focus. Tab wraps within the controls, Escape closes before submission and dismissal is blocked while the request is pending. Cancel returns focus to the initiating button. Successful deletion returns focus to the Users region.
- The helper validates a positive int32 userId, sends the exact path without a body using the shared Bearer interceptor, and applies a 10-second timeout. A resolved response does not require a message or returned user object. An in-flight guard prevents a double-click from submitting twice. No automatic DELETE retry is installed.
- On success, the dialog closes, a success toast appears, user details for the target are cleared and the server list reloads with current search, status and provider filters. The Overview seed is invalidated and Overview fetches again when revisited. No client-side counter arithmetic or membership requests are involved. A failed user-list refresh has its own message and Retry action.
- The backend decides president protection. The frontend does not infer it from managedClubsCount. Clearly recognizable self-deletion and active-president wording maps to fixed English messages. Generic 400/409, 404, 500, timeout and network failures get safe messages. HTTP 401/403 retain the existing route handling. Raw deletion error payloads are not rendered. If a backend business rejection uses 403, the current Admin authorization handler applies. A distinct documented machine code would be needed to distinguish that case reliably without guessing.
- Targets stay in component state. No deletion information is stored in localStorage or passed in a query string.

## Files changed

- src/api/adminApi.js — DELETE helper and path validation.
- src/components/AdminRoute.jsx — publishes the verified session identity for Users. Route authorization rules remain the same.
- src/pages/admin/AdminDataViews.jsx — Users action, confirmation and refresh behavior.
- src/pages/admin/AdminDataViews.css — scoped modal and destructive button styling.
- tests/admin-delete-user.test.mjs — focused Chrome tests with intercepted API traffic.
- ADMIN_DELETE_USER_INTEGRATION.md — verification record.

## Safe manual verification

Use an isolated staging environment with an Admin and disposable test accounts. Confirm self-delete is disabled, open another account and cancel, then delete only an explicitly authorized disposable account. Confirm one DELETE with its numeric ID, success for HTTP 200 and empty body/object, membership cleanup in staging and fresh Users and Overview reads. Use a known protected president in staging to capture the actual rejection status and stable error code or wording. Verify a non-admin is denied. Refresh the list before another attempt after an ambiguous network failure or timeout.

Production verification covered the published contract and a read-only profile check. All destructive verification used browser interception. Live deletion, actual president rejection format and backend membership cleanup remain unverified. No push or deployment was performed.

## Results

- Safe environment status: PASS. Chrome Admin Delete User and Outcome 3 suites passed with 16 results including parent tests, zero failures.
- Delete User checks covered HTTP 200 with an empty object, exact path and body, self/unknown identity, USER denial, cancellation, keyboard focus and wrapping, pending dismissal and double-click protection, status/provider/search preservation, Overview refresh, president and self rejection wording, 400/401/403/404/409/500, network failure, timeout, distinct refresh failure and stale response suppression.
- Layout checked at 320, 375, 390, 768, 1024, 1440 and 1920 px. Tests confirmed a contained dialog, no page overflow, keyboard navigation and focus restoration.
- npm run build: PASS with the existing bundle warning. npm run lint: PASS with existing unrelated warnings.
- Live verification status: PARTIAL. Swagger and the profile shape are confirmed. Production deletion was outside the authorized scope.
