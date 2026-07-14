import API from "./api";

export const createGoogleForm = async ({ userId, title, type }) => {
  const res = await API.post("/api/google/forms/create", null, {
    params: {
      userId,
      title,
      type,
    },
  });

  return res.data;
};

export const getGoogleForms = async (userId) => {
  const res = await API.get("/api/google/forms/list", {
    params: {
      userId,
    },
  });

  return res.data;
};

export const getGoogleForm = async (formId, userId) => {
  const res = await API.get(`/api/google/forms/${formId}`, {
    params: {
      userId,
    },
  });

  return res.data;
};

export const deleteGoogleForm = async (formId, userId) => {
  const res = await API.delete(`/api/google/forms/${formId}`, {
    params: {
      userId,
    },
  });

  return res.data;
};

export const getGoogleFormResponses = async (formId, userId) => {
  const res = await API.get(`/api/google/forms/${formId}/responses`, {
    params: {
      userId,
    },
  });

  return res.data;
};
