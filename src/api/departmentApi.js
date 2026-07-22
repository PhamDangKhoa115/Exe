import API from "./api";

function getRequiredContext() {
  const clubId = localStorage.getItem("selectedClubId");
  const userId = localStorage.getItem("userId");

  if (!clubId) {
    throw new Error("Vui lòng chọn câu lạc bộ trước.");
  }

  if (!userId) {
    throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
  }

  return {
    clubId: Number(clubId),
    userId: Number(userId),
  };
}

function extractData(response) {
  return response?.data;
}

/**
 * GET /api/clubs/{clubId}/departments
 */
export async function getDepartments() {
  const { clubId, userId } = getRequiredContext();

  const response = await API.get(`/api/clubs/${clubId}/departments`, {
    params: {
      requesterUserId: userId,
    },
  });

  return extractData(response);
}

/**
 * POST /api/clubs/{clubId}/departments
 */
export async function createDepartment(data) {
  const { clubId, userId } = getRequiredContext();

  const response = await API.post(
    `/api/clubs/${clubId}/departments`,
    {
      name: data.name,
      description: data.description,
      headMemberId: data.headMemberId || null,
    },
    {
      params: {
        requesterUserId: userId,
      },
    },
  );

  return extractData(response);
}

/**
 * PUT /api/clubs/{clubId}/departments/{departmentId}
 */
export async function updateDepartment(departmentId, data) {
  const { clubId, userId } = getRequiredContext();

  const response = await API.put(
    `/api/clubs/${clubId}/departments/${departmentId}`,
    {
      name: data.name,
      description: data.description,
      headMemberId: data.headMemberId || null,
    },
    {
      params: {
        requesterUserId: userId,
      },
    },
  );

  return extractData(response);
}

/**
 * GET /api/clubs/{clubId}/departments/{departmentId}/chat-access
 */
export async function getDepartmentChatAccess(departmentId) {
  const { clubId, userId } = getRequiredContext();

  const response = await API.get(
    `/api/clubs/${clubId}/departments/${departmentId}/chat-access`,
    {
      params: {
        userId,
      },
    },
  );

  return extractData(response);
}
