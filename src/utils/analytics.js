const allowed = {
  page_view: ['page_path', 'page_title'],
  user_login: ['method'], user_register: ['method'],
  view_club: ['club_id', 'club_name'],
  initiate_transaction: ['transaction_id', 'value', 'currency'],
  complete_payment: ['transaction_id', 'value', 'currency'],
};
const sent = new Set();
let lastPage = null;
let lastClub = null;

export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function' || !allowed[eventName]) return false;
    const payload = Object.fromEntries(allowed[eventName].filter(key => params[key] !== undefined).map(key => [key, params[key]]));
    // Never send callback/search query strings, fragments or referrer credentials.
    payload.page_location = window.location.origin + window.location.pathname;
    payload.page_referrer = lastPage || '';
    window.gtag('event', eventName, payload);
    return true;
  } catch { return false; }
}

export function trackPageView(pathname) {
  try {
    if (window.location.pathname !== pathname) return;
    const location = window.location.origin + pathname;
    if (location === lastPage) return;
    if (trackEvent('page_view', { page_path: pathname, page_title: document.title })) lastPage = location;
  } catch { /* Optional analytics. */ }
}

export function trackClubVisit(active = true) {
  try {
    if (!active) { lastClub = null; return; }
    const id = window.localStorage.getItem('selectedClubId');
    const name = window.localStorage.getItem('selectedClubName');
    if (!id || !window.localStorage.getItem('token')) { lastClub = null; return; }
    if (id === lastClub) return;
    if (trackEvent('view_club', { club_id: id, club_name: name || undefined })) lastClub = id;
  } catch { /* Storage may be blocked. */ }
}

export function trackPaymentEvent(eventName, order) {
  try {
    if (!['initiate_transaction', 'complete_payment'].includes(eventName)) return;
    if (eventName === 'complete_payment' && order?.status !== 'PAID') return;
    if (!/^\d+$/.test(String(order?.orderCode ?? '')) || order?.amount == null || !Number.isFinite(Number(order.amount))) return;
    const key = `ga_${eventName}_${order.orderCode}`;
    if (sent.has(key)) return;
    try { if (window.sessionStorage.getItem(key)) return; } catch { /* Memory fallback. */ }
    if (!trackEvent(eventName, { transaction_id: String(order.orderCode), value: Number(order.amount), currency: 'VND' })) return;
    sent.add(key);
    try { window.sessionStorage.setItem(key, '1'); } catch { /* Memory fallback. */ }
  } catch { /* Payment must continue when analytics fails. */ }
}
