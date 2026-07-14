import API from "./api";

export const createSpreadsheet = async ({ userId, title, type }) => {
  const res = await API.post("/api/google/sheets/create", null, {
    params: {
      userId,
      title,
      type,
    },
  });

  return res.data;
};

export const getSpreadsheets = async (userId) => {
  const res = await API.get("/api/google/sheets/list", {
    params: {
      userId,
    },
  });

  return res.data;
};

export const deleteSpreadsheet = async (spreadsheetId, userId) => {
  const res = await API.delete(`/api/google/sheets/${spreadsheetId}`, {
    params: {
      userId,
    },
  });

  return res.data;
};
