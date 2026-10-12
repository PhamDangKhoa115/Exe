import API from './api';

function root(clubId) {
  if (!Number.isSafeInteger(Number(clubId)) || Number(clubId) <= 0) throw new Error('Please select a club.');
  return `/api/clubs/${Number(clubId)}/finance`;
}
export async function getFinanceSummary(clubId, signal) {
  return (await API.get(`${root(clubId)}/summary`, { signal })).data;
}
export async function getFinanceOverview(clubId, periodMonths = 6, signal) {
  return (await API.get(`${root(clubId)}/overview-chart`, { params: { periodMonths }, signal })).data;
}
export async function getFinanceCategories(clubId, signal) {
  return (await API.get(`${root(clubId)}/category-breakdown`, { signal })).data;
}
export async function getFinanceTransactions(clubId, filters, signal) {
  return (await API.get(`${root(clubId)}/transactions`, { params: filters, signal })).data;
}
export async function createFinanceTransaction(clubId, body) {
  return (await API.post(`${root(clubId)}/transactions`, body)).data;
}
export async function updateFinanceTransaction(clubId, id, body) {
  return (await API.put(`${root(clubId)}/transactions/${encodeURIComponent(id)}`, body)).data;
}
export async function getFinanceTransaction(clubId, id, signal) {
  return (await API.get(`${root(clubId)}/transactions/${encodeURIComponent(id)}`, { signal })).data;
}
export async function updateFinanceTransactionStatus(clubId, id, status) {
  return (await API.patch(`${root(clubId)}/transactions/${encodeURIComponent(id)}/status`, null, { params: { status } })).data;
}
// Contract exists, but the UI must wait for confirmed deletion authorization.
export async function deleteFinanceTransaction(clubId, id) {
  return (await API.delete(`${root(clubId)}/transactions/${encodeURIComponent(id)}`)).data;
}
export async function exportFinance(clubId) {
  const response = await API.get(`${root(clubId)}/export`, { responseType: 'blob' });
  const type = String(response.headers['content-type'] || '').split(';')[0].trim();
  const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/octet-stream'];
  if (!allowed.includes(type)) throw new Error('Export API has not returned a verified Excel file. JSON/text responses cannot be downloaded as Excel.');
  const bytes = new Uint8Array(await response.data.slice(0, 8).arrayBuffer());
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4;
  const ole = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((byte, i) => bytes[i] === byte);
  if (!zip && !ole) throw new Error('Export response is not an Excel file.');
  const disposition = response.headers['content-disposition'] || '';
  let filename = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (filename) { try { filename = decodeURIComponent(filename); } catch { filename = null; } }
  filename ||= disposition.match(/filename="([^"]+)"/i)?.[1];
  filename = (filename || `finance-${clubId}.${zip ? 'xlsx' : 'xls'}`).split(/[\\/]/).at(-1).split('').filter(char => char.charCodeAt(0) >= 32).join('');
  return { blob: response.data, filename };
}
