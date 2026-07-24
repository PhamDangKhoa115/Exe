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
  FaTrash,
} from "react-icons/fa";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import CreateDocumentModal from "../components/CreateDocumentModal";
import DocumentPickerModal from "../components/DocumentPickerModal";

import {
  deleteDocument,
  getClubDocuments,
  getDocumentCategories,
  getDocumentTypes,
  shareDocument,
  syncDocument,
} from "../api/documentApi";

import { getApiError } from "../utils/getApiError";

const TYPE_LABELS = {
  MEETING_MINUTES: "Meeting Minutes",
  EVENT_PLAN: "Event Plan",
  REPORT: "Report",
  FINANCE: "Finance",
  OTHER: "Other",
};

export default function GoogleDocsPage() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const clubId = localStorage.getItem("selectedClubId");
  const clubName = localStorage.getItem("selectedClubName") || "Club";
  const role = localStorage.getItem("selectedClubRole") || "MEMBER";
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documentCategories, setDocumentCategories] = useState([]);

  const [category, setCategory] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

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
      toast.error("Please select a club first");
      return;
    }

    try {
      setLoading(true);

      const data = await getClubDocuments({
        search,
        category,
        type,
        sortBy,
        sortDir,
      });
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = getApiError(error, "Failed to load document list");

      console.log("LOAD DOCUMENTS ERROR:", message);
      toast.error(message);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [clubId, userId, search, category, type, sortBy, sortDir]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);
  const loadDocumentOptions = useCallback(async () => {
    try {
      const [typesData, categoriesData] = await Promise.all([
        getDocumentTypes(),
        getDocumentCategories(),
      ]);

      setDocumentTypes(Array.isArray(typesData) ? typesData : []);

      setDocumentCategories(
        Array.isArray(categoriesData) ? categoriesData : [],
      );
    } catch (error) {
      console.error(
        "LOAD DOCUMENT OPTIONS ERROR:",
        error?.response?.data || error,
      );

      setDocumentTypes([]);
      setDocumentCategories([]);
    }
  }, []);
  useEffect(() => {
    loadDocumentOptions();
  }, [loadDocumentOptions]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };
  const handleDelete = async (document) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the document "${document.title}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingId(document.id);

      await deleteDocument(document.id);

      toast.success("Document deleted successfully.");

      await loadDocuments();
    } catch (error) {
      const message = getApiError(error, "Failed to delete document");

      console.error("DELETE DOCUMENT ERROR:", error?.response?.data || error);

      toast.error(message);
    } finally {
      setDeletingId(null);
      setOpenMenuId(null);
    }
  };
  const handleOpenDocument = (document) => {
    if (!document.documentUrl) {
      toast.warning("Document does not have a Google Docs link");
      return;
    }

    window.open(document.documentUrl, "_blank", "noopener,noreferrer");
  };

  const handlePickerSelect = (document) => {
    if (!document) return;

    if (document.documentUrl) {
      window.open(document.documentUrl, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(`/documents/${document.id}`);
  };

  const handleSync = async (document) => {
    try {
      setSyncingId(document.id);

      await syncDocument(document.id);

      toast.success(`Document synchronized: "${document.title}"`);

      await loadDocuments();
    } catch (error) {
      const message = getApiError(error, "Failed to synchronize document");

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
      const result = await shareDocument(document.id, shareRole);
      toast.success(
        typeof result === "string"
          ? result
          : `Document shared with role ${shareRole}`,
      );
    } catch (error) {
      const message = getApiError(error, "Failed to share document");

      console.log("SHARE DOCUMENT ERROR:", message);
      toast.error(message);
    } finally {
      setSharingId(null);
      setOpenMenuId(null);
    }
  };

  const handleCreated = async (createdDocument) => {
    await loadDocuments();

    toast.success("Document created successfully");

    if (createdDocument?.documentUrl) {
      window.open(createdDocument.documentUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page / Documents" />

        <section className="google-workspace-page documents-workspace-page">
          <div className="workspace-header">
            <div className="workspace-title">
              <FaFileAlt size={27} />

              <h1>Documents</h1>
            </div>

            <div className="workspace-tabs">
              <button
                type="button"
                className={category === "EVENT" ? "active" : ""}
                onClick={() => setCategory("EVENT")}
              >
                Event
              </button>

              <button
                type="button"
                className={category === "CLUB_ACTIVITY" ? "active" : ""}
                onClick={() => setCategory("CLUB_ACTIVITY")}
              >
                Club Activity
              </button>
            </div>

            <form className="workspace-search" onSubmit={handleSearch}>
              <FaSearch size={18} />

              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search documents..."
              />
            </form>
          </div>

          <div className="workspace-content">
            <div className="documents-template-list">
              <button
                type="button"
                className="new-file-card document-new-card"
                onClick={() => setCreating(true)}
                disabled={!canManageDocuments}
              >
                <div className="new-file-preview document-new-preview">
                  <FaPlus size={64} />
                </div>

                <span>New document</span>
              </button>

              <DocumentTemplateCard title="Curriculum Vitae" subtitle="Serif" />

              <DocumentTemplateCard title="Curriculum Vitae" subtitle="Coral" />

              <DocumentTemplateCard title="Letter" subtitle="Green" />

              <DocumentTemplateCard
                title="Project proposal"
                subtitle="Tropical"
              />

              <DocumentTemplateCard title="Advertising" subtitle="Geometry" />
            </div>

            <div className="documents-controls">
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="">All document types</option>

                {documentTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.displayName}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="date">Sort by date</option>

                <option value="title">Sort by title</option>
              </select>

              <select
                value={sortDir}
                onChange={(event) => setSortDir(event.target.value)}
              >
                <option value="desc">Descending</option>

                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="recent-header">
              <h3>Recently documents</h3>

              <div className="recent-actions">
                <button
                  type="button"
                  className={viewMode === "grid" ? "active" : ""}
                  onClick={() => setViewMode("grid")}
                  title="Display as grid"
                >
                  <FaThLarge size={18} />
                </button>

                <button
                  type="button"
                  className={viewMode === "list" ? "active" : ""}
                  onClick={() => setViewMode("list")}
                  title="Display as list"
                >
                  <FaList size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  title="Open file"
                >
                  <FaFolderOpen size={19} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="documents-loading">
                <div className="documents-spinner" />

                <p>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="documents-empty">
                <FaFolderOpen />

                <h2>No documents available</h2>

                <p>
                  {search || type
                    ? "No documents found matching the filter."
                    : category === "EVENT"
                      ? "No documents available for this event."
                      : "No documents available for this club activity."}
                </p>

                {canManageDocuments && !search && !type && (
                  <button
                    type="button"
                    className="document-create-button"
                    onClick={() => setCreating(true)}
                  >
                    <FaPlus />
                    Create first document
                  </button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="documents-grid">
                {documents.map((document) => (
                  <article className="document-card" key={document.id}>
                    <button
                      type="button"
                      className="document-preview"
                      onClick={() =>
                        navigate(`/documents/${document.id}/preview`)
                      }
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
                          "Document"}
                      </div>
                    </button>

                    <div className="document-card-content">
                      <div className="document-card-top">
                        <button
                          type="button"
                          className="document-title-button"
                          onClick={() =>
                            navigate(`/documents/${document.id}/preview`)
                          }
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
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleOpenDocument(document);
                                }}
                              >
                                <FaExternalLinkAlt />
                                Open Google Docs
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/documents/${document.id}/preview`);
                                }}
                              >
                                <FaFileAlt />
                                Preview
                              </button>

                              <button
                                type="button"
                                disabled={syncingId === document.id}
                                onClick={() => handleSync(document)}
                              >
                                <FaSyncAlt />

                                {syncingId === document.id
                                  ? "Loading..."
                                  : "Sync"}
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
                                    Share for viewing
                                  </button>

                                  <button
                                    type="button"
                                    disabled={sharingId === document.id}
                                    onClick={() =>
                                      handleShare(document, "commenter")
                                    }
                                  >
                                    <FaShareAlt />
                                    Share for commenting
                                  </button>

                                  <button
                                    type="button"
                                    disabled={sharingId === document.id}
                                    onClick={() =>
                                      handleShare(document, "writer")
                                    }
                                  >
                                    <FaShareAlt />
                                    Share for editing
                                  </button>
                                  <button
                                    type="button"
                                    className="document-delete-menu-button"
                                    disabled={deletingId === document.id}
                                    onClick={() => handleDelete(document)}
                                  >
                                    <FaTrash />

                                    {deletingId === document.id
                                      ? "Deleting..."
                                      : "Delete Document"}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="document-summary">
                        {document.contentSummary ||
                          "No content summary available."}
                      </p>

                      <div className="document-card-meta">
                        <span>
                          Người tạo: {document.createdByName || "unknown user"}
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
            ) : (
              <DocumentsList
                documents={documents}
                onPreview={(document) =>
                  navigate(`/documents/${document.id}/preview`)
                }
                onOpenGoogle={handleOpenDocument}
                onSync={handleSync}
                onShare={handleShare}
                onDelete={handleDelete}
                canManageDocuments={canManageDocuments}
                syncingId={syncingId}
                sharingId={sharingId}
                deletingId={deletingId}
              />
            )}
          </div>
        </section>
      </main>

      <CreateDocumentModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={handleCreated}
      />

      <DocumentPickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handlePickerSelect}
      />
    </div>
  );
}
function DocumentsList({
  documents,
  onPreview,
  onOpenGoogle,
  onSync,
  onShare,
  onDelete,
  canManageDocuments,
  syncingId,
  sharingId,
  deletingId,
}) {
  return (
    <div className="workspace-list-view">
      <div className="workspace-list-header">
        <span />

        <span>Name</span>

        <span className="owner-column">Owner</span>

        <span className="date-column">Last Updated</span>

        <span />
      </div>

      {documents.map((document) => (
        <DocumentListRow
          key={document.id}
          document={document}
          onPreview={() => onPreview(document)}
          onOpenGoogle={() => onOpenGoogle(document)}
          onSync={() => onSync(document)}
          onShare={(role) => onShare(document, role)}
          onDelete={() => onDelete(document)}
          canManageDocuments={canManageDocuments}
          syncing={syncingId === document.id}
          sharing={sharingId === document.id}
          deleting={deletingId === document.id}
        />
      ))}
    </div>
  );
}

function DocumentListRow({
  document,
  onPreview,
  onOpenGoogle,
  onSync,
  onShare,
  onDelete,
  canManageDocuments,
  syncing,
  sharing,
  deleting,
}) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="workspace-list-row">
      <div className="workspace-list-icon document">
        <FaFileAlt />
      </div>

      <button type="button" className="workspace-list-name" onClick={onPreview}>
        <span>{document.title}</span>
      </button>

      <span className="workspace-list-owner">
        {document.createdByName || "unknown user"}
      </span>

      <span className="workspace-list-date">
        {formatWorkspaceDate(document.updatedAt || document.createdAt)}
      </span>

      <div className="workspace-list-menu-wrap">
        <button
          type="button"
          className="workspace-list-menu-button"
          onClick={() => setMenu((current) => !current)}
        >
          <FaEllipsisV />
        </button>

        {menu && (
          <div className="workspace-list-dropdown">
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onPreview();
              }}
            >
              <FaFileAlt />
              Preview
            </button>

            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onOpenGoogle();
              }}
            >
              <FaExternalLinkAlt />
              Open Google Docs
            </button>

            <button
              type="button"
              disabled={syncing}
              onClick={() => {
                setMenu(false);
                onSync();
              }}
            >
              <FaSyncAlt />
              {syncing ? "Loading..." : "Sync"}
            </button>

            {canManageDocuments && (
              <>
                <button
                  type="button"
                  disabled={sharing}
                  onClick={() => {
                    setMenu(false);
                    onShare("reader");
                  }}
                >
                  <FaShareAlt />
                  Share for viewing
                </button>

                <button
                  type="button"
                  disabled={sharing}
                  onClick={() => {
                    setMenu(false);
                    onShare("writer");
                  }}
                >
                  <FaShareAlt />
                  Share for editing
                </button>
              </>
            )}
            {canManageDocuments && (
              <button
                type="button"
                className="document-delete-menu-button"
                disabled={deleting}
                onClick={() => {
                  setMenu(false);
                  onDelete();
                }}
              >
                <FaTrash />
                {deleting ? "Deleting..." : "Delete Document"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function DocumentTemplateCard({ title, subtitle }) {
  return (
    <button
      type="button"
      className="workspace-template-card document-template-card"
    >
      <div className="document-template-preview">
        <div className="document-template-title" />

        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <strong>{title}</strong>
      <small>{subtitle}</small>
    </button>
  );
}

function getSyncLabel(status) {
  switch (status) {
    case "SYNCED":
      return "Synchronized";

    case "FAILED":
      return "Sync Failed";

    case "NOT_SYNCED":
      return "Not Synchronized";

    default:
      return status || "Not Synchronized";
  }
}

function formatDate(value) {
  if (!value) return "No date available";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWorkspaceDate(value) {
  if (!value) return "No date available";

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
