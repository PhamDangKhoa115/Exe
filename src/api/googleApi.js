import API from "./api";

const getStoredUserId = () => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    throw new Error("please login first. ");
  }

  return Number(userId);
};

export const connectGoogle = async () => {
  const userId = getStoredUserId();

  const response = await API.get("/api/google/connect", {
    params: {
      userId,
    },
  });

  const googleUrl =
    response.data?.url || response.data?.authUrl || response.data;

  if (!googleUrl || typeof googleUrl !== "string") {
    throw new Error("Backend does not return Google connection URL.");
  }

  window.location.href = googleUrl;

  return response.data;
};

export const getGoogleConnectionStatus = async () => {
  const userId = getStoredUserId();

  const response = await API.get("/api/google/status", {
    params: {
      userId,
    },
  });

  return response.data;
};
