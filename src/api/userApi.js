import API from "./api";

export const getUserProfile = async (userId, signal) => {
  const res = await API.get(`/api/users/${userId}`, { signal });
  return res.data;
};

export const updateUserProfile = async (userId, data) => {
  const res = await API.put(`/api/users/${userId}`, data);
  return res.data;
};

export const changePassword = async (userId, data) => {
  const res = await API.put(`/api/users/${userId}/change-password`, data);
  return res.data;
};
