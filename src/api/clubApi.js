import API from "./api";

function getRequiredUserId() {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    throw new Error("Please login first.");
  }

  return Number(userId);
}

function getRequiredClubId() {
  const clubId = localStorage.getItem("selectedClubId");

  if (!clubId) {
    throw new Error("Please select a club first.");
  }

  return Number(clubId);
}

function extractData(response) {
  return response?.data;
}

// ==================== CLUB ====================

export async function getAllClubs() {
  const response = await API.get("/api/clubs");

  return extractData(response);
}

export async function getUserClubs(userId = getRequiredUserId()) {
  const response = await API.get(`/api/clubs/user/${userId}`);

  return extractData(response);
}

export async function getClubDetail(clubId) {
  const response = await API.get(`/api/clubs/${clubId}`);

  return extractData(response);
}

export async function joinClub(clubId) {
  const userId = getRequiredUserId();

  const response = await API.post(`/api/clubs/${clubId}/join`, null, {
    params: {
      userId,
    },
  });

  return extractData(response);
}

// ==================== MEMBERS ====================

export async function getClubMembers(clubId = getRequiredClubId()) {
  const response = await API.get(`/api/clubs/${clubId}/members`);

  return extractData(response);
}

export async function getPendingClubMembers(clubId = getRequiredClubId()) {
  const requesterUserId = getRequiredUserId();

  const response = await API.get(`/api/clubs/${clubId}/members/pending`, {
    params: {
      requesterUserId,
    },
  });

  return extractData(response);
}

export async function updateClubMember(
  memberId,
  { role, departmentId },
  clubId = getRequiredClubId(),
) {
  const requesterUserId = getRequiredUserId();

  const params = {
    requesterUserId,
  };

  if (role) {
    params.role = role;
  }

  if (
    departmentId !== "" &&
    departmentId !== null &&
    departmentId !== undefined
  ) {
    params.departmentId = Number(departmentId);
  }

  const response = await API.put(
    `/api/clubs/${clubId}/members/${memberId}`,
    null,
    {
      params,
    },
  );

  return extractData(response);
}

export async function lockClubMember(
  memberId,
  lock,
  clubId = getRequiredClubId(),
) {
  const requesterUserId = getRequiredUserId();

  const response = await API.put(
    `/api/clubs/${clubId}/members/${memberId}/lock`,
    null,
    {
      params: {
        requesterUserId,
        lock: Boolean(lock),
      },
    },
  );

  return extractData(response);
}

export async function approveClubMember(
  memberId,
  approve,
  clubId = getRequiredClubId(),
) {
  const requesterUserId = getRequiredUserId();

  const response = await API.put(
    `/api/clubs/${clubId}/members/${memberId}/approve`,
    null,
    {
      params: {
        requesterUserId,
        approve: Boolean(approve),
      },
    },
  );

  return extractData(response);
}

export async function grantClubDeletionPermission(targetUserId, clubId = getRequiredClubId()) {
  return (await API.post(`/api/clubs/${clubId}/grant-deletion-permission`, null, { params: { userId: getRequiredUserId(), targetUserId } })).data;
}
export async function revokeClubDeletionPermission(targetUserId, clubId = getRequiredClubId()) {
  const params = { userId: getRequiredUserId() };
  if (targetUserId != null) params.targetUserId = targetUserId;
  return (await API.post(`/api/clubs/${clubId}/revoke-deletion-permission`, null, { params })).data;
}
export async function getClubDeletionPermissions(clubId = getRequiredClubId()) {
  return (await API.get(`/api/clubs/${clubId}/deletion-permissions`)).data;
}
export async function transferClubPresident(targetMemberId, clubId = getRequiredClubId()) {
  return (await API.put(`/api/clubs/${clubId}/transfer-president`, null, { params: { requesterUserId: getRequiredUserId(), targetMemberId } })).data;
}
