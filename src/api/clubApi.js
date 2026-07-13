import api from "./api";

export const getUserClubs = (userId) => {
  return api.get(`/api/clubs/user/${userId}`);
};

export const createClub = (data) => {
  return api.post("/api/clubs", data);
};

export const getClubById = (clubId) => {
  return api.get(`/api/clubs/${clubId}`);
};
