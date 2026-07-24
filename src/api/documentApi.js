import API from "./api";

function getRequiredContext() {
  const userId = localStorage.getItem("userId");
  const clubId = localStorage.getItem("selectedClubId");

  if (!userId) {
    throw new Error("Please login first.");
  }

  if (!clubId) {
    throw new Error("Please select a club first.");
  }

  return {
    userId: Number(userId),
    clubId: Number(clubId),
  };
}

function extractData(response) {
  return response?.data;
}

/**
 * POST /api/documents
 *
 * Backend mới nhận dữ liệu bằng query parameters,
 * không gửi request body.
 */
export async function createDocument({ title, eventId, category, type }) {
  const { userId, clubId } = getRequiredContext();

  if (!title?.trim()) {
    throw new Error("Please enter a document title.");
  }

  if (!type) {
    throw new Error("Please select a document type.");
  }

  const params = {
    userId,
    clubId,
    title: title.trim(),
    type,
  };

  if (eventId) {
    params.eventId = Number(eventId);
  }

  if (category) {
    params.category = category;
  }

  const response = await API.post("/api/documents", null, {
    params,
  });

  return extractData(response);
}

/**
 * GET /api/documents/club/{clubId}
 */
export async function getClubDocuments({
  search = "",
  category = "",
  type = "",
  sortBy = "date",
  sortDir = "desc",
} = {}) {
  const { userId, clubId } = getRequiredContext();

  const params = {
    userId,
    sortBy,
    sortDir,
  };

  if (search?.trim()) {
    params.search = search.trim();
  }

  if (category) {
    params.category = category;
  }

  if (type) {
    params.type = type;
  }

  const response = await API.get(`/api/documents/club/${clubId}`, {
    params,
  });

  return extractData(response);
}

/**
 * GET /api/documents/{id}
 */
export async function getDocumentDetail(id) {
  const { userId } = getRequiredContext();

  const response = await API.get(`/api/documents/${id}`, {
    params: {
      userId,
    },
  });

  return extractData(response);
}

/**
 * POST /api/documents/{id}/sync
 */
export async function syncDocument(id) {
  const { userId } = getRequiredContext();

  const response = await API.post(`/api/documents/${id}/sync`, null, {
    params: {
      userId,
    },
  });

  return extractData(response);
}

/**
 * POST /api/documents/{id}/share
 */
export async function shareDocument(id, role = "reader") {
  const { userId } = getRequiredContext();

  const allowedRoles = ["reader", "commenter", "writer"];

  if (!allowedRoles.includes(role)) {
    throw new Error("Invalid sharing role.");
  }

  const response = await API.post(`/api/documents/${id}/share`, null, {
    params: {
      role,
      userId,
    },
  });

  return extractData(response);
}

/**
 * GET /api/documents/{id}/revisions
 */
export async function getDocumentRevisions(id) {
  const { userId } = getRequiredContext();

  const response = await API.get(`/api/documents/${id}/revisions`, {
    params: {
      userId,
    },
  });

  return extractData(response);
}

/**
 * GET /api/documents/types
 */
export async function getDocumentTypes() {
  const response = await API.get("/api/documents/types");

  return extractData(response);
}

/**
 * GET /api/documents/categories
 */
export async function getDocumentCategories() {
  const response = await API.get("/api/documents/categories");

  return extractData(response);
}
export const deleteDocument = async (id) => {
  const userId = localStorage.getItem("userId");

  const response = await API.delete(`/api/documents/${id}`, {
    params: {
      userId,
    },
  });

  return response.data;
};
