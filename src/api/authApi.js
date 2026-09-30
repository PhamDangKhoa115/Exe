import API from "./api";

export const login = async (emailOrUsername, password) => {
  const res = await API.post("/api/auth/login", {
    emailOrUsername,
    password,
  });

  return res.data;
};
export async function forgotPassword(email) {
  const response = await API.post("/api/auth/forgot-password", {
    email,
  });

  return response.data;
}

export async function resetPassword({
  email,
  token,
  newPassword,
  confirmPassword,
}) {
  const response = await API.post("/api/auth/reset-password", {
    email,
    token,
    newPassword,
    confirmPassword,
  });

  return response.data;
}
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
