import API from "./api";

export const login = async (emailOrUsername, password) => {
  const res = await API.post("/api/auth/login", {
    emailOrUsername,
    password,
  });

  return res.data;
};

export const register = async (data) => {
  const res = await API.post("/api/auth/register", data);
  return res.data;
};

export const logout = async () => {
  const res = await API.post("/api/auth/logout");
  return res.data;
};
