import API from "./api";

const getStoredUserId = () => {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    throw new Error("Please login first.");
  }

  return Number(userId);
};

const getStoredClubId = () => {
  const clubId = localStorage.getItem("selectedClubId");

  if (!clubId) {
    throw new Error("Please select a club first.");
  }

  return Number(clubId);
};

export const getCalendarEvents = async ({
  clubId = getStoredClubId(),
  viewType = "MONTH",
  date = new Date().toISOString().slice(0, 10),
} = {}) => {
  const response = await API.get("/api/events/calendar", {
    params: {
      clubId,
      viewType,
      date,
    },
  });

  return response.data;
};

export const getClubEvents = async (clubId = getStoredClubId()) => {
  const response = await API.get(`/api/events/club/${clubId}`);

  return response.data;
};

export const getEventDetail = async (id) => {
  const response = await API.get(`/api/events/${id}`);

  return response.data;
};

export const createEvent = async (
  data,
  userId = getStoredUserId(),
  clubId = getStoredClubId(),
) => {
  const response = await API.post("/api/events", data, {
    params: {
      userId,
      clubId,
    },
  });

  return response.data;
};

export const updateEvent = async (id, data, userId = getStoredUserId()) => {
  const response = await API.put(`/api/events/${id}`, data, {
    params: {
      userId,
    },
  });

  return response.data;
};

export const deleteEvent = async (id, userId = getStoredUserId()) => {
  const response = await API.delete(`/api/events/${id}`, {
    params: {
      userId,
    },
  });

  return response.data;
};

export const syncEventToGoogle = async (id, userId = getStoredUserId()) => {
  const response = await API.post(`/api/events/${id}/sync`, null, {
    params: {
      userId,
    },
  });

  return response.data;
};

export const getSyncStatus = async (id) => {
  const response = await API.get(`/api/events/${id}/sync-status`);

  return response.data;
};
