import API from './api';

function root(clubId) {
  if (!Number.isSafeInteger(Number(clubId)) || Number(clubId) <= 0) throw new Error('Please select a club.');
  return `/api/clubs/${Number(clubId)}/fund-campaigns`;
}
function validId(id) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error('Invalid campaign or contribution ID.');
  return Number(id);
}
export async function getFundCampaigns(clubId, signal) {
  return (await API.get(root(clubId), { signal })).data;
}
export async function getFundCampaignDetail(clubId, campaignId, signal) {
  return (await API.get(`${root(clubId)}/${validId(campaignId)}`, { signal })).data;
}
export async function getFundContributions(clubId, campaignId, signal) {
  return (await API.get(`${root(clubId)}/${validId(campaignId)}/contributions`, { signal })).data;
}
export async function createFundCampaign(clubId, body, signal) {
  if (typeof body?.title !== 'string' || !body.title.trim() || typeof body.bankAccountInfo !== 'string' || !body.bankAccountInfo.trim() || !Number.isFinite(body.amountPerMember) || body.amountPerMember <= 0 || !Number.isFinite(new Date(body.deadline).getTime()) || new Date(body.deadline).getTime() <= Date.now() || typeof body.description !== 'string') throw new Error('Enter a title, positive amount, future deadline, bank account information and description.');
  return (await API.post(root(clubId), body, { signal })).data;
}
export async function quickTickContribution(clubId, contribId, isPaid = true, signal) {
  if (typeof isPaid !== 'boolean') throw new Error('isPaid must be boolean.');
  return (await API.patch(`${root(clubId)}/contributions/${validId(contribId)}/quick-tick`, null, { params: { isPaid }, signal })).data;
}
export async function submitFundProof(clubId, campaignId, proofUrl, signal) {
  const url = new URL(proofUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Please enter a valid HTTP/HTTPS proof URL.');
  return (await API.post(`${root(clubId)}/${validId(campaignId)}/proof`, null, { params: { proofUrl }, signal })).data;
}
export async function remindFundCampaign(clubId, campaignId, signal) {
  return (await API.post(`${root(clubId)}/${validId(campaignId)}/remind`, null, { signal })).data;
}
