import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaExternalLinkAlt,
  FaHistory,
  FaShareAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getDocumentDetail,
  getDocumentRevisions,
  shareDocument,
  syncDocument,
} from "../api/documentApi";

import { getApiError } from "../utils/getApiError";

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("selectedClubRole") || "MEMBER";

  const [document, setDocument] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const canShare = ["PRESIDENT", "TREASURER"].includes(role.toUpperCase());

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getDocumentDetail(id, userId);
      setDocument(data);
    } catch (error) {
      const message = getApiError(error, "Không thể tải chi tiết tài liệu");

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSync = async () => {
    try {
      setSyncing(true);

      const data = await syncDocument(id, userId);
      setDocument(data);

      toast.success("Đồng bộ nội dung thành công");
    } catch (error) {
      toast.error(getApiError(error, "Không thể đồng bộ tài liệu"));
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadRevisions = async () => {
    try {
      setLoadingRevisions(true);

      const data = await getDocumentRevisions(id, userId);
      setRevisions(Array.isArray(data) ? data : []);

      if (!data?.length) {
        toast.info("Tài liệu chưa có lịch sử đồng bộ");
      }
    } catch (error) {
      toast.error(getApiError(error, "Không thể tải lịch sử tài liệu"));
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleShare = async (shareRole) => {
    try {
      const result = await shareDocument(id, userId, shareRole);

      toast.success(
        typeof result === "string"
          ? result
          : `Đã chia sẻ với quyền ${shareRole}`,
      );
    } catch (error) {
      toast.error(getApiError(error, "Không thể chia sẻ tài liệu"));
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <Topbar title="Google Docs / Document Detail" />

          <div className="documents-loading">
            <div className="documents-spinner" />
            <p>Đang tải tài liệu...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <Topbar title="Google Docs / Document Detail" />

          <div className="documents-empty">
            <h2>Không tìm thấy tài liệu</h2>

            <button
              className="document-button primary"
              onClick={() => navigate("/google-docs")}
            >
              Quay lại
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Google Docs / Document Detail" />

        <section className="document-detail-page">
          <button
            type="button"
            className="document-back-button"
            onClick={() => navigate("/google-docs")}
          >
            <FaArrowLeft />
            Quay lại danh sách
          </button>

          <div className="document-detail-header">
            <div>
              <span className="document-detail-type">
                {document.documentType}
              </span>

              <h1>{document.title}</h1>

              <p>
                {document.clubName} · Người tạo:{" "}
                {document.createdByName || "Không xác định"}
              </p>
            </div>

            <div className="document-detail-actions">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    document.documentUrl,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                <FaExternalLinkAlt />
                Mở Google Docs
              </button>

              <button type="button" onClick={handleSync} disabled={syncing}>
                <FaSyncAlt />
                {syncing ? "Đang đồng bộ..." : "Đồng bộ"}
              </button>

              <button
                type="button"
                onClick={handleLoadRevisions}
                disabled={loadingRevisions}
              >
                <FaHistory />
                Lịch sử
              </button>
            </div>
          </div>

          {canShare && (
            <div className="document-share-panel">
              <div>
                <FaShareAlt />
                <div>
                  <h3>Chia sẻ tài liệu</h3>
                  <p>Chọn quyền truy cập cho người có đường dẫn.</p>
                </div>
              </div>

              <div className="document-share-actions">
                <button onClick={() => handleShare("reader")}>Chỉ xem</button>

                <button onClick={() => handleShare("commenter")}>
                  Bình luận
                </button>

                <button onClick={() => handleShare("writer")}>Chỉnh sửa</button>
              </div>
            </div>
          )}

          <div className="document-detail-grid">
            <article className="document-content-card">
              <h2>Nội dung đồng bộ</h2>

              <div className="document-local-content">
                {document.localContent ? (
                  <pre>{document.localContent}</pre>
                ) : (
                  <p>Chưa có nội dung được đồng bộ.</p>
                )}
              </div>
            </article>

            <aside className="document-info-card">
              <h2>Thông tin tài liệu</h2>

              <dl>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{document.syncStatus || "Chưa xác định"}</dd>
                </div>

                <div>
                  <dt>Sự kiện</dt>
                  <dd>{document.eventTitle || "Không có"}</dd>
                </div>

                <div>
                  <dt>Ngày tạo</dt>
                  <dd>{formatDate(document.createdAt)}</dd>
                </div>

                <div>
                  <dt>Cập nhật gần nhất</dt>
                  <dd>{formatDate(document.updatedAt)}</dd>
                </div>
              </dl>

              <h3>Tóm tắt</h3>

              <p>{document.contentSummary || "Chưa có nội dung tóm tắt."}</p>
            </aside>
          </div>

          {revisions.length > 0 && (
            <section className="document-revisions">
              <h2>Lịch sử đồng bộ</h2>

              {revisions.map((revision) => (
                <article key={revision.id}>
                  <div>
                    <strong>Phiên bản {revision.version}</strong>
                    <span>{formatDate(revision.syncedAt)}</span>
                  </div>

                  <pre>{revision.content || "Không có nội dung"}</pre>
                </article>
              ))}
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Không có";

  return new Date(value).toLocaleString("vi-VN");
}
