import GlideSelectField from "./reactbits/GlideSelectField";
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
      toast.error("Please enter a document title.");
      return;
    }

    if (!form.category) {
      toast.error("Please select a document category.");
      return;
    }

    if (!form.type) {
      toast.error("Please select a document type.");
      return;
    }

    if (form.category === "EVENT" && !form.eventId) {
      toast.error("Documents under events must select an Event name.");
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

      toast.success("Document created successfully.");

      setForm(EMPTY_FORM);
      onClose();

      await onCreated?.(createdDocument);
    } catch (error) {
      const message = getApiError(error, "Failed to create document");

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
              <h2>Create New Document</h2>
              <p>The document will be created on Google Docs.</p>
            </div>
          </div>

          <button type="button" onClick={handleClose} disabled={submitting}>
            <FaTimes />
          </button>
        </div>

        <div className="document-modal-body">
          <label htmlFor="document-title">
            Title <span>*</span>
          </label>

          <input
            id="document-title"
            type="text"
            value={form.title}
            placeholder="Example: Meeting minutes July"
            onChange={(event) => setField("title", event.target.value)}
          />

          <label htmlFor="document-category">
            Category <span>*</span>
          </label>

          <GlideSelectField
            id="document-category"
            className="document-select"
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
                <option value="EVENT">Event</option>

                <option value="CLUB_ACTIVITY">Club Activity</option>
              </>
            )}
          </GlideSelectField>

          <label htmlFor="document-type">
            Document Type <span>*</span>
          </label>

          <GlideSelectField
            id="document-type"
            className="document-select"
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
                <option value="MEETING_MINUTES">Meeting Minutes</option>

                <option value="EVENT_PLAN">Event Plan</option>

                <option value="REPORT">Report</option>

                <option value="FINANCE">Finance</option>

                <option value="OTHER">Other</option>
              </>
            )}
          </GlideSelectField>

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
                placeholder="Enter event"
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
            Cancel
          </button>

          <button
            type="submit"
            className="document-create-button"
            disabled={submitting || loadingOptions}
          >
            {submitting ? "Creating..." : "Create Document"}
          </button>
        </div>
      </form>
    </div>
  );
}
