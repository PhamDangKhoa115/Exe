import API from './api';

async function request(operation) {
  const token = localStorage.getItem('token');
  try { return (await operation()).data; }
  catch (error) {
    if (localStorage.getItem('token') === token && [401, 403].includes(error.response?.status)) window.dispatchEvent(new CustomEvent('sclub-admin-access', { detail: { status: error.response.status } }));
    throw error;
  }
}
export function getAdminDashboard(signal) { return request(() => API.get('/api/admin/dashboard/overview', { signal })); }
export function getAdminAnalytics(days = 30, signal) {
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Days must be between 1 and 365.');
  return request(() => API.get('/api/admin/analytics', { params: { days }, signal }));
}
export function getAdminUsers(filters = {}, signal) { return request(() => API.get('/api/admin/users', { params: filters, signal })); }
export function getAdminClubs(filters = {}, signal) { return request(() => API.get('/api/admin/clubs', { params: filters, signal })); }
export function getAdminFeedbacks({ rating, page = 0, size = 20 } = {}, signal) {
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > 100 || (rating != null && (!Number.isInteger(rating) || rating < 1 || rating > 5))) throw new Error('Invalid feedback filters.');
  return request(() => API.get('/api/admin/feedbacks', { params: { rating, page, size }, signal }));
}
export function getAdminFeedbackSummary(signal) { return request(() => API.get('/api/admin/feedbacks/summary', { signal })); }
export function deleteAdminFeedback(id) { return request(() => API.delete(`/api/admin/feedbacks/${encodeURIComponent(id)}`)); }
