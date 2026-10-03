import API from "./api";
function requiredId(key) {
  const id = Number(localStorage.getItem(key));
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Không tìm thấy thông tin người dùng hoặc câu lạc bộ.");
  return id;
}
export async function getPackages() { return (await API.get("/api/packages")).data; }
export async function checkPaymentPermission() {
  return (await API.get("/api/payments/check-permission", { params: { clubId: requiredId("selectedClubId"), userId: requiredId("userId") } })).data;
}
export async function createCheckout(packageId) {
  return (await API.post("/api/payments/create-checkout", { packageId, clubId: requiredId("selectedClubId"), userId: requiredId("userId") })).data;
}
export async function getPaymentOrder(orderCode, signal) {
  return (await API.get(`/api/payments/order/${encodeURIComponent(orderCode)}`, { signal })).data;
}
export async function cancelPaymentOrder(orderCode) {
  return (await API.post(`/api/payments/order/${encodeURIComponent(orderCode)}/cancel`)).data;
}
export async function getClubSubscription() {
  return (await API.get(`/api/payments/club/${requiredId("selectedClubId")}/subscription`)).data;
}
