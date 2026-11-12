# S-Club GA4 production stream audit

Audit date: 11 November 2026 (Asia/Bangkok).

## Source, build and deployed evidence

| Surface | Measurement ID | Evidence |
|---|---|---|
| Source before correction | G-2V5LDJ2FN5 | Google tag loader and inline config in `index.html`. |
| Live site sampled during audit | G-2V5LDJ2FN5 | Chrome opened the apex and www URLs in separate pages. The apex redirected to `https://www.sclub.io.vn/`, which returned HTTP 200. Each page loaded `/gtag/js` and emitted one observed initial `/g/collect` request with `tid=G-2V5LDJ2FN5` and `en=page_view` during the sampled window. |
| Intended official stream and corrected source | G-H0EZJDHCRK | Official www stream specified by the project owner. The loader and config now target this ID. |
| Local Vite production output after correction | G-H0EZJDHCRK | Both ID references in `dist/index.html` use the intended ID. The previous ID is absent. |

The sampled production tag matched the pre-change source. This confirms that the official hostname sent a browser request to the old destination. It does not establish which hostname generated the property’s historical events or whether GA4 processed the sampled requests. The corrected build has not been deployed or tested on the live domain.

`index.html:12–24` loads gtag.js, initializes `dataLayer` and the queue function, then calls `gtag('js', …)` and `gtag('config', …)` behind an initialization guard. The two appearances of the ID belong to the same loader and config. No second Measurement ID, GTM container snippet or GTM container request was found in source or in the sampled production loads. The googletagmanager.com host serves gtag.js here. Account-side connected destinations and other injection outside the sampled loads remain unverified.

`vite.config.js` uses the React plugin and a development API proxy. `vercel.json` rewrites SPA paths to index.html. The environment names inspected were `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`. No GA4 environment override was found in the repository configuration. Hosted project settings were not inspected. The GA4 Measurement ID is public configuration.

## Event contracts and SPA deduplication

All event calls flow through `src/utils/analytics.js:12–21`, which filters event-specific fields and appends pathname-only `page_location` and `page_referrer` without query or hash.

| Event | Entry point | Event-specific parameters |
|---|---|---|
| `page_view` | `src/main.jsx:13` mounts `AnalyticsTracker` under BrowserRouter. Tracker lines 5–10 call the helper on pathname changes. | `page_path`, `page_title` |
| `user_login` | `src/pages/LoginPage.jsx:45` and `src/pages/RegisterPage.jsx:114` after authentication succeeds. | `method` (email or google) |
| `user_register` | `src/pages/RegisterPage.jsx:80` after email registration succeeds. The Google entry point records login. | `method` (email) |
| `view_club` | `src/components/AnalyticsTracker.jsx:9` and `src/utils/analytics.js:33–40`, based on stored club context and token. | `club_id`, optional `club_name` |
| `initiate_transaction` | `src/components/SubscriptionPanel.jsx:345` after checkout creation. | `transaction_id`, `value`, `currency` (VND) |
| `complete_payment` | SubscriptionPanel lines 219, 272 and 369 after order verification, with a PAID guard in the helper. | `transaction_id`, `value`, `currency` (VND) |

App routes and callers were reviewed. The helper drops consecutive identical page URLs in memory. Query/hash-only changes do not trigger the pathname effect. Reloads and later revisits can record new page views. Club views dedupe by the last active club in memory. Payments dedupe per event/order through a Set and sessionStorage. The existing report documents the `/features` club-context issue and PAID paths that skip tracking.

`send_page_view: false` suppresses the config-generated page view. Enhanced Measurement can independently send page views on browser history changes, outside the React helper’s deduplication. Keep the manual tracker and have the GA4 administrator check the official stream’s **Page views → Page changes based on browser history events** setting. Turn off that option if enabled. Preserve unrelated measurement settings. A sampled single initial hit does not verify history settings. [Google’s manual page-view guidance](https://developers.google.com/analytics/devguides/collection/ga4/views#disable_page_changes_based_on_browser_history_events)

## Files and checks

- `index.html` changes the loader and config to the official ID.
- `GA4.md` documents the official ID and narrows the browser-history instruction to the relevant option.
- `GA4_PRODUCTION_STREAM_AUDIT.md` records the evidence, deployment steps and report wording.

`npm run build` passed with the existing chunk-size warning. `npm run lint` passed with unrelated existing warnings. No standalone analytics suite was found in the repository. The previous EXE201 audit’s helper mock checks were rerun in memory and passed for the six names, payload filtering and deduplication guards. A separate Chrome check served the built files via request interception with external requests blocked. Home → Features → Home queued exactly three manual page views. A second Home click queued none. That check verifies the app’s dispatch behavior without exercising live Enhanced Measurement.

## Deployment and official stream verification

1. Publish the corrected commit through the authorized Vercel production workflow using the usual Vite build and dist output. Verify the deployment is assigned to www.sclub.io.vn and check the apex redirect. Retain the old stream and its historical records.
2. In GA4 Admin, select the official web stream and check its Measurement ID, browser-history option and Google tag destinations. Save evidence of the settings. If a second destination is observed, investigate the tag’s connected destinations or deployment injection before changing any settings.
3. Connect [Tag Assistant](https://tagassistant.google.com/) to the final www URL. In DevTools Network, preserve the log and inspect GA collect requests. Check that `tid=G-H0EZJDHCRK`, `en=page_view` and the page location matches the official hostname. Check the initial load, Home → Features and browser Back. Expect one hit per committed pathname transition in that sequence and check for traffic to the old ID. Capture tag destinations and sanitized request details.
4. In **GA4 Admin → Data display → DebugView**, select the connected debug device. Verify the same sequence and parameters, including `page_location`, `page_referrer` and `page_title`. Correlate time and hostname with the network trace. Use authorized test accounts and sandbox workflows for other events, or use existing evidence for transaction events. Confirm Realtime separately if needed. [Google DebugView instructions](https://support.google.com/analytics/answer/7201382)
5. For EXE201 counts, use the GA4 event report or Exploration with the reporting period, hostname and stream scope where available. Exclude QA traffic as applicable. Record counts only once the property evidence is available.

## Safe wording for EXE201 Section 7

Chrome observed the public S-Club hostname sending a page_view request to G-2V5LDJ2FN5 before the source change. The corrected source and local build target G-H0EZJDHCRK. The six application event contracts and manual pathname tracking are verified in source, with helper and built SPA checks as described above. Official stream ingestion, browser-history deduplication on the deployed build and historical attribution by hostname remain pending GA4 evidence. Historical Backend Admin Analytics figures in Section 7 retain their own source and period.

## Production release readiness recheck — 11 November 2026 (Asia/Bangkok)

- Git is on local `main`, tracking `origin/main`. The GitHub remote default branch and actual remote `main` both resolve to `5d7dee9878fdbeb72d7b09525a28d5919f1c0f83`, matching local HEAD. That committed revision still contains the old Measurement ID. The corrected loader and config are uncommitted in `index.html`, accompanied by the prior `GA4.md` update. Nothing is staged. The untracked EXE201 report is separate from the release.
- Repo build configuration is `npm run build` → `vite build` → `dist/` (Vite default). `vercel.json` contains an SPA rewrite and no build/output overrides. Vercel’s actual connected repository, Production Branch, Build Command, Output Directory and deployed commit remain unconfirmed. The GitHub default branch alone does not establish Vercel’s Production Branch. No linked Vercel project file or Vercel connector was available in this workspace.
- Release scope review found the two intended ID replacements in the application diff. `npm run build` and `npm run lint` passed again, with existing warnings. The fresh `dist/index.html` uses only `G-H0EZJDHCRK`. The prior helper and built SPA checks above apply to the same source changes. This recheck changed only this audit document.

### Chrome network recheck of the currently deployed build

The public document and Google tag script returned HTTP 200. The tag loaded for `G-2V5LDJ2FN5`. Collection requests sampled received HTTP 204, which is transport evidence. The audit has no evidence from the GA4 property confirming event processing.

| Action | page_view entries observed in the action window | Destination |
|---|---|---|
| Initial load | Prior audit captured one initial Home page view. The recheck's short initial window captured a scroll event and zero page views. | Old stream |
| Home → Features | 2 entries, `/` and `/features` | G-2V5LDJ2FN5 |
| Features → Home | 2 entries, `/features` and `/` | G-2V5LDJ2FN5 |
| Browser Back to Features | 2 entries, `/` and `/features` | G-2V5LDJ2FN5 |

Counts above are observed event entries by time window, including batched payloads. A prior-path entry in a later window may reflect delayed dispatch, so this trace does not prove that Enhanced Measurement caused each extra entry. The observed sequence requires a one-hit-per-transition check after release. No request to the official ID was observed. Home and Features navigation worked. Login and Register returned HTTP 200 and rendered their forms. Privacy and Terms returned HTTP 200 and rendered their headings. Chrome recorded no uncaught JavaScript errors in these samples. Credential submission and the corrected live build have yet to be tested.

### Approval and verification gates

1. In the Vercel project assigned to `www.sclub.io.vn`, verify the connected repository and **Settings → Git → Production Branch**, then compare the live deployment’s Git revision and Build and Deployment settings with the repo values above.
2. If Vercel confirms `origin/main` is the production source, the exact proposed release is to stage only `index.html` and `GA4.md`, commit the GA4 destination correction, then run `git push origin main` after explicit authorization. If the project uses a different branch or requires a PR, confirm that path and authorize its push or merge separately. No commit, push, merge, deployment or settings change was performed in this recheck.
3. After deployment, repeat the initial load, Home → Features → Home and Back trace on the official hostname, allowing queued requests to flush and correlating each hit with its page location. Verify HTTP success for the tag, only `G-H0EZJDHCRK` as the collection destination, and one page view per transition. Repeat public page checks and use an authorized test account if end-to-end sign-in evidence is required.
4. In **GA4 Admin → Data Streams → sclub**, verify `G-H0EZJDHCRK` and inspect Enhanced Measurement → Page views → browser-history tracking plus Google tag destinations. If browser-history tracking duplicates manual views, disable only that option with authorized GA4 access. Connect Tag Assistant to the final www URL and cross-check the same device and page sequence in DebugView. Tag Assistant and property-level DebugView confirmation are pending.

**EXE201 readiness:** The local release candidate is ready for the authorized publication step. Production is still on the old stream and is not ready for official-stream evidence collection. The current trace can document the pre-release destination and observed navigation counts, with the sampling caveat above. Official-stream receipt and reporting counts remain unverified.
