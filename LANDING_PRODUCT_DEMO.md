# Landing product demo

The Hero illustration is now an isolated client-side demo. Its fictional data never reads account state, imports authenticated workspaces, calls APIs or writes storage.

- Seven scenes: document typing/format/save, spreadsheet cell entry/total, chat typing/send/delivery, shared-layout Kanban movement, calendar event creation/save, financial chart/contribution/balance, registration form creation/preview.
- A single 100ms interval advances deterministic scene progress and rotates features every 7.5 seconds. Manual selection resets progress; Pause/Resume retains it. The interval and observers/listeners are cleaned up on unmount.
- IntersectionObserver and document visibility stop playback when hidden. Reduced motion renders each scene's completed state and disables continuous playback. Navigation uses native buttons with pressed states and visible keyboard focus. Animated narration is intentionally not announced on every tick.
- Desktop uses a feature sidebar; mobile uses a scrollable horizontal selector. Scene height is reserved to avoid layout shifts. Styling is component-scoped. The existing Hero badge has one narrow-screen wrapping fix.
- No dependencies were added. Existing Motion and Lucide are reused. Marketing content, CTA destination, React Bits effects and other landing sections are retained.

## Browser test

Start Vite on port 5176, then run `node --test tests/landing-product-demo.test.mjs`. Override `DEMO_TEST_URL`, `PLAYWRIGHT_MODULE` and `CHROME_PATH` to use another local server/runtime. Optional `DEMO_SCREENSHOTS` sets the screenshot output directory.

The browser test blocks external requests and all APIs, checks the full playback loop and feature actions in real time, manual navigation, Pause/Resume, viewport and document-visibility pausing, reduced-motion static states, all seven scenes at 320/375/390/768/1024/1440/1920px, horizontal overflow, unchanged landing sections/CTA and navigation cleanup. Screenshots cover desktop, 768px and 390px. This is fictional UI simulation, not a test of real Google/Trello/Finance services.

## Verification results

- `npm run build`: PASS. Existing >500 kB bundle warning remains; this change adds approximately 13 kB of JavaScript and 12 kB of CSS before gzip to the existing bundle, with no added dependency.
- `npm run lint`: PASS. Existing warnings outside the changed files remain.
- Chrome browser test: PASS, including all seven scene sequences, automatic wraparound, manual selection, pause/resume, viewport/document visibility, reduced motion, CTA navigation/unmount, no JavaScript errors and zero API requests.
- All seven scenes were checked at 320, 375, 390, 768, 1024, 1440 and 1920px without horizontal page/demo overflow. Desktop, tablet and mobile screenshots were inspected. Narrow-screen fixes were limited to wrapping the existing badge/contact email and constraining the existing Problem card.
- Browser verification used local Chrome, not Safari/Firefox or physical mobile devices. Production integrations were deliberately not invoked.
