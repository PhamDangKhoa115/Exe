# GA4 setup

Measurement ID: G-2V5LDJ2FN5. No npm dependency is added.

Before production validation, open this GA4 web data stream and turn off
Enhanced Measurement (including automatic Page views / browser-history changes).
Manual React Router tracking owns page_view. send_page_view:false only prevents
config's page view; it does not disable Enhanced Measurement history events.
Automatic measurement could also collect raw URLs outside this app's allowlist.
Reference: https://developers.google.com/analytics/devguides/collection/ga4/views

The app sends pathname-only locations/referrers, never query strings/fragments.
Event params are allowlisted. Auth events run only after successful API handling.
Both Google buttons use the existing login API; neither proves a new registration.
Only email registration emits user_register.

view_club runs when a selected club is accessed, deduped across internal navigation.
Payment events use real orderCode/amount. complete_payment is inserted only after
GET order verification (callback, polling, cancellation race), never checkout's
PAID response alone. A sessionStorage flag per event/order plus memory fallback
prevents repeats during polling, rerender and reload. Blocked storage cannot
provide reload deduplication; blocked gtag or exceptions never interrupt flows.

Confirm page_view and the five custom events in GA4 Realtime/DebugView after deploy.
Mark the desired custom events (for example complete_payment) as key events in GA4.
Code changes here do not deploy Vercel or modify GA4 account settings.
