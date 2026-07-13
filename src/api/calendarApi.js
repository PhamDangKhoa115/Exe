const API_URL = import.meta.env.VITE_API_URL;

export async function connectGoogleCalendar() {
  const res = await fetch(`${API_URL}/google/auth-url`);
  const data = await res.json();

  window.location.href = data.url;
}

export async function checkCalendarStatus() {
  const res = await fetch(`${API_URL}/calendar/status`);
  return res.json();
}

export async function getCalendarEvents() {
  const res = await fetch(`${API_URL}/calendar/events`);

  if (!res.ok) {
    throw new Error("Google Calendar is not connected");
  }

  return res.json();
}

export async function createCalendarEvent(data) {
  const res = await fetch(`${API_URL}/calendar/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Cannot create event");
  }

  return result;
}
export async function updateCalendarEvent(id, data) {
  const res = await fetch(`${API_URL}/calendar/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Cannot update event");
  }

  return result;
}

export async function deleteCalendarEvent(id) {
  const res = await fetch(`${API_URL}/calendar/events/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Cannot delete event");
  }

  return res.json();
}
