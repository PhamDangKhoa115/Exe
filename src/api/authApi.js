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
export const loginWithGoogle = async ({
  googleId,
  email,
  fullName,
  avatarUrl,
}) => {
  const res = await API.post("/api/auth/google", {
    googleId,
    email,
    fullName,
    avatarUrl,
  });

  return res.data;
};
