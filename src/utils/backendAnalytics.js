import { trackAnalyticsEvent } from '../api/analyticsApi';

const campaignFields = {
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
};
const sessionKey = 'sclub_analytics_session';
let sessionId;
let attribution = {};
let lastPublicPath;
const trackedCheckouts = new Set();

function getSessionId() {
  if (sessionId) return sessionId;
  try {
    const stored = sessionStorage.getItem(sessionKey);
    if (stored && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)) {
      sessionId = stored;
      return sessionId;
    }
  } catch { /* Use an in-memory session when storage is unavailable. */ }
  sessionId = globalThis.crypto?.randomUUID?.();
  if (sessionId) {
    try { sessionStorage.setItem(sessionKey, sessionId); } catch { /* In-memory fallback. */ }
  }
  return sessionId;
}

function referrerOrigin() {
  try {
    const url = new URL(document.referrer);
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.origin;
  } catch { /* No usable referrer. */ }
  return '';
}

function send(eventName, path) {
  try {
    const id = getSessionId();
    if (!id) return;
    void trackAnalyticsEvent({ sessionId: id, eventName, path, referrer: referrerOrigin(), ...attribution })
      .catch(() => { /* Optional analytics must not interrupt the application. */ });
  } catch { /* Optional analytics must not interrupt the application. */ }
}

export function trackPublicNavigation(pathname, search) {
  if (pathname !== '/' && pathname !== '/features') {
    lastPublicPath = undefined;
    return;
  }
  const params = new URLSearchParams(search);
  const campaign = {};
  for (const [param, field] of Object.entries(campaignFields)) {
    const value = params.get(param)?.trim();
    // Accept short campaign slugs. Exclude contact strings, URLs and numeric IDs.
    if (value && /^[a-z][a-z0-9_-]{0,63}$/i.test(value)) campaign[field] = value;
  }
  if (Object.keys(campaign).length) attribution = campaign;
  if (lastPublicPath === pathname) return;
  lastPublicPath = pathname;
  send('page_view', pathname);
}

export function trackPricingView() {
  send('pricing_view', '/dashboard');
}

export function trackCheckoutStart(orderCode) {
  if (!/^\d+$/.test(String(orderCode ?? ''))) return;
  const key = String(orderCode);
  if (trackedCheckouts.has(key)) return;
  trackedCheckouts.add(key);
  send('checkout_start', '/dashboard');
}
