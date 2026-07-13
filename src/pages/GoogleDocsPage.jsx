import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaFolderOpen,
  FaPlus,
  FaSearch,
  FaShareAlt,
  FaSyncAlt,
  FaThLarge,
  FaList,
  FaExternalLinkAlt,
  FaEllipsisV,
} from "react-icons/fa";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import CreateDocumentModal from "../components/CreateDocumentModal";

import {
  getClubDocuments,
  shareDocument,
  syncDocument,
} from "../api/documentApi";

import { getApiError } from "../utils/getApiError";

const DOCUMENT_TYPES = [
  { value: "", label: "Tất cả loại tài liệu" },
  { value: "MEETING_MINUTES", label: "Biên bản cuộc họp" },
  { value: "EVENT_PLAN", label: "Kế hoạch sự kiện" },
  { value: "REPORT", label: "Báo cáo" },
  { value: "FINANCE", label: "Tài chính" },
  { value: "OTHER", label: "Khác" },
];

const TYPE_LABELS = {
  MEETING_MINUTES: "Biên bản",
  EVENT_PLAN: "Kế hoạch",
  REPORT: "Báo cáo",
  FINANCE: "Tài chính",
  OTHER: "Khác",
};

export default function GoogleDocsPage() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const clubId = localStorage.getItem("selectedClubId");
  const clubName = localStorage.getItem("selectedClubName") || "Câu lạc bộ";
  const role = localStorage.getItem("selectedClubRole") || "MEMBER";

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");

  const [openMenuId, setOpenMenuId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [sharingId, setSharingId] = useState(null);

  const canManageDocuments = useMemo(() => {
    return ["PRESIDENT", "TREASURER"].includes(role.toUpperCase());
  }, [role]);

  const loadDocuments = useCallback(async () => {
    if (!userId || !clubId) {
      toast.error("Vui lòng chọn câu lạc bộ trước");
      return;
    }

    try {
      setLoading(true);

      const data = await getClubDocuments({
        clubId,
        userId,
        search,
        type,
        sortBy,
        sortDir,
      });

      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = getApiError(error, "Không thể tải danh sách tài liệu");

      console.log("LOAD DOCUMENTS ERROR:", message);
      toast.error(message);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [clubId, search, sortBy, sortDir, type, userId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleOpenDocument = (document) => {
    if (!document.documentUrl) {
      toast.warning("Tài liệu chưa có đường dẫn Google Docs");
      return;
    }

    window.open(document.documentUrl, "_blank", "noopener,noreferrer");
  };

  const handleSync = async (document) => {
    try {
      setSyncingId(document.id);

      await syncDocument(document.id, userId);

      toast.success(`Đã đồng bộ "${document.title}"`);
      await loadDocuments();
    } catch (error) {
      const message = getApiError(error, "Không thể đồng bộ tài liệu");

      console.log("SYNC DOCUMENT ERROR:", message);
      toast.error(message);
    } finally {
      setSyncingId(null);
      setOpenMenuId(null);
    }
  };

  const handleShare = async (document, shareRole) => {
    try {
      setSharingId(document.id);

      const result = await shareDocument(document.id, userId, shareRole);

      toast.success(
        typeof result === "string"
          ? result
          : `Đã chia sẻ tài liệu với quyền ${shareRole}`,
      );
    } catch (error) {
      const message = getApiError(error, "Không thể chia sẻ tài liệu");

      console.log("SHARE DOCUMENT ERROR:", message);
      toast.error(message);
    } finally {
      setSharingId(null);
      setOpenMenuId(null);
    }
  };

  const handleCreated = async (createdDocument) => {
    await loadDocuments();

    if (createdDocument?.documentUrl) {
      const shouldOpen = window.confirm(
        "Tạo tài liệu thành công. Mở Google Docs ngay?",
      );

      if (shouldOpen) {
        window.open(
          createdDocument.documentUrl,
          "_blank",
          "noopener,noreferrer",
        );
      }
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page / Google Docs" />

        <section className="documents-page">
          <div className="documents-heading">
            <div>
              <div className="documents-title">
                <FaFileAlt />
                <h1>Document</h1>
              </div>

              <p>
                Quản lý tài liệu của <strong>{clubName}</strong>
              </p>
            </div>

            {canManageDocuments && (
              <button
                type="button"
                className="document-create-button"
                onClick={() => setCreating(true)}
              >
                <FaPlus />
                Tạo tài liệu
              </button>
            )}
          </div>

          <div className="documents-toolbar">
            <form className="documents-search" onSubmit={handleSearch}>
              <FaSearch />

              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tiêu đề hoặc nội dung..."
              />

              <button type="submit">Tìm kiếm</button>
            </form>

            <div className="documents-filters">
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {DOCUMENT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="date">Sắp xếp theo ngày</option>
                <option value="title">Sắp xếp theo tên</option>
              </select>

              <select
                value={sortDir}
                onChange={(event) => setSortDir(event.target.value)}
              >
                <option value="desc">Giảm dần</option>
                <option value="asc">Tăng dần</option>
              </select>

              <button
                type="button"
                className={
                  viewMode === "grid"
                    ? "view-mode-button active"
                    : "view-mode-button"
                }
                onClick={() => setViewMode("grid")}
                title="Hiển thị dạng lưới"
              >
                <FaThLarge />
              </button>

              <button
                type="button"
                className={
                  viewMode === "list"
                    ? "view-mode-button active"
                    : "view-mode-button"
                }
                onClick={() => setViewMode("list")}
                title="Hiển thị dạng danh sách"
              >
                <FaList />
              </button>
            </div>
          </div>

          {!canManageDocuments && (
            <div className="documents-permission-note">
              Bạn có thể xem tài liệu. Chỉ Chủ nhiệm hoặc Thủ quỹ mới có thể tạo
              và chia sẻ tài liệu.
            </div>
          )}

          {loading ? (
            <div className="documents-loading">
              <div className="documents-spinner" />
              <p>Đang tải tài liệu...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="documents-empty">
              <FaFolderOpen />

              <h2>Chưa có tài liệu</h2>

              <p>
                {search || type
                  ? "Không tìm thấy tài liệu phù hợp với bộ lọc."
                  : "Câu lạc bộ chưa có tài liệu Google Docs nào."}
              </p>

              {canManageDocuments && !search && !type && (
                <button
                  type="button"
                  className="document-create-button"
                  onClick={() => setCreating(true)}
                >
                  <FaPlus />
                  Tạo tài liệu đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid" ? "documents-grid" : "documents-list"
              }
            >
              {documents.map((document) => (
                <article className="document-card" key={document.id}>
                  <button
                    type="button"
                    className="document-preview"
                    onClick={() => handleOpenDocument(document)}
                  >
                    <div className="document-page-lines">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="document-type-badge">
                      {TYPE_LABELS[document.documentType] ||
                        document.documentType ||
                        "Tài liệu"}
                    </div>
                  </button>

                  <div className="document-card-content">
                    <div className="document-card-top">
                      <button
                        type="button"
                        className="document-title-button"
                        onClick={() => navigate(`/documents/${document.id}`)}
                      >
                        {document.title}
                      </button>

                      <div className="document-card-menu-wrap">
                        <button
                          type="button"
                          className="document-menu-button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === document.id ? null : document.id,
                            )
                          }
                        >
                          <FaEllipsisV />
                        </button>

                        {openMenuId === document.id && (
                          <div className="document-card-menu">
                            <button
                              type="button"
                              onClick={() => handleOpenDocument(document)}
                            >
                              <FaExternalLinkAlt />
                              Mở Google Docs
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/documents/${document.id}`)
                              }
                            >
                              <FaFileAlt />
                              Xem chi tiết
                            </button>

                            <button
                              type="button"
                              disabled={syncingId === document.id}
                              onClick={() => handleSync(document)}
                            >
                              <FaSyncAlt />
                              {syncingId === document.id
                                ? "Đang đồng bộ..."
                                : "Đồng bộ"}
                            </button>

                            {canManageDocuments && (
                              <>
                                <button
                                  type="button"
                                  disabled={sharingId === document.id}
                                  onClick={() =>
                                    handleShare(document, "reader")
                                  }
                                >
                                  <FaShareAlt />
                                  Chia sẻ chỉ xem
                                </button>

                                <button
                                  type="button"
                                  disabled={sharingId === document.id}
                                  onClick={() =>
                                    handleShare(document, "commenter")
                                  }
                                >
                                  <FaShareAlt />
                                  Chia sẻ bình luận
                                </button>

                                <button
                                  type="button"
                                  disabled={sharingId === document.id}
                                  onClick={() =>
                                    handleShare(document, "writer")
                                  }
                                >
                                  <FaShareAlt />
                                  Chia sẻ chỉnh sửa
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="document-summary">
                      {document.contentSummary || "Chưa có nội dung tóm tắt."}
                    </p>

                    <div className="document-card-meta">
                      <span>
                        Người tạo: {document.createdByName || "Không xác định"}
                      </span>

                      <span>
                        {formatDate(document.updatedAt || document.createdAt)}
                      </span>
                    </div>

                    <div className="document-card-footer">
                      <span
                        className={`document-sync-status ${
                          document.syncStatus?.toLowerCase() || "not_synced"
                        }`}
                      >
                        {getSyncLabel(document.syncStatus)}
                      </span>

                      {document.eventTitle && (
                        <span className="document-event-label">
                          {document.eventTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <CreateDocumentModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

function getSyncLabel(status) {
  switch (status) {
    case "SYNCED":
      return "Đã đồng bộ";
    case "FAILED":
      return "Đồng bộ lỗi";
    case "NOT_SYNCED":
      return "Chưa đồng bộ";
    default:
      return status || "Chưa đồng bộ";
  }
}

function formatDate(value) {
  if (!value) return "Không có ngày";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
