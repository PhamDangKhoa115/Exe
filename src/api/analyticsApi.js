import API from './api';

export function trackAnalyticsEvent(body) {
  return API.post('/api/analytics/events', body, {
    adapter: 'fetch',
    withCredentials: false,
    fetchOptions: { referrerPolicy: 'no-referrer' },
    timeout: 5000,
    headers: { Authorization: false },
  });
}
