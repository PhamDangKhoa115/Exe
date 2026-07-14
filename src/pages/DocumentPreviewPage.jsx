import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaExternalLinkAlt,
  FaFileAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import { getDocumentDetail, syncDocument } from "../api/documentApi";

import { getApiError } from "../utils/getApiError";

export default function DocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadDocument = async () => {
    try {
      setLoading(true);

      const data = await getDocumentDetail(id, userId);

      setDocument(data);
    } catch (error) {
      const message = getApiError(error, "Không thể tải tài liệu");

      console.log("LOAD DOCUMENT PREVIEW ERROR:", message);
      toast.error(message);
      setDocument(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [id, userId]);

  const handleSync = async () => {
    try {
      setSyncing(true);

      const updatedDocument = await syncDocument(id, userId);

      setDocument(updatedDocument);
      toast.success("Đồng bộ tài liệu thành công");
    } catch (error) {
      const message = getApiError(error, "Không thể đồng bộ tài liệu");

      console.log("SYNC DOCUMENT ERROR:", message);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenGoogleDocs = () => {
    if (!document?.documentUrl) {
      toast.warning("Tài liệu chưa có đường dẫn Google Docs");
      return;
    }

    window.open(document.documentUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <Topbar title="Home Page / Documents / Preview" />

          <div className="documents-loading">
            <div className="documents-spinner" />
            <p>Đang tải bản xem trước...</p>
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
          <Topbar title="Home Page / Documents / Preview" />

          <div className="documents-empty">
            <FaFileAlt />

            <h2>Không tìm thấy tài liệu</h2>

            <button
              type="button"
              className="document-button primary"
              onClick={() => navigate("/google-docs")}
            >
              Quay lại danh sách
            </button>
          </div>
        </main>
      </div>
    );
  }

  const previewUrl = getGoogleDocsPreviewUrl(document);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title={`Documents / ${document.title}`} />

        <section className="document-preview-page">
          <div className="document-preview-toolbar">
            <div className="document-preview-toolbar-left">
              <button type="button" onClick={() => navigate("/google-docs")}>
                <FaArrowLeft />
                Quay lại
              </button>

              <div>
                <h1>{document.title}</h1>

                <p>
                  {document.clubName || "Câu lạc bộ"}
                  {document.eventTitle ? ` · ${document.eventTitle}` : ""}
                </p>
              </div>
            </div>

            <div className="document-preview-toolbar-actions">
              <button type="button" onClick={handleSync} disabled={syncing}>
                <FaSyncAlt />
                {syncing ? "Đang đồng bộ..." : "Đồng bộ"}
              </button>

              <button
                type="button"
                className="primary"
                onClick={handleOpenGoogleDocs}
              >
                <FaExternalLinkAlt />
                Mở để chỉnh sửa
              </button>
            </div>
          </div>

          <div className="document-preview-container">
            {previewUrl ? (
              <iframe
                key={previewUrl}
                className="document-preview-frame"
                src={previewUrl}
                title={document.title}
                allow="clipboard-read; clipboard-write"
              />
            ) : (
              <div className="document-preview-fallback">
                <FaFileAlt />

                <h2>Không thể tạo bản xem trước</h2>

                <p>
                  Backend chưa trả về
                  <code> googleDocumentId </code>
                  hoặc
                  <code> documentUrl</code>.
                </p>

                {document.localContent && (
                  <div className="document-local-preview">
                    <pre>{document.localContent}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function getGoogleDocsPreviewUrl(document) {
  if (document.googleDocumentId) {
    return `https://docs.google.com/document/d/${document.googleDocumentId}/preview`;
  }

  if (!document.documentUrl) {
    return "";
  }

  const idMatch = document.documentUrl.match(/\/document\/d\/([^/]+)/);

  if (idMatch?.[1]) {
    return `https://docs.google.com/document/d/${idMatch[1]}/preview`;
  }

  if (document.documentUrl.includes("/edit")) {
    return document.documentUrl.replace(/\/edit.*$/, "/preview");
  }

  return "";
}
