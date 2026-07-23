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
      const message = getApiError(error, "cannot load document detail");

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

      toast.success("Content synchronized successfully");
    } catch (error) {
      toast.error(getApiError(error, "cannot synchronize document"));
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
        toast.info("Document has no synchronization history");
      }
    } catch (error) {
      toast.error(getApiError(error, "cannot load document revisions"));
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
          : `Document shared with ${shareRole} permissions`,
      );
    } catch (error) {
      toast.error(getApiError(error, "cannot share document"));
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
            <p>Loading document...</p>
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
            <h2>Document not found</h2>

            <button
              className="document-button primary"
              onClick={() => navigate("/google-docs")}
            >
              Back to List
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
            Back to List
          </button>

          <div className="document-detail-header">
            <div>
              <span className="document-detail-type">
                {document.documentType}
              </span>

              <h1>{document.title}</h1>

              <p>
                {document.clubName} · Created by:{" "}
                {document.createdByName || "Not specified"}
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
                Open Google Docs
              </button>

              <button type="button" onClick={handleSync} disabled={syncing}>
                <FaSyncAlt />
                {syncing ? "Syncing..." : "Sync Content"}
              </button>

              <button
                type="button"
                onClick={handleLoadRevisions}
                disabled={loadingRevisions}
              >
                <FaHistory />
                Revision History
              </button>
            </div>
          </div>

          {canShare && (
            <div className="document-share-panel">
              <div>
                <FaShareAlt />
                <div>
                  <h3>Share Document</h3>
                  <p>Select access permissions for those with the link.</p>
                </div>
              </div>

              <div className="document-share-actions">
                <button onClick={() => handleShare("reader")}>View Only</button>

                <button onClick={() => handleShare("commenter")}>
                  Comment
                </button>

                <button onClick={() => handleShare("writer")}>Edit</button>
              </div>
            </div>
          )}

          <div className="document-detail-grid">
            <article className="document-content-card">
              <h2>Synced Content</h2>

              <div className="document-local-content">
                {document.localContent ? (
                  <pre>{document.localContent}</pre>
                ) : (
                  <p>No synced content available.</p>
                )}
              </div>
            </article>

            <aside className="document-info-card">
              <h2>Document Information</h2>

              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>{document.syncStatus || "Not specified"}</dd>
                </div>

                <div>
                  <dt>Event</dt>
                  <dd>{document.eventTitle || "None"}</dd>
                </div>

                <div>
                  <dt>Created Date</dt>
                  <dd>{formatDate(document.createdAt)}</dd>
                </div>

                <div>
                  <dt>Last Updated</dt>
                  <dd>{formatDate(document.updatedAt)}</dd>
                </div>
              </dl>

              <h3>Summary</h3>

              <p>{document.contentSummary || "No summary available."}</p>
            </aside>
          </div>

          {revisions.length > 0 && (
            <section className="document-revisions">
              <h2>Revision History</h2>

              {revisions.map((revision) => (
                <article key={revision.id}>
                  <div>
                    <strong>Version {revision.version}</strong>
                    <span>{formatDate(revision.syncedAt)}</span>
                  </div>

                  <pre>{revision.content || "No content available"}</pre>
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
  if (!value) return "Not specified";

  return new Date(value).toLocaleString("vi-VN");
}
