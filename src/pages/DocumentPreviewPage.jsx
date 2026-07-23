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
      const message = getApiError(error, "cannot load document preview");

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
      toast.success("Document synced successfully");
    } catch (error) {
      const message = getApiError(error, "cannot sync document");

      console.log("SYNC DOCUMENT ERROR:", message);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenGoogleDocs = () => {
    if (!document?.documentUrl) {
      toast.warning("Document does not have a Google Docs link");
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
            <p>Loading preview...</p>
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

            <h2>Document not found</h2>

            <button
              type="button"
              className="document-button primary"
              onClick={() => navigate("/google-docs")}
            >
              Back to list
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
                Back to list
              </button>

              <div>
                <h1>{document.title}</h1>

                <p>
                  {document.clubName || "Club"}
                  {document.eventTitle ? ` · ${document.eventTitle}` : ""}
                </p>
              </div>
            </div>

            <div className="document-preview-toolbar-actions">
              <button type="button" onClick={handleSync} disabled={syncing}>
                <FaSyncAlt />
                {syncing ? "Syncing..." : "Sync"}
              </button>

              <button
                type="button"
                className="primary"
                onClick={handleOpenGoogleDocs}
              >
                <FaExternalLinkAlt />
                Open to Edit
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

                <h2>Cannot create preview</h2>

                <p>
                  Backend has not returned
                  <code> googleDocumentId </code>
                  or
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
