import API from './api';

function context(override) {
  const clubId = override?.clubId ?? localStorage.getItem('selectedClubId');
  const userId = override?.userId ?? localStorage.getItem('userId');
  if (!clubId || !userId) throw new Error('Please login and select a club first.');
  return { clubId: Number(clubId), userId: Number(userId) };
}
export async function getGoogleClubPermissions() {
  const { clubId, userId } = context();
  return (await API.get(`/api/google/permissions/club/${clubId}`, { params: { userId } })).data;
}
export async function getGoogleMemberPermissions(targetUserId, requestContext) {
  const { clubId, userId } = context(requestContext);
  return (await API.get(`/api/google/permissions/club/${clubId}/user/${targetUserId}`, { params: { userId } })).data;
}
// Body keys follow the Swagger request schema; callers must use confirmed revoke semantics.
export async function updateGooglePermissions(scope, operation, targetUserId, permissions, requestContext) {
  if (!['sheets', 'forms', 'combined'].includes(scope) || !['grant', 'revoke'].includes(operation)) throw new Error('Unsupported permission operation.');
  const path = scope === 'combined' ? operation : `${scope}/${operation}`;
  return (await API.post(`/api/google/permissions/${path}`, permissions, { params: { ...context(requestContext), targetUserId } })).data;
}
