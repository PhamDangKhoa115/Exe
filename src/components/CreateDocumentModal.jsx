import { useEffect, useState } from "react";
import { FaFileAlt, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

import {
  createDocument,
  getDocumentCategories,
  getDocumentTypes,
} from "../api/documentApi";
import { getApiError } from "../utils/getApiError";

const EMPTY_FORM = {
  title: "",
  category: "CLUB_ACTIVITY",
  type: "MEETING_MINUTES",
  eventId: "",
};

export default function CreateDocumentModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let active = true;

    async function loadOptions() {
      try {
        setLoadingOptions(true);

        const [typesData, categoriesData] = await Promise.all([
          getDocumentTypes(),
          getDocumentCategories(),
        ]);

        if (!active) return;

        const nextTypes = Array.isArray(typesData) ? typesData : [];

        const nextCategories = Array.isArray(categoriesData)
          ? categoriesData
          : [];

        setTypes(nextTypes);
        setCategories(nextCategories);

        setForm((current) => ({
          ...current,
          type: current.type || nextTypes[0]?.value || "MEETING_MINUTES",
          category:
            current.category || nextCategories[0]?.value || "CLUB_ACTIVITY",
        }));
      } catch (error) {
        console.error(
          "LOAD DOCUMENT OPTIONS ERROR:",
          error?.response?.data || error,
        );
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
    }
  }, [open]);

  if (!open) return null;

  const setField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleClose = () => {
    if (submitting) return;

    setForm(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề tài liệu.");
      return;
    }

    if (!form.category) {
      toast.error("Vui lòng chọn danh mục.");
      return;
    }

    if (!form.type) {
      toast.error("Vui lòng chọn loại tài liệu.");
      return;
    }

    if (form.category === "EVENT" && !form.eventId) {
      toast.error("Tài liệu thuộc sự kiện phải chọn Event ID.");
      return;
    }

    try {
      setSubmitting(true);

      const createdDocument = await createDocument({
        title: form.title,
        category: form.category,
        type: form.type,
        eventId:
          form.category === "EVENT" && form.eventId
            ? Number(form.eventId)
            : null,
      });

      toast.success("Tạo tài liệu thành công.");

      setForm(EMPTY_FORM);
      onClose();

      await onCreated?.(createdDocument);
    } catch (error) {
      const message = getApiError(error, "Không thể tạo tài liệu");

      console.error("CREATE DOCUMENT ERROR:", error?.response?.data || error);

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="document-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <form className="document-create-modal" onSubmit={handleSubmit}>
        <div className="document-modal-header">
          <div>
            <FaFileAlt />

            <div>
              <h2>Tạo tài liệu mới</h2>
              <p>Tài liệu sẽ được tạo trên Google Docs.</p>
            </div>
          </div>

          <button type="button" onClick={handleClose} disabled={submitting}>
            <FaTimes />
          </button>
        </div>

        <div className="document-modal-body">
          <label htmlFor="document-title">
            Tiêu đề <span>*</span>
          </label>

          <input
            id="document-title"
            type="text"
            value={form.title}
            placeholder="Ví dụ: Biên bản họp tháng 7"
            onChange={(event) => setField("title", event.target.value)}
          />

          <label htmlFor="document-category">
            Danh mục <span>*</span>
          </label>

          <select
            id="document-category"
            value={form.category}
            disabled={loadingOptions}
            onChange={(event) => setField("category", event.target.value)}
          >
            {categories.length > 0 ? (
              categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.displayName}
                </option>
              ))
            ) : (
              <>
                <option value="EVENT">Sự kiện</option>

                <option value="CLUB_ACTIVITY">Hoạt động câu lạc bộ</option>
              </>
            )}
          </select>

          <label htmlFor="document-type">
            Loại tài liệu <span>*</span>
          </label>

          <select
            id="document-type"
            value={form.type}
            disabled={loadingOptions}
            onChange={(event) => setField("type", event.target.value)}
          >
            {types.length > 0 ? (
              types.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.displayName}
                </option>
              ))
            ) : (
              <>
                <option value="MEETING_MINUTES">Biên bản cuộc họp</option>

                <option value="EVENT_PLAN">Kế hoạch sự kiện</option>

                <option value="REPORT">Báo cáo</option>

                <option value="FINANCE">Tài chính</option>

                <option value="OTHER">Khác</option>
              </>
            )}
          </select>

          {form.category === "EVENT" && (
            <>
              <label htmlFor="document-event-id">
                Event ID <span>*</span>
              </label>

              <input
                id="document-event-id"
                type="number"
                min="1"
                value={form.eventId}
                placeholder="Nhập ID sự kiện"
                onChange={(event) => setField("eventId", event.target.value)}
              />
            </>
          )}
        </div>

        <div className="document-modal-footer">
          <button
            type="button"
            className="document-cancel-button"
            onClick={handleClose}
            disabled={submitting}
          >
            Hủy
          </button>

          <button
            type="submit"
            className="document-create-button"
            disabled={submitting || loadingOptions}
          >
            {submitting ? "Đang tạo..." : "Tạo tài liệu"}
          </button>
        </div>
      </form>
    </div>
  );
}
