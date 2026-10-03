import GlideList from "./reactbits/GlideList";
import RubberSegment from "./reactbits/RubberSegment";
import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  FolderOpen,
  Grid3X3,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { getClubDocuments } from "../api/documentApi";
import { getApiError } from "../utils/getApiError";

const FILTERS = [
  { value: "ALL", label: "All Documents" },
  { value: "MEETING_MINUTES", label: "Meeting Minutes" },
  { value: "EVENT_PLAN", label: "Event Plan" },
  { value: "REPORT", label: "Report" },
  { value: "FINANCE", label: "Finance" },
  { value: "OTHER", label: "Other" },
];

export default function DocumentPickerModal({ open, onClose, onSelect }) {
  const userId = localStorage.getItem("userId");
  const clubId = localStorage.getItem("selectedClubId");

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [view, setView] = useState("list");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadDocuments = async () => {
      if (!userId || !clubId) {
        toast.error("User or club not found");
        return;
      }

      try {
        setLoading(true);

        const data = await getClubDocuments({
          userId,
          clubId,
          search: "",
          type: "",
          sortBy: "date",
          sortDir: "desc",
        });

        setDocuments(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(getApiError(error, "Failed to load document list"));
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [open, userId, clubId]);

  const filteredDocuments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchSearch = (document.title || "")
        .toLowerCase()
        .includes(keyword);

      const matchType = type === "ALL" || document.documentType === type;

      return matchSearch && matchType;
    });
  }, [documents, search, type]);

  if (!open) return null;

  const handleSelect = (document) => {
    onSelect?.(document);
    onClose();
  };

  return (
    <div className="drive-picker-overlay" onMouseDown={onClose}>
      <section
        className="drive-picker-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="drive-picker-header">
          <div className="drive-picker-title">
            <FileText size={23} />
            <h2>Open File</h2>
          </div>

          <button
            type="button"
            className="drive-picker-close"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </header>

        <div className="drive-picker-search-row">
          <div className="drive-picker-search">
            <Search size={20} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents or paste URL"
            />

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>

          {showFilters && (
            <GlideList as="div" className="drive-picker-filter-menu">
              <p>Filter results by</p>

              {FILTERS.map((filter) => (
                <button
                  type="button"
                  key={filter.value}
                  className={type === filter.value ? "active" : ""}
                  onClick={() => {
                    setType(filter.value);
                    setShowFilters(false);
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </GlideList>
          )}
        </div>

        <RubberSegment as="nav" className="drive-picker-tabs">
          <button type="button" className="active">
            Recently
          </button>

          <button
            type="button"
            onClick={() => toast.info("Tính năng đang phát triển")}
          >
            My Drive
          </button>

          <button
            type="button"
            onClick={() => toast.info("Tính năng đang phát triển")}
          >
            Shared with me
          </button>

          <button
            type="button"
            onClick={() => toast.info("Tính năng đang phát triển")}
          >
            Starred
          </button>
        </RubberSegment>

        <div className="drive-picker-toolbar">
          <strong>Name</strong>

          <div>
            <button
              type="button"
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <List size={19} />
            </button>

            <button
              type="button"
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              <Grid3X3 size={19} />
            </button>
          </div>
        </div>

        <div className={`drive-picker-files ${view}`}>
          {loading ? (
            <div className="drive-picker-status">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="drive-picker-empty">
              <FolderOpen size={48} />
              <h3>No documents found</h3>
            </div>
          ) : (
            filteredDocuments.map((document) => (
              <button
                type="button"
                className="drive-picker-file"
                key={document.id}
                onDoubleClick={() => handleSelect(document)}
                onClick={() => handleSelect(document)}
              >
                <div className="drive-picker-file-icon">
                  <FileText size={22} />
                </div>

                <div className="drive-picker-file-info">
                  <strong>{document.title}</strong>

                  <span>{getDocumentTypeLabel(document.documentType)}</span>
                </div>

                <time>
                  {formatDate(document.updatedAt || document.createdAt)}
                </time>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function getDocumentTypeLabel(type) {
  const labels = {
    MEETING_MINUTES: "Meeting Minutes",
    EVENT_PLAN: "Event Plan",
    REPORT: "Report",
    FINANCE: "Finance",
    OTHER: "Other",
  };

  return labels[type] || "Document";
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("vi-VN");
}
