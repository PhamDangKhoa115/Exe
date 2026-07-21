import API from "./api";

export const getClubDocuments = async ({
  clubId,
  userId,
  search = "",
  type = "",
  sortBy = "date",
  sortDir = "desc",
}) => {
  const res = await API.get(`/api/documents/club/${clubId}`, {
    params: {
      userId,
      clubId,
      search: search || undefined,
      type: type || undefined,
      sortBy,
      sortDir,
    },
  });

  return res.data;
};

export const createDocument = async (data, userId) => {
  const res = await API.post("/api/documents", data, {
    params: {
      userId,
    },
  });

  return res.data;
};

export const getDocumentDetail = async (id, userId) => {
  const res = await API.get(`/api/documents/${id}`, {
    params: {
      userId,
    },
  });

  return res.data;
};

export const syncDocument = async (id, userId) => {
  const res = await API.post(`/api/documents/${id}/sync`, null, {
    params: {
      userId,
    },
  });

  return res.data;
};

export const shareDocument = async (id, userId, role = "commenter") => {
  const res = await API.post(`/api/documents/${id}/share`, null, {
    params: {
      userId,
      role,
    },
  });

  return res.data;
};

export const getDocumentRevisions = async (id, userId) => {
  const res = await API.get(`/api/documents/${id}/revisions`, {
    params: {
      userId,
    },
  });

  return res.data;
};
