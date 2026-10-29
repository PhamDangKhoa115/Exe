# Public Features and shared marketing UI

## Scope

- Public `/features` route outside authentication and club guards, with hero, 12 feature cards, public workflow explanations, three onboarding steps and the shared CTA/footer.
- Shared PublicNavbar keeps the existing public styling, adds Home/Features active links and preserves Login/Sign Up routes. The Landing Hero, product demo and existing React Bits effects remain in place.
- Features reflect inspected Member/Department/Calendar/Google Docs/Sheets/Forms/Trello/Department Chat/Finance/Fund Campaign/Notifications/Google Permission code. Explanations state that role permissions govern access; no backend behavior was changed.
- ChromaGrid JavaScript/CSS is adapted from the verified upstream React Bits source: https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/ChromaGrid. The existing React Bits license applies. Props include items, columns, minCardWidth, gap, radius, softness, reveal, theme, cardRadius, frame and showInfo.
- Local React/SVG mini-previews replace stock images. Semantic H3/paragraph copy stays readable without hover; cards link to one of three public explanations in the same page. The cursor-following wash/border and moderate viewport stagger respect keyboard focus, touch and reduced motion. The settling rAF loop stops when hidden and is cleaned up with listeners/observers.
- Shared MarketingCTA replaces the unverified club-count claim with benefit-focused copy. Purple gradient, soft animated orbs, existing SpotlightCard, staggered entrance and StarBorder button lead to `/register`. CSS background animation pauses outside the viewport/hidden document and is disabled under reduced motion.
- Shared Footer includes verified Product/Account/Legal links, functional support mailto, dynamic year, responsive columns and no placeholder social links. It is used by Landing and Features.
- Features title, description and single canonical reuse the existing Privacy page metadata lifecycle pattern. Navigation restores/removes owned metadata. No existing sitemap was found. Metadata is client-rendered in the existing SPA; server rendering was not introduced.

## Files

Created:
- src/pages/FeaturesPage.jsx / FeaturesPage.css
- src/components/PublicNavbar.jsx
- src/components/MarketingCTA.jsx
- src/components/PublicMarketing.css
- src/components/reactbits/ChromaGrid.jsx / ChromaGrid.css
- tests/public-marketing.test.mjs
- PUBLIC_MARKETING.md

Modified:
- src/App.jsx: new public route only; existing routes/guards retained.
- src/pages/LandingPage.jsx: replace inline public navbar with shared component only.
- src/components/Footer.jsx: requested shared CTA/footer upgrade.
- src/components/reactbits/README.md: source attribution/adaptations.

No dependencies, environment values, authentication storage, backend endpoints, permissions or application business rules were changed.

## Verification

Run Vite on port 5176, then `node --test tests/public-marketing.test.mjs`. Override MARKETING_TEST_URL, PLAYWRIGHT_MODULE and CHROME_PATH to use an existing local runtime; MARKETING_SCREENSHOTS optionally specifies a screenshot directory. No package installation is required in the current environment.

The test blocks API and external requests. Checks: anonymous access, exact metadata, canonical cleanup on Home/Privacy/Features navigation, all 12 cards and public anchor targets, pointer spotlight, keyboard focus, CTA color/link, footer routes/mailto/year, actual internal navigation, shared component counts, reduced-motion states, and both pages at 320/375/390/768/1024/1440/1920px without horizontal overflow. Screenshots cover desktop, mobile and tablet. The existing LandingProductDemo regression test is run separately.

Browser verification is local Chrome only. Safari/Firefox, physical devices and production deployment are not verified. Existing large-bundle and unrelated lint warnings remain.

### Final results

- Build: PASS, with the existing large-chunk warning.
- Lint: PASS, with existing warnings outside this task's changed files. Removing obsolete Footer imports also removes its unused-import warnings.
- Public marketing browser test: PASS. LandingProductDemo regression browser test: PASS.
- Screenshots inspected: Features desktop/mobile/tablet and the upgraded CTA. The CTA heading's specificity was corrected after visual QA so it stays white on both public pages.
- No API requests or JavaScript page errors occurred during browser verification. No production operations were performed.
- Unrelated LoginPage changes in the working tree were preserved; this task does not edit authentication.
