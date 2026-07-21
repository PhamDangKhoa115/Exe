import API from "./api";

const getAuthParams = () => {
  const userId = localStorage.getItem("userId");
  const clubId = localStorage.getItem("selectedClubId");

  if (!userId) {
    throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
  }

  if (!clubId) {
    throw new Error("Chưa chọn câu lạc bộ.");
  }

  return {
    userId: Number(userId),
    clubId: Number(clubId),
  };
};

export const getGoogleForms = async () => {
  const response = await API.get("/api/google/forms/list", {
    params: getAuthParams(),
  });

  return response.data;
};

export const createGoogleForm = async ({ title, type }) => {
  const response = await API.post("/api/google/forms/create", null, {
    params: {
      ...getAuthParams(),
      title,
      type,
    },
  });

  return response.data;
};

export const getGoogleFormDetail = async (formId) => {
  const response = await API.get(`/api/google/forms/${formId}`, {
    params: getAuthParams(),
  });

  return response.data;
};

export const getGoogleFormResponses = async (formId) => {
  const response = await API.get(`/api/google/forms/${formId}/responses`, {
    params: getAuthParams(),
  });

  return response.data;
};

export const addGoogleFormQuestion = async (formId, question) => {
  const response = await API.post(
    `/api/google/forms/${formId}/questions`,
    question,
    {
      params: getAuthParams(),
    },
  );

  return response.data;
};

export const deleteGoogleForm = async (formId) => {
  const response = await API.delete(`/api/google/forms/${formId}`, {
    params: getAuthParams(),
  });

  return response.data;
};
