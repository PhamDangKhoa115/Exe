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
  { value: "ALL", label: "Tất cả tài liệu" },
  { value: "MEETING_MINUTES", label: "Biên bản cuộc họp" },
  { value: "EVENT_PLAN", label: "Kế hoạch sự kiện" },
  { value: "REPORT", label: "Báo cáo" },
  { value: "FINANCE", label: "Tài chính" },
  { value: "OTHER", label: "Khác" },
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
        toast.error("Không tìm thấy người dùng hoặc câu lạc bộ");
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
        toast.error(getApiError(error, "Không thể tải danh sách tài liệu"));
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
            <h2>Mở tệp</h2>
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
              placeholder="Tìm trong tài liệu hoặc dán URL"
            />

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>

          {showFilters && (
            <div className="drive-picker-filter-menu">
              <p>Lọc kết quả theo</p>

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
            </div>
          )}
        </div>

        <nav className="drive-picker-tabs">
          <button type="button" className="active">
            Gần đây
          </button>

          <button
            type="button"
            onClick={() => toast.info("Tính năng đang phát triển")}
          >
            Drive của tôi
          </button>

          <button
            type="button"
            onClick={() => toast.info("Tính năng đang phát triển")}
          >
            Được chia sẻ với tôi
          </button>

          <button
            type="button"
            onClick={() => toast.info("Tính năng đang phát triển")}
          >
            Có gắn dấu sao
          </button>
        </nav>

        <div className="drive-picker-toolbar">
          <strong>Tên</strong>

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
            <div className="drive-picker-status">Đang tải tài liệu...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="drive-picker-empty">
              <FolderOpen size={48} />
              <h3>Không tìm thấy tài liệu</h3>
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
    MEETING_MINUTES: "Biên bản cuộc họp",
    EVENT_PLAN: "Kế hoạch sự kiện",
    REPORT: "Báo cáo",
    FINANCE: "Tài chính",
    OTHER: "Tài liệu khác",
  };

  return labels[type] || "Tài liệu";
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("vi-VN");
}
