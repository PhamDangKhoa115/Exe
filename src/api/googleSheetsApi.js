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

// Lấy danh sách Sheet của CLB
export const getSpreadsheets = async () => {
  const response = await API.get("/api/google/sheets/list", {
    params: getAuthParams(),
  });

  return response.data;
};

// Tạo Sheet
export const createSpreadsheet = async ({ title, type }) => {
  const response = await API.post("/api/google/sheets/create", null, {
    params: {
      ...getAuthParams(),
      title,
      type,
    },
  });

  return response.data;
};

// Đọc dữ liệu Sheet
export const getSpreadsheetValues = async ({ spreadsheetId, range }) => {
  const response = await API.get("/api/google/sheets/values", {
    params: {
      ...getAuthParams(),
      spreadsheetId,
      range,
    },
  });

  return response.data;
};

// Ghi dữ liệu Sheet
export const updateSpreadsheetValues = async ({
  spreadsheetId,
  range,
  values,
}) => {
  const response = await API.put("/api/google/sheets/values", values, {
    params: {
      ...getAuthParams(),
      spreadsheetId,
      range,
    },
  });

  return response.data;
};

// Xóa Sheet
export const deleteSpreadsheet = async (spreadsheetId) => {
  const response = await API.delete(`/api/google/sheets/${spreadsheetId}`, {
    params: getAuthParams(),
  });

  return response.data;
};
