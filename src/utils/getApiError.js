export function getApiError(error, fallback = "Something went wrong") {
  const data = error.response?.data;

  if (typeof data === "string") return data;

  return data?.message || data?.error || data?.detail || fallback;
}
