import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createDocument } from "../api/documentApi";
import { getClubEvents } from "../api/eventApi";
import { getApiError } from "../utils/getApiError";

const DOCUMENT_TYPES = [
  {
    value: "MEETING_MINUTES",
    label: "Biên bản cuộc họp",
  },
  {
    value: "EVENT_PLAN",
    label: "Kế hoạch sự kiện",
  },
  {
    value: "REPORT",
    label: "Báo cáo",
  },
  {
    value: "FINANCE",
    label: "Tài chính",
  },
  {
    value: "OTHER",
    label: "Khác",
  },
];

export default function CreateDocumentModal({ open, onClose, onCreated }) {
  const userId = localStorage.getItem("userId");
  const clubId = localStorage.getItem("selectedClubId");

  const [events, setEvents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    documentType: "MEETING_MINUTES",
    eventId: "",
  });

  useEffect(() => {
    if (!open || !clubId) return;

    const loadEvents = async () => {
      try {
        const data = await getClubEvents(clubId);
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.log("LOAD EVENTS ERROR:", error.response?.data || error);
        setEvents([]);
      }
    };

    loadEvents();
  }, [open, clubId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.warning("Vui lòng nhập tên tài liệu");
      return;
    }

    if (!userId || !clubId) {
      toast.error("Không tìm thấy thông tin người dùng hoặc câu lạc bộ");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        clubId: Number(clubId),
        eventId: form.eventId ? Number(form.eventId) : null,
        title: form.title.trim(),
        documentType: form.documentType,
      };

      const createdDocument = await createDocument(payload, userId);

      toast.success("Tạo tài liệu Google Docs thành công");

      setForm({
        title: "",
        documentType: "MEETING_MINUTES",
        eventId: "",
      });

      onCreated?.(createdDocument);
      onClose();
    } catch (error) {
      const message = getApiError(error, "Không thể tạo tài liệu");

      console.log("CREATE DOCUMENT ERROR:", message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="document-modal-overlay" onMouseDown={onClose}>
      <div
        className="document-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="document-modal-header">
          <div>
            <h2>Tạo tài liệu mới</h2>
            <p>Tài liệu sẽ được tạo trực tiếp trên Google Drive.</p>
          </div>

          <button
            type="button"
            className="document-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Tên tài liệu</label>
          <input
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
            placeholder="Ví dụ: Biên bản họp CLB tháng 7"
          />

          <label>Loại tài liệu</label>
          <select
            value={form.documentType}
            onChange={(event) =>
              setForm({
                ...form,
                documentType: event.target.value,
              })
            }
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <label>Sự kiện liên quan</label>
          <select
            value={form.eventId}
            onChange={(event) =>
              setForm({
                ...form,
                eventId: event.target.value,
              })
            }
          >
            <option value="">Không gắn với sự kiện</option>

            {events.map((clubEvent) => (
              <option key={clubEvent.id} value={clubEvent.id}>
                {clubEvent.title}
              </option>
            ))}
          </select>

          <div className="document-modal-actions">
            <button
              type="button"
              className="document-button secondary"
              onClick={onClose}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="document-button primary"
              disabled={submitting}
            >
              {submitting ? "Đang tạo..." : "Tạo tài liệu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
