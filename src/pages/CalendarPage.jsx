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
  getEventDetail,
  getSyncStatus,
  syncEventToGoogle,
  updateEvent,
} from "../api/eventApi";

import { getGoogleConnectionStatus } from "../api/googleApi";
export default function CalendarPage() {
  const calendarRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");

  const [checkingGoogleStatus, setCheckingGoogleStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("");
  const [view, setView] = useState("timeGridWeek");
  const [search, setSearch] = useState("");
  const [lastSync, setLastSync] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(formatLocalDate(new Date()));

  const [syncingEventId, setSyncingEventId] = useState(null);

  const [eventSyncStatus, setEventSyncStatus] = useState("NOT_SYNCED");

  const [googleEventLink, setGoogleEventLink] = useState("");

  const [meetLink, setMeetLink] = useState("");
  const [form, setForm] = useState({
    title: "",
    start: "",
    end: "",
    location: "",
    description: "",
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
  const getBackendViewType = (calendarView = view) => {
    if (calendarView === "dayGridMonth") {
      return "MONTH";
    }

    if (calendarView === "timeGridDay") {
      return "DAY";
    }

    return "WEEK";
  };
  const loadGoogleConnectionStatus = async () => {
    try {
      setCheckingGoogleStatus(true);

      const data = await getGoogleConnectionStatus();

      setConnected(data?.isConnected === true);

      setGoogleEmail(data?.googleEmail || "");
    } catch (error) {
      console.log("GOOGLE STATUS ERROR:", error.response?.data || error);

      setConnected(false);
      setGoogleEmail("");
    } finally {
      setCheckingGoogleStatus(false);
    }
  };
  const loadGoogleEvents = async ({
    date = currentDate,
    calendarView = view,
  } = {}) => {
    const clubId = localStorage.getItem("selectedClubId");

    if (!clubId) {
      toast.error("Vui lòng chọn câu lạc bộ trước.");

      setEvents([]);
      return;
    }

    try {
      setLoading(true);

      const data = await getCalendarEvents({
        clubId: Number(clubId),
        viewType: getBackendViewType(calendarView),
        date,
      });

      const sourceEvents = Array.isArray(data) ? data : [];

      const mappedEvents = sourceEvents.map((event) => ({
        id: String(event.id),
        title: event.title || "Không có tiêu đề",
        start: event.startTime,
        end: event.endTime,
        location: event.location || "",
        description: event.description || "",
        clubId: event.clubId,
        clubName: event.clubName || "",
        createdByUserId: event.createdByUserId,
        createdByName: event.createdByName || "",
        googleEventLink: event.googleEventLink || "",
        syncStatus: event.syncStatus || "NOT_SYNCED",
        meetLink: event.meetLink || "",
        status: event.status || "",
        color:
          event.syncStatus === "SYNCED"
            ? "#16a34a"
            : event.syncStatus === "FAILED"
              ? "#dc2626"
              : "#6d28d9",
      }));

      setEvents(mappedEvents);

      setLastSync(
        new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (error) {
      console.log("LOAD CALENDAR ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Không thể tải danh sách sự kiện",
      );

      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadGoogleConnectionStatus();
  }, []);
  const openCreateModal = (start = "", end = "") => {
    setEditingEvent(null);
    setEventSyncStatus("NOT_SYNCED");
    setGoogleEventLink("");
    setMeetLink("");
    setForm({
      title: "",
      start,
      end,
      location: "",
      description: "",
      color: "#6d28d9",
    });
    setShowModal(true);
  };

  const openEditModal = async (calendarEvent) => {
    try {
      const detail = await getEventDetail(calendarEvent.id);

      setEditingEvent(String(detail.id));

      setForm({
        title: detail.title || "",
        start: toLocalInputValue(new Date(detail.startTime)),
        end: toLocalInputValue(new Date(detail.endTime)),
        location: detail.location || "",
        description: detail.description || "",
        color:
          detail.syncStatus === "SYNCED"
            ? "#16a34a"
            : detail.syncStatus === "FAILED"
              ? "#dc2626"
              : "#6d28d9",
      });

      setEventSyncStatus(detail.syncStatus || "NOT_SYNCED");

      setGoogleEventLink(detail.googleEventLink || "");

      setMeetLink(detail.meetLink || "");

      setShowModal(true);
    } catch (error) {
      console.log("GET EVENT DETAIL ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message || "Không thể tải chi tiết sự kiện",
      );
    }
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
    if (!form.title.trim() || !form.start || !form.end) {
      toast.error("Vui lòng nhập tiêu đề, thời gian bắt đầu và kết thúc.");
      return;
    }

    const startDate = new Date(form.start);
    const endDate = new Date(form.end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error("Thời gian sự kiện không hợp lệ.");
      return;
    }

    if (endDate <= startDate) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        location: form.location.trim(),
      };

      if (editingEvent) {
        await updateEvent(editingEvent, payload);

        toast.success("Cập nhật sự kiện thành công.");
      } else {
        await createEvent(payload);

        toast.success("Tạo sự kiện thành công.");
      }

      setShowModal(false);
      setEditingEvent(null);

      await loadGoogleEvents({
        date: currentDate,
        calendarView: view,
      });
    } catch (error) {
      console.log("SAVE EVENT ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Không thể lưu sự kiện",
      );
    }
  };
  const handleSyncEvent = async () => {
    if (!connected) {
      toast.warning("Vui lòng kết nối tài khoản Google tại Home Page trước.");
      return;
    }

    if (!editingEvent) {
      toast.warning("Bạn cần lưu sự kiện trước khi đồng bộ.");
      return;
    }

    if (!editingEvent) {
      toast.warning("Bạn cần lưu sự kiện trước khi đồng bộ.");
      return;
    }

    try {
      setSyncingEventId(editingEvent);

      await syncEventToGoogle(editingEvent);

      const statusData = await getSyncStatus(editingEvent);

      const nextStatus =
        statusData?.syncStatus || statusData?.status || "SYNCED";

      setEventSyncStatus(nextStatus);

      if (statusData?.googleEventLink) {
        setGoogleEventLink(statusData.googleEventLink);
      }

      if (statusData?.meetLink) {
        setMeetLink(statusData.meetLink);
      }

      setConnected(true);

      toast.success("Đồng bộ Google Calendar thành công.");

      await loadGoogleEvents({
        date: currentDate,
        calendarView: view,
      });
    } catch (error) {
      console.log("SYNC EVENT ERROR:", error.response?.data || error);

      setEventSyncStatus("FAILED");

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Không thể đồng bộ Google Calendar",
      );
    } finally {
      setSyncingEventId(null);
    }
  };
  const handleDelete = async () => {
    if (!editingEvent) return;

    const confirmed = window.confirm("Bạn có chắc muốn xóa sự kiện này?");

    if (!confirmed) return;

    try {
      await deleteEvent(editingEvent);

      setShowModal(false);
      setEditingEvent(null);

      await loadGoogleEvents({
        date: currentDate,
        calendarView: view,
      });

      toast.success("Xóa sự kiện thành công.");
    } catch (error) {
      console.log("DELETE EVENT ERROR:", error.response?.data || error);

      toast.error(error.response?.data?.message || "Không thể xóa sự kiện");
    }
  };

  const handleEventDrop = async (info) => {
    const oldEvent = events.find((item) => item.id === info.event.id);

    if (!oldEvent) {
      info.revert();
      return;
    }

    try {
      const startDate = info.event.start;

      const endDate =
        info.event.end || new Date(startDate.getTime() + 60 * 60 * 1000);

      const payload = {
        title: oldEvent.title,
        description: oldEvent.description || "",
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        location: oldEvent.location || "",
      };

      await updateEvent(info.event.id, payload);

      toast.success("Đã cập nhật thời gian sự kiện.");

      await loadGoogleEvents({
        date: currentDate,
        calendarView: view,
      });
    } catch (error) {
      console.log("MOVE EVENT ERROR:", error.response?.data || error);

      info.revert();

      toast.error(
        error.response?.data?.message || "Không thể di chuyển sự kiện",
      );
    }
  };

  const handleEventResize = async (info) => {
    const oldEvent = events.find((item) => item.id === info.event.id);

    if (!oldEvent) {
      info.revert();
      return;
    }

    try {
      const startDate = info.event.start;
      const endDate = info.event.end;

      if (!startDate || !endDate) {
        throw new Error("Thời gian sự kiện không hợp lệ");
      }

      const payload = {
        title: oldEvent.title,
        description: oldEvent.description || "",
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        location: oldEvent.location || "",
      };

      await updateEvent(info.event.id, payload);

      toast.success("Đã cập nhật thời lượng sự kiện.");

      await loadGoogleEvents({
        date: currentDate,
        calendarView: view,
      });
    } catch (error) {
      console.log("RESIZE EVENT ERROR:", error.response?.data || error);

      info.revert();

      toast.error(
        error.response?.data?.message || "Không thể thay đổi thời lượng",
      );
    }
  };
  const changeView = (newView) => {
    const api = calendarApi();

    if (!api) return;

    api.changeView(newView);
  };
  const goToday = () => {
    calendarApi()?.today();
  };

  const goPrev = () => {
    calendarApi()?.prev();
  };

  const goNext = () => {
    calendarApi()?.next();
  };

  const goDate = (date) => {
    calendarApi()?.gotoDate(date);
  };
  const handleDatesSet = (info) => {
    const activeDate = info.view.calendar.getDate();
    const selectedDate = formatLocalDate(activeDate);
    const selectedView = info.view.type;

    setCurrentTitle(info.view.title);
    setCurrentDate(selectedDate);
    setView(selectedView);

    loadGoogleEvents({
      date: selectedDate,
      calendarView: selectedView,
    });
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
            {checkingGoogleStatus ? (
              <div className="gcal-google-connected">
                <span>Đang kiểm tra Google...</span>
              </div>
            ) : connected ? (
              <div className="gcal-google-connected">
                <span>✓ Đã kết nối Google</span>

                {googleEmail && <small>{googleEmail}</small>}
              </div>
            ) : (
              <div className="gcal-google-required">
                Chưa kết nối Google. Vui lòng quay lại Home Page để thiết lập.
              </div>
            )}

            <button
              type="button"
              className="gcal-refresh"
              onClick={() =>
                loadGoogleEvents({
                  date: currentDate,
                  calendarView: view,
                })
              }
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Làm mới"}
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
                </select>
              </div>
            </div>

            {!checkingGoogleStatus && !connected && (
              <div className="connect-warning">
                Bạn vẫn có thể tạo sự kiện trong CLB. Vui lòng quay lại Home
                Page để kết nối Google trước khi đồng bộ sự kiện.
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
                firstDay={1}
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
                datesSet={handleDatesSet}
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

              <label>Description</label>
              <textarea
                placeholder="Add description..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              {editingEvent && (
                <div className="gcal-sync-status-box">
                  <div>
                    <strong>Trạng thái đồng bộ</strong>

                    <span
                      className={`sync-badge ${eventSyncStatus
                        .toLowerCase()
                        .replaceAll("_", "-")}`}
                    >
                      {formatSyncStatus(eventSyncStatus)}
                    </span>
                  </div>

                  <div className="gcal-sync-links">
                    {googleEventLink && (
                      <a
                        href={googleEventLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở Google Calendar
                      </a>
                    )}

                    {meetLink && (
                      <a href={meetLink} target="_blank" rel="noreferrer">
                        Tham gia Google Meet
                      </a>
                    )}
                  </div>
                </div>
              )}
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
                  <>
                    <button
                      type="button"
                      className="danger"
                      onClick={handleDelete}
                      disabled={syncingEventId === editingEvent}
                    >
                      Xóa
                    </button>
                    <button
                      type="button"
                      className="sync"
                      onClick={handleSyncEvent}
                      disabled={!connected || syncingEventId === editingEvent}
                      title={
                        connected
                          ? "Đồng bộ sự kiện lên Google Calendar"
                          : "Vui lòng kết nối Google tại Home Page"
                      }
                    >
                      {syncingEventId === editingEvent
                        ? "Đang đồng bộ..."
                        : !connected
                          ? "Chưa kết nối Google"
                          : eventSyncStatus === "SYNCED"
                            ? "Đồng bộ lại Google"
                            : "Đồng bộ Google"}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="ghost"
                  onClick={() => setShowModal(false)}
                  disabled={
                    syncingEventId !== null && syncingEventId === editingEvent
                  }
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={handleSave}
                  disabled={
                    syncingEventId !== null && syncingEventId === editingEvent
                  }
                >
                  {" "}
                  {editingEvent ? "Lưu thay đổi" : "Tạo sự kiện"}{" "}
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
  let startDay = firstDay.getDay();

  startDay = startDay === 0 ? 6 : startDay - 1;
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
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
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
function formatSyncStatus(status) {
  const labels = {
    SYNCED: "Đã đồng bộ",
    NOT_SYNCED: "Chưa đồng bộ",
    FAILED: "Đồng bộ thất bại",
    PENDING: "Đang chờ đồng bộ",
  };

  return labels[status] || status || "Không rõ";
}
function formatLocalDate(dateValue) {
  const date = new Date(dateValue);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
