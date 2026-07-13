import API from "./api";

export const connectGoogle = async () => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    alert("Bạn cần đăng nhập trước");
    window.location.href = "/login";
    return;
  }

  const res = await API.get(`/api/google/connect?userId=${userId}`);

  window.location.href = res.data.url;
};
