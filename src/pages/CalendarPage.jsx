import { useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { toast } from "react-toastify";
import {
  createEvent,
  deleteEvent,
  getCalendarEvents,
  syncEventToGoogle,
  updateEvent,
} from "../api/eventApi";

import { connectGoogle } from "../api/googleApi";
export default function CalendarPage() {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("");
  const [view, setView] = useState("timeGridWeek");
  const [search, setSearch] = useState("");
  const [lastSync, setLastSync] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [form, setForm] = useState({
    title: "",
    start: "",
    end: "",
    location: "",
    description: "",
    guests: "",
    color: "#6d28d9",
  });

  const calendarApi = () => calendarRef.current?.getApi();

  const filteredEvents = useMemo(() => {
    return events.filter((event) =>
      event.title?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [events, search]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => new Date(event.start) >= new Date())
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 6);
  }, [events]);

  const loadGoogleEvents = async () => {
    try {
      setLoading(true);

      const data = await getCalendarEvents({
        clubId: localStorage.getItem("selectedClubId") || undefined,
        viewType: "MONTH",
        date: new Date().toISOString().slice(0, 10),
      });

      const mappedEvents = data.map((event) => ({
        id: String(event.id),
        title: event.title,
        start: event.startTime,
        end: event.endTime,
        location: event.location || "",
        description: event.description || "",
        googleEventLink: event.googleEventLink || "",
        syncStatus: event.syncStatus || "NOT_SYNCED",
        meetLink: event.meetLink || "",
        color:
          event.syncStatus === "SYNCED"
            ? "#16a34a"
            : event.syncStatus === "FAILED"
              ? "#dc2626"
              : "#6d28d9",
      }));

      setEvents(mappedEvents);
      setConnected(mappedEvents.some((event) => event.syncStatus === "SYNCED"));
    } catch (error) {
      console.log(error.response?.data || error);

      setConnected(false);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadGoogleEvents();
  }, []);
  const openCreateModal = (start = "", end = "") => {
    setEditingEvent(null);
    setForm({
      title: "",
      start,
      end,
      location: "",
      description: "",
      guests: "",
      color: "#6d28d9",
    });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event.id);
    setForm({
      title: event.title || "",
      start: event.startStr?.slice(0, 16) || "",
      end: event.endStr?.slice(0, 16) || event.startStr?.slice(0, 16) || "",
      location: event.extendedProps.location || "",
      description: event.extendedProps.description || "",
      guests: event.extendedProps.guests || "",
      color: event.backgroundColor || "#6d28d9",
    });
    setShowModal(true);
  };

  const handleSelect = (info) => {
    openCreateModal(info.startStr.slice(0, 16), info.endStr.slice(0, 16));
  };

  const handleDateClick = (info) => {
    const start =
      info.dateStr.length === 10
        ? `${info.dateStr}T09:00`
        : info.dateStr.slice(0, 16);

    const endDate = new Date(start);
    endDate.setHours(endDate.getHours() + 1);

    openCreateModal(start, toLocalInputValue(endDate));
  };

  const handleSave = async () => {
    try {
      if (!form.title || !form.start || !form.end) {
        toast.error("Please fill title, start time and end time");
        return;
      }

      const userId = localStorage.getItem("userId");
      const clubId = localStorage.getItem("selectedClubId");

      if (!userId) {
        toast.error("Please login again");
        return;
      }

      if (!clubId) {
        toast.error("Please select a club first");
        return;
      }

      const payload = {
        title: form.title,
        description: form.description || "",
        startTime: new Date(form.start).toISOString(),
        endTime: new Date(form.end).toISOString(),
        location: form.location || "",
      };

      console.log("CREATE/UPDATE PAYLOAD:", payload);

      let savedEvent;

      if (editingEvent) {
        savedEvent = await updateEvent(editingEvent, payload, userId);

        try {
          await syncEventToGoogle(editingEvent, userId);
        } catch (syncError) {
          console.log(
            "SYNC GOOGLE ERROR:",
            syncError.response?.data || syncError,
          );
        }
      } else {
        savedEvent = await createEvent(payload, userId, clubId);

        try {
          await syncEventToGoogle(savedEvent.id, userId);
        } catch (syncError) {
          console.log(
            "SYNC GOOGLE ERROR:",
            syncError.response?.data || syncError,
          );
        }
      }

      setShowModal(false);
      setEditingEvent(null);
      await loadGoogleEvents();

      toast.success("Event saved successfully");
    } catch (error) {
      console.log("SAVE EVENT ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          JSON.stringify(error.response?.data) ||
          "Cannot save event",
      );
    }
  };
  const handleDelete = async () => {
    try {
      if (!editingEvent) return;
      if (!window.confirm("Delete this event?")) return;

      await deleteEvent(editingEvent, localStorage.getItem("userId"));

      setShowModal(false);
      setEditingEvent(null);
      await loadGoogleEvents();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error(error.response?.data?.message || "Cannot delete event");
    }
  };

  const handleEventDrop = async (info) => {
    try {
      const oldEvent = events.find((item) => item.id === info.event.id);
      if (!oldEvent) return;

      const payload = {
        title: oldEvent.title,
        description: oldEvent.description || "",
        startTime: new Date(info.event.startStr).toISOString(),
        endTime: new Date(info.event.endStr).toISOString(),
        location: oldEvent.location || "",
      };

      const userId = localStorage.getItem("userId");

      await updateEvent(info.event.id, payload, userId);
      await syncEventToGoogle(info.event.id, userId);
      await loadGoogleEvents();
    } catch (error) {
      console.log(error.response?.data || error);
      info.revert();
      toast.error("Cannot move event");
    }
  };

  const handleEventResize = async (info) => {
    try {
      const oldEvent = events.find((item) => item.id === info.event.id);
      if (!oldEvent) return;

      const payload = {
        title: oldEvent.title,
        description: oldEvent.description || "",
        startTime: new Date(info.event.startStr).toISOString(),
        endTime: new Date(info.event.endStr).toISOString(),
        location: oldEvent.location || "",
      };

      const userId = localStorage.getItem("userId");

      await updateEvent(info.event.id, payload, userId);
      await syncEventToGoogle(info.event.id, userId);
      await loadGoogleEvents();
    } catch (error) {
      console.log(error.response?.data || error);
      info.revert();
      toast.error("Cannot resize event");
    }
  };
  const changeView = (newView) => {
    setView(newView);
    calendarApi().changeView(newView);
    setCurrentTitle(calendarApi().view.title);
  };

  const goToday = () => {
    calendarApi().today();
    setCurrentTitle(calendarApi().view.title);
  };

  const goPrev = () => {
    calendarApi().prev();
    setCurrentTitle(calendarApi().view.title);
  };

  const goNext = () => {
    calendarApi().next();
    setCurrentTitle(calendarApi().view.title);
  };

  const goDate = (date) => {
    calendarApi().gotoDate(date);
    setCurrentTitle(calendarApi().view.title);
  };
  const handleConnectGoogle = async () => {
    try {
      await connectGoogle();
    } catch (error) {
      console.log("CONNECT GOOGLE ERROR:", error.response?.data || error);
      toast.error("Cannot connect Google Calendar");
    }
  };
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="← Home / Google Calendar" />

        <div className="gcal-page">
          <aside className="gcal-left">
            <button className="gcal-create" onClick={() => openCreateModal()}>
              + Create
            </button>
            <button
              className={connected ? "gcal-sync connected" : "gcal-sync"}
              onClick={handleConnectGoogle}
            >
              {connected ? "✓ Google Connected" : "Sync Google Calendar"}
            </button>

            <button className="gcal-refresh" onClick={loadGoogleEvents}>
              {loading ? "Syncing..." : "Refresh"}
            </button>

            <MiniCalendar onPickDate={goDate} />

            <div className="gcal-card">
              <div className="gcal-card-head">
                <h3>Upcoming</h3>
                {lastSync && <span>Last sync: {lastSync}</span>}
              </div>

              {upcomingEvents.length === 0 ? (
                <p className="empty-text">No upcoming events</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    className="gcal-upcoming"
                    key={event.id}
                    onClick={() => goDate(event.start)}
                  >
                    <span style={{ background: event.color }}></span>
                    <div>
                      <b>{event.title}</b>
                      <p>{formatDateTime(event.start)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <section className="gcal-main">
            <div className="gcal-toolbar">
              <div className="gcal-toolbar-left">
                <button onClick={goToday}>Today</button>
                <button onClick={goPrev}>‹</button>
                <button onClick={goNext}>›</button>
                <h2>{currentTitle}</h2>
              </div>

              <div className="gcal-toolbar-right">
                <input
                  placeholder="Search event..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  value={view}
                  onChange={(e) => changeView(e.target.value)}
                >
                  <option value="timeGridDay">Day</option>
                  <option value="timeGridWeek">Week</option>
                  <option value="dayGridMonth">Month</option>
                  <option value="listWeek">Agenda</option>
                </select>
              </div>
            </div>

            {!connected && (
              <div className="connect-warning">
                Please sync Google Calendar before creating events.
              </div>
            )}

            <div className="gcal-box">
              <FullCalendar
                ref={calendarRef}
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  interactionPlugin,
                  listPlugin,
                ]}
                initialView="timeGridWeek"
                initialDate={new Date()}
                headerToolbar={false}
                events={filteredEvents}
                selectable
                editable
                selectMirror
                dayMaxEvents
                nowIndicator
                allDaySlot
                height="78vh"
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                slotDuration="00:30:00"
                datesSet={(info) => setCurrentTitle(info.view.title)}
                select={handleSelect}
                dateClick={handleDateClick}
                eventClick={(info) => openEditModal(info.event)}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
              />
            </div>
          </section>
        </div>

        {showModal && (
          <div className="gcal-modal-bg">
            <div className="gcal-modal">
              <div className="gcal-modal-head">
                <h2>{editingEvent ? "Edit event" : "Create event"}</h2>
                <button onClick={() => setShowModal(false)}>×</button>
              </div>

              <label>Title</label>
              <input
                placeholder="Add title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <div className="two-cols">
                <div>
                  <label>Start</label>
                  <input
                    type="datetime-local"
                    value={form.start}
                    onChange={(e) =>
                      setForm({ ...form, start: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>End</label>
                  <input
                    type="datetime-local"
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                  />
                </div>
              </div>

              <label>Location</label>
              <input
                placeholder="Room 302, FPT University..."
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />

              <label>Guests</label>
              <input
                placeholder="email1@gmail.com, email2@gmail.com"
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: e.target.value })}
              />

              <label>Description</label>
              <textarea
                placeholder="Add description..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <label>Color</label>
              <div className="gcal-color-row">
                {["#6d28d9", "#2563eb", "#16a34a", "#f59e0b", "#dc2626"].map(
                  (color) => (
                    <button
                      type="button"
                      key={color}
                      className={form.color === color ? "active" : ""}
                      style={{ background: color }}
                      onClick={() => setForm({ ...form, color })}
                    />
                  ),
                )}
              </div>

              <div className="gcal-modal-actions">
                {editingEvent && (
                  <button className="danger" onClick={handleDelete}>
                    Delete
                  </button>
                )}

                <button className="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>

                <button className="primary" onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MiniCalendar({ onPickDate }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let day = 1; day <= totalDays; day++) cells.push(day);

  return (
    <div className="gcal-card mini">
      <h3>
        {today.toLocaleString("en-US", { month: "long" })} {year}
      </h3>

      <div className="mini-week">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <b key={d}>{d}</b>
        ))}
      </div>

      <div className="mini-days">
        {cells.map((day, index) => {
          const date = day ? new Date(year, month, day) : null;
          const isToday = day === today.getDate();

          return (
            <button
              key={index}
              disabled={!day}
              className={isToday ? "today" : ""}
              onClick={() => day && onPickDate(date)}
            >
              {day || ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
