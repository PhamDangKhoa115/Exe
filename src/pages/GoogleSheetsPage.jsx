import GoogleWorkspaceActions from "../components/GoogleWorkspaceActions";
import "../components/GoogleWorkspaceActions.css";
import GlideList from "../components/reactbits/GlideList";
import RubberSegment from "../components/reactbits/RubberSegment";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Edit3,
  Eye,
  FileSpreadsheet,
  Grid3X3,
  List,
  MoreVertical,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { ArrowDownAZ, FolderOpen } from "lucide-react";
import GoogleWorkspacePickerModal from "../components/GoogleWorkspacePickerModal";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ConfirmToast from "../components/ConfirmToast";
import {
  createSpreadsheet,
  deleteSpreadsheet,
  getSpreadsheets,
  getSpreadsheetValues,
  updateSpreadsheetValues,
  updateSpreadsheetTitle,
  updateSpreadsheetType,
} from "../api/googleSheetsApi";
import { getApiError } from "../utils/getApiError";

export default function GoogleSheetsPage() {
  const userId = localStorage.getItem("userId");

  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("selectedClubRole") || "MEMBER";
  const canEditMetadata = ["PRESIDENT", "TREASURER"].includes(role.toUpperCase());
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("EVENT");
  const [savingMetadata, setSavingMetadata] = useState(false);
  const metadataBusyRef = useRef(false);
  const handleEditMetadata = (sheet) => {
    if (!canEditMetadata || metadataBusyRef.current) return;
    if (!sheet?.spreadsheetId) { toast.error("Spreadsheet ID not found"); return; }
    setEditingItem(sheet);
    setEditTitle(sheet.title || "");
    setEditType(sheet.type);
  };
  const handleCloseMetadata = () => { if (!metadataBusyRef.current) setEditingItem(null); };
  const handleSaveMetadata = async event => {
    event.preventDefault();
    if (metadataBusyRef.current || !editingItem || !canEditMetadata) return;
    if (!editTitle.trim()) { toast.warning("Please enter a title"); return; }
    if (!["EVENT", "CLUB_ACTIVITIES"].includes(editType)) { toast.warning("Please select a supported type"); return; }
    metadataBusyRef.current = true;
    setSavingMetadata(true);
    const id = editingItem.spreadsheetId;
    const apply = patch => {
      setSheets(current => current.map(entry => entry.spreadsheetId === id ? { ...entry, ...patch } : entry));
      setEditingItem(current => current ? { ...current, ...patch } : current);
    };
    try {
      if (editTitle.trim() !== editingItem.title) {
        await updateSpreadsheetTitle(id, editTitle.trim());
        apply({ title: editTitle.trim() });
      }
      if (editType !== editingItem.type) {
        await updateSpreadsheetType(id, editType);
        apply({ type: editType });
      }
      setType(editType);
      setEditingItem(null);
      toast.success("Sheet updated successfully");
    } catch (error) {
      toast.error(getApiError(error, "Failed to update sheet. Any completed changes have been kept."));
    } finally { metadataBusyRef.current = false; setSavingMetadata(false); }
  };

  const [search, setSearch] = useState("");
  const [type, setType] = useState("EVENT");
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);

  const [selectedSheet, setSelectedSheet] = useState(null);

  const [sheetRange, setSheetRange] = useState("Sheet1!A1:D10");

  const [sheetValues, setSheetValues] = useState([]);

  const [loadingValues, setLoadingValues] = useState(false);

  const [savingValues, setSavingValues] = useState(false);

  const [dataMode, setDataMode] = useState("view");
  const loadSheets = async () => {
    if (!userId) {
      toast.error("Please log in to load spreadsheets");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getSpreadsheets();

      console.log("GOOGLE SHEETS:", data);

      setSheets(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = getApiError(error, "Failed to load spreadsheets");

      console.log("LOAD SHEETS ERROR:", message);

      toast.error(message);

      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheets();
  }, [userId]);

  const filteredSheets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = sheets.filter((sheet) => {
      const matchSearch = (sheet.title || "").toLowerCase().includes(keyword);

      const matchType = sheet.type === type;

      return matchSearch && matchType;
    });

    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "", "vi", {
          sensitivity: "base",
        });
      } else {
        comparison =
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime();
      }

      return sortDir === "asc" ? comparison : -comparison;
    });

    return result;
  }, [sheets, search, type, sortBy, sortDir]);
  const handlePickerSelect = (sheet) => {
    handleOpen(sheet);
  };
  const handleCreate = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.warning("Please enter a name for the spreadsheet");
      return;
    }

    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    try {
      setCreating(true);

      const createdSheet = await createSpreadsheet({
        title: title.trim(),
        type,
      });
      console.log("CREATED SHEET:", createdSheet);

      toast.success("Spreadsheet created successfully");

      setTitle("");
      setShowCreate(false);

      await loadSheets();

      if (createdSheet?.spreadsheetUrl) {
        window.open(
          createdSheet.spreadsheetUrl,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } catch (error) {
      const message = getApiError(error, "Failed to create spreadsheet");

      console.log("CREATE SHEET ERROR:", message);

      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = (sheet) => {
    if (!sheet.spreadsheetUrl) {
      toast.warning("Spreadsheet does not have a URL");
      return;
    }

    window.open(sheet.spreadsheetUrl, "_blank", "noopener,noreferrer");
  };
  const handleOpenDataModal = async (sheet, mode = "view") => {
    if (!sheet?.spreadsheetId) {
      toast.error("Spreadsheet ID not found");
      return;
    }

    setSelectedSheet(sheet);
    setDataMode(mode);
    setShowDataModal(true);

    await handleLoadValues(sheet, "Sheet1!A1:D10");
  };

  const handleLoadValues = async (
    sheet = selectedSheet,
    range = sheetRange,
  ) => {
    if (!sheet?.spreadsheetId) {
      toast.error("Spreadsheet ID not found");
      return;
    }

    if (!range.trim()) {
      toast.warning("Please enter a data range");
      return;
    }

    try {
      setLoadingValues(true);

      const data = await getSpreadsheetValues({
        spreadsheetId: sheet.spreadsheetId,
        range: range.trim(),
      });

      console.log("SHEET VALUES:", data);

      const values = Array.isArray(data)
        ? data
        : Array.isArray(data?.values)
          ? data.values
          : [];

      setSheetValues(values);
    } catch (error) {
      const message = getApiError(error, "Failed to read spreadsheet data");

      console.log("LOAD SHEET VALUES ERROR:", message);

      toast.error(message);
      setSheetValues([]);
    } finally {
      setLoadingValues(false);
    }
  };

  const handleSaveValues = async () => {
    if (!selectedSheet?.spreadsheetId) {
      toast.error("Spreadsheet ID not found");
      return;
    }

    if (!sheetRange.trim()) {
      toast.warning("Please enter a data range");
      return;
    }

    try {
      setSavingValues(true);

      await updateSpreadsheetValues({
        spreadsheetId: selectedSheet.spreadsheetId,
        range: sheetRange.trim(),
        values: sheetValues,
      });

      toast.success("Spreadsheet data updated successfully");

      setDataMode("view");
    } catch (error) {
      const message = getApiError(error, "Failed to update spreadsheet data");

      console.log("SAVE SHEET VALUES ERROR:", message);

      toast.error(message);
    } finally {
      setSavingValues(false);
    }
  };

  const handleCloseDataModal = () => {
    if (savingValues || loadingValues) return;

    setShowDataModal(false);
    setSelectedSheet(null);
    setSheetValues([]);
    setSheetRange("Sheet1!A1:D10");
    setDataMode("view");
  };
  const handleDelete = (sheet) => {
    toast(
      ({ closeToast }) => (
        <ConfirmToast
          message={`Are you sure you want to delete the spreadsheet "${sheet.title}"?`}
          closeToast={closeToast}
          onConfirm={async () => {
            try {
              await deleteSpreadsheet(sheet.spreadsheetId);
              setSheets((current) =>
                current.filter(
                  (item) =>
                    item.spreadsheetId !== sheet.spreadsheetId &&
                    item.id !== sheet.id,
                ),
              );

              toast.success("Spreadsheet deleted successfully");
            } catch (error) {
              const message = getApiError(
                error,
                "Failed to delete spreadsheet",
              );

              console.log("DELETE SHEET ERROR:", message);
              toast.error(message);

              throw error;
            }
          }}
        />
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      },
    );
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page / Spreadsheets" />

        <section className="google-workspace-page sheets-page">
          <div className="workspace-header">
            <div className="workspace-title">
              <FileSpreadsheet size={27} />

              <h1>Spreadsheets</h1>
            </div>

            <RubberSegment as="div" className="workspace-tabs">
              <button
                type="button"
                className={type === "EVENT" ? "active" : ""}
                onClick={() => setType("EVENT")}
              >
                Event
              </button>

              <button
                type="button"
                className={type === "CLUB_ACTIVITIES" ? "active" : ""}
                onClick={() => setType("CLUB_ACTIVITIES")}
              >
                Club Activity
              </button>
            </RubberSegment>

            <div className="workspace-search">
              <Search size={19} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search Spreadsheets..."
              />
            </div>
          </div>

          <div className="workspace-content">
            <h3 className="workspace-section-title">Create New Spreadsheet</h3>

            <div className="template-list">
              <button
                type="button"
                className="new-file-card"
                onClick={() => setShowCreate(true)}
              >
                <div className="new-file-preview">
                  <Plus size={64} />
                </div>

                <span>New Spreadsheet</span>
              </button>

              <TemplateCard title="Annual budget" />

              <TemplateCard title="To do list" />

              <TemplateCard title="Monthly budget" />

              <TemplateCard title="Event finance" />

              <TemplateCard title="Work schedule" />
            </div>

            <div className="recent-header">
              <h3>Recent Spreadsheets</h3>

              <div className="workspace-owner-sort">
                <span>Owner</span>

                <RubberSegment as="div" className="recent-actions">
                  <button
                    type="button"
                    className={view === "grid" ? "active" : ""}
                    onClick={() => setView("grid")}
                    title="Grid View"
                  >
                    <Grid3X3 size={19} />
                  </button>
                  <button
                    type="button"
                    className={view === "list" ? "active" : ""}
                    onClick={() => setView("list")}
                    title="List View"
                  >
                    <List size={20} />
                  </button>

                  <div className="workspace-sort-wrap">
                    <button
                      type="button"
                      className={showSortMenu ? "active" : ""}
                      onClick={() => setShowSortMenu((current) => !current)}
                      title="Sort"
                    >
                      <ArrowDownAZ size={20} />
                    </button>

                    {showSortMenu && (
                      <GlideList as="div" className="workspace-sort-menu">
                        <p>Sort by </p>

                        <button
                          type="button"
                          className={sortBy === "date" ? "active" : ""}
                          onClick={() => {
                            setSortBy("date");
                            setShowSortMenu(false);
                          }}
                        >
                          Date Created
                        </button>

                        <button
                          type="button"
                          className={sortBy === "title" ? "active" : ""}
                          onClick={() => {
                            setSortBy("title");
                            setShowSortMenu(false);
                          }}
                        >
                          Name
                        </button>

                        <p>Order</p>

                        <button
                          type="button"
                          className={sortDir === "asc" ? "active" : ""}
                          onClick={() => {
                            setSortDir("asc");
                            setShowSortMenu(false);
                          }}
                        >
                          Ascending
                        </button>

                        <button
                          type="button"
                          className={sortDir === "desc" ? "active" : ""}
                          onClick={() => {
                            setSortDir("desc");
                            setShowSortMenu(false);
                          }}
                        >
                          Descending
                        </button>
                      </GlideList>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    title="Open File"
                  >
                    <FolderOpen size={20} />
                  </button>
                </RubberSegment>
              </div>
            </div>
            {loading ? (
              <div className="workspace-status">Loading Spreadsheets...</div>
            ) : filteredSheets.length === 0 ? (
              <div className="workspace-empty">
                <FileSpreadsheet size={50} />

                <h2>No Spreadsheets Found</h2>

                <p>
                  There are no spreadsheets of type{" "}
                  {type === "EVENT" ? "Event" : "Club Activity"}.
                </p>

                <button type="button" onClick={() => setShowCreate(true)}>
                  Create Spreadsheet
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="workspace-files grid">
                {filteredSheets.map((sheet) => (
                  <SheetCard
                    key={sheet.spreadsheetId || sheet.id}
                    sheet={sheet}
                    onOpen={() => handleOpen(sheet)}
                    onViewData={() => handleOpenDataModal(sheet, "view")}
                    onEditData={() => handleOpenDataModal(sheet, "edit")}
                    onEdit={canEditMetadata ? () => handleEditMetadata(sheet) : undefined}
                    onDelete={() => handleDelete(sheet)}
                  />
                ))}
              </div>
            ) : (
              <SheetsList
                sheets={filteredSheets}
                onOpen={handleOpen}
                onViewData={(sheet) => handleOpenDataModal(sheet, "view")}
                onEditData={(sheet) => handleOpenDataModal(sheet, "edit")}
                onEdit={canEditMetadata ? handleEditMetadata : undefined}
                onDelete={handleDelete}
              />
            )}
          </div>
        </section>
      </main>

      {editingItem && (
        <CreateWorkspaceModal editing value={editTitle} onChange={setEditTitle} type={editType}
          onTypeChange={setEditType} onClose={handleCloseMetadata} onSubmit={handleSaveMetadata} loading={savingMetadata} />
      )}
      {showCreate && (
        <CreateWorkspaceModal
          value={title}
          onChange={setTitle}
          onClose={() => {
            if (!creating) {
              setShowCreate(false);
              setTitle("");
            }
          }}
          onSubmit={handleCreate}
          loading={creating}
          type={type}
        />
      )}
      {showDataModal && selectedSheet && (
        <SpreadsheetDataModal
          sheet={selectedSheet}
          range={sheetRange}
          onRangeChange={setSheetRange}
          values={sheetValues}
          onValuesChange={setSheetValues}
          mode={dataMode}
          onModeChange={setDataMode}
          loading={loadingValues}
          saving={savingValues}
          onReload={() => handleLoadValues(selectedSheet, sheetRange)}
          onSave={handleSaveValues}
          onClose={handleCloseDataModal}
        />
      )}
      <GoogleWorkspacePickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        items={sheets}
        loading={loading}
        type="sheet"
        onSelect={handlePickerSelect}
      />
    </div>
  );
}

function TemplateCard({ title }) {
  return (
    <button type="button" className="workspace-template-card">
      <div className="sheet-template-preview">
        <div />

        <span />
        <span />
        <span />
        <span />
      </div>

      <span>{title}</span>
    </button>
  );
}

function SheetCard({ sheet, onOpen, onViewData, onEditData, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false);

  const formattedDate = sheet.createdAt
    ? new Date(sheet.createdAt).toLocaleDateString("en-US")
    : "No date available";

  return (
    <article className="workspace-file-card">
      <button type="button" className="workspace-file-preview" onClick={onOpen}>
        <div className="sheet-preview">
          <div className="sheet-preview-header" />

          {Array.from({ length: 20 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      </button>

      <div className="workspace-file-info">
        <h4 title={sheet.title}>{sheet.title || "Untitled Spreadsheet"}</h4>

        <div className="workspace-file-meta">
          <FileSpreadsheet size={18} />

          <span>{formattedDate}</span>

          <div className="workspace-card-menu">
            <button
              type="button"
              aria-label={`Open menu for ${sheet.title}`}
              onClick={() => setMenu((current) => !current)}
            >
              <MoreVertical size={18} />
            </button>

            {menu && (
              <div className="workspace-menu-dropdown">
                <GoogleWorkspaceActions onEdit={onEdit} onClose={() => setMenu(false)} />
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onEditData();
                  }}
                >
                  <Edit3 size={16} />
                  Edit Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onOpen();
                  }}
                >
                  <FileSpreadsheet size={16} />
                  View Spreadsheet
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setMenu(false);
                    onDelete();
                  }}
                >
                  <Trash2 size={16} />
                  Delete Spreadsheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
function SheetsList({ sheets, onOpen, onViewData, onEditData, onEdit, onDelete }) {
  return (
    <div className="workspace-list-view">
      <div className="workspace-list-header">
        <span />

        <span>Name</span>

        <span className="owner-column">Owner</span>

        <span className="date-column">Last Updated</span>

        <span />
      </div>

      {sheets.map((sheet) => (
        <SheetListRow
          key={sheet.spreadsheetId || sheet.id}
          sheet={sheet}
          onOpen={() => onOpen(sheet)}
          onViewData={() => onViewData(sheet)}
          onEditData={() => onEditData(sheet)}
          onEdit={onEdit ? () => onEdit(sheet) : undefined}
          onDelete={() => onDelete(sheet)}
        />
      ))}
    </div>
  );
}

function SheetListRow({ sheet, onOpen, onViewData, onEditData, onEdit, onDelete }) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="workspace-list-row">
      <div className="workspace-list-icon sheet">
        <FileSpreadsheet size={18} />
      </div>

      <button type="button" className="workspace-list-name" onClick={onOpen}>
        <span>{sheet.title}</span>
      </button>

      <span className="workspace-list-owner">
        {sheet.userId === Number(localStorage.getItem("userId"))
          ? "I"
          : `User ${sheet.userId}`}
      </span>

      <span className="workspace-list-date">
        {formatWorkspaceDate(sheet.updatedAt || sheet.createdAt)}
      </span>

      <div className="workspace-list-menu-wrap">
        <button
          type="button"
          className="workspace-list-menu-button"
          onClick={() => setMenu((current) => !current)}
        >
          <MoreVertical size={18} />
        </button>

        {menu && (
          <div className="workspace-list-dropdown">
            <GoogleWorkspaceActions onEdit={onEdit} onClose={() => setMenu(false)} />
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onOpen();
              }}
            >
              <FileSpreadsheet size={16} />
              Open Spreadsheet
            </button>
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onViewData();
              }}
            >
              <Eye size={16} />
              View Data
            </button>

            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onEditData();
              }}
            >
              <Edit3 size={16} />
              Edit Data
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                setMenu(false);
                onDelete();
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
function formatWorkspaceDate(value) {
  if (!value) return "No date available";

  return new Date(value).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function CreateWorkspaceModal({
  value,
  onChange,
  onClose,
  onSubmit,
  loading,
  type,
  editing = false,
  onTypeChange,
}) {
  return (
    <div className="workspace-modal-backdrop" onMouseDown={onClose}>
      <form
        className="workspace-modal"
        onSubmit={onSubmit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="workspace-modal-close"
          onClick={onClose}
          disabled={loading}
        >
          <X size={20} />
        </button>

        <div className="workspace-modal-icon">
          <FileSpreadsheet size={32} />
        </div>

        <h2>{editing ? "Edit Sheet" : "Create Spreadsheet"}</h2>

        <p className="workspace-modal-description">
          Type: {type === "EVENT" ? "Event" : "Club Activity"}
        </p>

        {editing && <><label>Type</label><select className="workspace-edit-type" value={type} onChange={event => onTypeChange(event.target.value)} disabled={loading}>
          <option value="EVENT">Event</option><option value="CLUB_ACTIVITIES">Club Activity</option>
        </select></>}
        <label>Title</label>

        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter Spreadsheet name..."
          disabled={loading}
        />

        <div className="workspace-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>

          <button type="submit" disabled={loading}>
            {loading ? (editing ? "Saving..." : "Creating...") : (editing ? "Save" : "Create")}
          </button>
        </div>
      </form>
    </div>
  );
}
function SpreadsheetDataModal({
  sheet,
  range,
  onRangeChange,
  values,
  onValuesChange,
  mode,
  onModeChange,
  loading,
  saving,
  onReload,
  onSave,
  onClose,
}) {
  const selectedRole = localStorage.getItem("selectedClubRole");

  const canEdit = ["PRESIDENT", "TREASURER"].includes(selectedRole);

  const columnCount = Math.max(
    1,
    ...values.map((row) => (Array.isArray(row) ? row.length : 0)),
  );

  const normalizedValues =
    values.length > 0
      ? values.map((row) =>
          Array.from({ length: columnCount }, (_, index) => row?.[index] ?? ""),
        )
      : [Array.from({ length: columnCount }, () => "")];

  const handleCellChange = (rowIndex, columnIndex, value) => {
    onValuesChange((current) => {
      const nextValues =
        current.length > 0 ? current.map((row) => [...row]) : [[]];

      while (nextValues.length <= rowIndex) {
        nextValues.push([]);
      }

      while (nextValues[rowIndex].length <= columnIndex) {
        nextValues[rowIndex].push("");
      }

      nextValues[rowIndex][columnIndex] = value;

      return nextValues;
    });
  };

  const handleAddRow = () => {
    onValuesChange((current) => [
      ...current,
      Array.from({ length: columnCount }, () => ""),
    ]);
  };

  const handleAddColumn = () => {
    onValuesChange((current) => {
      if (current.length === 0) {
        return [[""]];
      }

      return current.map((row) => [...row, ""]);
    });
  };

  return (
    <div className="workspace-modal-backdrop" onMouseDown={onClose}>
      <div
        className="workspace-modal spreadsheet-data-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="workspace-modal-close"
          onClick={onClose}
          disabled={loading || saving}
        >
          <X size={20} />
        </button>

        <div className="spreadsheet-modal-heading">
          <div className="workspace-modal-icon">
            <FileSpreadsheet size={32} />
          </div>

          <div>
            <h2>{sheet.title}</h2>

            <p className="workspace-modal-description">
              {mode === "edit"
                ? "Edit Spreadsheet data"
                : "View Spreadsheet data"}
            </p>
          </div>
        </div>

        <div className="spreadsheet-range-row">
          <div>
            <label>Data range</label>

            <input
              value={range}
              onChange={(event) => onRangeChange(event.target.value)}
              placeholder="Sheet1!A1:D10"
              disabled={loading || saving}
            />
          </div>

          <button type="button" onClick={onReload} disabled={loading || saving}>
            {loading ? "Loading..." : "Load Data"}
          </button>
        </div>

        <div className="spreadsheet-modal-toolbar">
          <span>
            {normalizedValues.length} rows, {columnCount} columns
          </span>

          <div>
            {mode === "edit" && (
              <>
                <button type="button" onClick={handleAddRow} disabled={saving}>
                  <Plus size={16} />
                  Add Row
                </button>

                <button
                  type="button"
                  onClick={handleAddColumn}
                  disabled={saving}
                >
                  <Plus size={16} />
                  Add Column
                </button>
              </>
            )}

            {canEdit && mode === "view" && (
              <button type="button" onClick={() => onModeChange("edit")}>
                <Edit3 size={16} />
                Edit
              </button>
            )}
          </div>
        </div>

        {!canEdit && mode === "edit" && (
          <div className="spreadsheet-permission-warning">
            You do not have permission to edit data.
          </div>
        )}

        <div className="spreadsheet-table-wrap">
          {loading ? (
            <div className="workspace-status">Loading data...</div>
          ) : (
            <table className="spreadsheet-data-table">
              <thead>
                <tr>
                  <th className="row-number-cell">#</th>

                  {Array.from({ length: columnCount }, (_, index) => (
                    <th key={index}>{getColumnName(index)}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {normalizedValues.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <th className="row-number-cell">{rowIndex + 1}</th>

                    {row.map((cell, columnIndex) => (
                      <td key={columnIndex}>
                        {mode === "edit" && canEdit ? (
                          <input
                            value={cell ?? ""}
                            onChange={(event) =>
                              handleCellChange(
                                rowIndex,
                                columnIndex,
                                event.target.value,
                              )
                            }
                            disabled={saving}
                          />
                        ) : (
                          <span>{String(cell ?? "")}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="workspace-modal-actions">
          <button type="button" onClick={onClose} disabled={loading || saving}>
            Close
          </button>

          {mode === "edit" && canEdit && (
            <button type="button" onClick={onSave} disabled={loading || saving}>
              <Save size={17} />

              {saving ? "Saving..." : "Save Data"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getColumnName(index) {
  let columnName = "";
  let value = index + 1;

  while (value > 0) {
    const remainder = (value - 1) % 26;

    columnName = String.fromCharCode(65 + remainder) + columnName;

    value = Math.floor((value - 1) / 26);
  }

  return columnName;
}
