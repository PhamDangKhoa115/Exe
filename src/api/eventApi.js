import API from "./api";

export const getCalendarEvents = async ({
  clubId,
  viewType = "MONTH",
  date = new Date().toISOString().slice(0, 10),
} = {}) => {
  const res = await API.get("/api/events/calendar", {
    params: {
      clubId,
      viewType,
      date,
    },
  });

  return res.data;
};

export const getClubEvents = async (clubId) => {
  const res = await API.get(`/api/events/club/${clubId}`);
  return res.data;
};

export const createEvent = async (data, userId, clubId) => {
  const res = await API.post("/api/events", data, {
    params: {
      userId,
      clubId,
    },
  });

  return res.data;
};

export const updateEvent = async (id, data, userId) => {
  const res = await API.put(`/api/events/${id}`, data, {
    params: {
      userId,
    },
  });

  return res.data;
};

export const deleteEvent = async (id, userId) => {
  const res = await API.delete(`/api/events/${id}`, {
    params: {
      userId,
    },
  });

  return res.data;
};

export const syncEventToGoogle = async (id, userId) => {
  const res = await API.post(`/api/events/${id}/sync`, null, {
    params: {
      userId,
    },
  });

  return res.data;
};

export const getSyncStatus = async (id) => {
  const res = await API.get(`/api/events/${id}/sync-status`);
  return res.data;
};
