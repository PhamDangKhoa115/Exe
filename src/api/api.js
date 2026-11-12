import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    if (config.headers.get("Authorization") === false) return config;
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default API;
