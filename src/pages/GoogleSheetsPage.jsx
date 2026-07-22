import { useEffect, useMemo, useState } from "react";
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
} from "../api/googleSheetsApi";
import { getApiError } from "../utils/getApiError";

export default function GoogleSheetsPage() {
  const userId = localStorage.getItem("userId");

  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

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
      toast.error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getSpreadsheets();

      console.log("GOOGLE SHEETS:", data);

      setSheets(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = getApiError(error, "Không thể tải Spreadsheet");

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
      toast.warning("Vui lòng nhập tên Spreadsheet");
      return;
    }

    if (!userId) {
      toast.error("Không tìm thấy userId");
      return;
    }

    try {
      setCreating(true);

      const createdSheet = await createSpreadsheet({
        title: title.trim(),
        type,
      });
      console.log("CREATED SHEET:", createdSheet);

      toast.success("Tạo Spreadsheet thành công");

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
      const message = getApiError(error, "Không thể tạo Spreadsheet");

      console.log("CREATE SHEET ERROR:", message);

      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = (sheet) => {
    if (!sheet.spreadsheetUrl) {
      toast.warning("Spreadsheet chưa có đường dẫn");
      return;
    }

    window.open(sheet.spreadsheetUrl, "_blank", "noopener,noreferrer");
  };
  const handleOpenDataModal = async (sheet, mode = "view") => {
    if (!sheet?.spreadsheetId) {
      toast.error("Không tìm thấy spreadsheetId");
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
      toast.error("Không tìm thấy Spreadsheet");
      return;
    }

    if (!range.trim()) {
      toast.warning("Vui lòng nhập vùng dữ liệu");
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
      const message = getApiError(error, "Không thể đọc dữ liệu Spreadsheet");

      console.log("LOAD SHEET VALUES ERROR:", message);

      toast.error(message);
      setSheetValues([]);
    } finally {
      setLoadingValues(false);
    }
  };

  const handleSaveValues = async () => {
    if (!selectedSheet?.spreadsheetId) {
      toast.error("Không tìm thấy Spreadsheet");
      return;
    }

    if (!sheetRange.trim()) {
      toast.warning("Vui lòng nhập vùng dữ liệu");
      return;
    }

    try {
      setSavingValues(true);

      await updateSpreadsheetValues({
        spreadsheetId: selectedSheet.spreadsheetId,
        range: sheetRange.trim(),
        values: sheetValues,
      });

      toast.success("Cập nhật dữ liệu Spreadsheet thành công");

      setDataMode("view");
    } catch (error) {
      const message = getApiError(
        error,
        "Không thể cập nhật dữ liệu Spreadsheet",
      );

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
          message={`Bạn có chắc muốn xóa Spreadsheet "${sheet.title}" không?`}
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

              toast.success("Xóa Spreadsheet thành công");
            } catch (error) {
              const message = getApiError(error, "Không thể xóa Spreadsheet");

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

            <div className="workspace-tabs">
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
            </div>

            <div className="workspace-search">
              <Search size={19} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm Spreadsheet..."
              />
            </div>
          </div>

          <div className="workspace-content">
            <h3 className="workspace-section-title">Tạo Spreadsheet mới</h3>

            <div className="template-list">
              <button
                type="button"
                className="new-file-card"
                onClick={() => setShowCreate(true)}
              >
                <div className="new-file-preview">
                  <Plus size={64} />
                </div>

                <span>Spreadsheet mới</span>
              </button>

              <TemplateCard title="Annual budget" />

              <TemplateCard title="To do list" />

              <TemplateCard title="Monthly budget" />

              <TemplateCard title="Event finance" />

              <TemplateCard title="Work schedule" />
            </div>

            <div className="recent-header">
              <h3>Spreadsheet gần đây</h3>

              <div className="workspace-owner-sort">
                <span>Owner</span>

                <div className="recent-actions">
                  <button
                    type="button"
                    className={view === "grid" ? "active" : ""}
                    onClick={() => setView("grid")}
                    title="Dạng lưới"
                  >
                    <Grid3X3 size={19} />
                  </button>
                  <button
                    type="button"
                    className={view === "list" ? "active" : ""}
                    onClick={() => setView("list")}
                    title="Dạng danh sách"
                  >
                    <List size={20} />
                  </button>

                  <div className="workspace-sort-wrap">
                    <button
                      type="button"
                      className={showSortMenu ? "active" : ""}
                      onClick={() => setShowSortMenu((current) => !current)}
                      title="Sắp xếp"
                    >
                      <ArrowDownAZ size={20} />
                    </button>

                    {showSortMenu && (
                      <div className="workspace-sort-menu">
                        <p>Sắp xếp theo</p>

                        <button
                          type="button"
                          className={sortBy === "date" ? "active" : ""}
                          onClick={() => {
                            setSortBy("date");
                            setShowSortMenu(false);
                          }}
                        >
                          Ngày tạo
                        </button>

                        <button
                          type="button"
                          className={sortBy === "title" ? "active" : ""}
                          onClick={() => {
                            setSortBy("title");
                            setShowSortMenu(false);
                          }}
                        >
                          Tên
                        </button>

                        <p>Thứ tự</p>

                        <button
                          type="button"
                          className={sortDir === "asc" ? "active" : ""}
                          onClick={() => {
                            setSortDir("asc");
                            setShowSortMenu(false);
                          }}
                        >
                          Tăng dần
                        </button>

                        <button
                          type="button"
                          className={sortDir === "desc" ? "active" : ""}
                          onClick={() => {
                            setSortDir("desc");
                            setShowSortMenu(false);
                          }}
                        >
                          Giảm dần
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    title="Mở tệp"
                  >
                    <FolderOpen size={20} />
                  </button>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="workspace-status">Đang tải Spreadsheet...</div>
            ) : filteredSheets.length === 0 ? (
              <div className="workspace-empty">
                <FileSpreadsheet size={50} />

                <h2>Chưa có Spreadsheet</h2>

                <p>
                  Không có Spreadsheet thuộc loại{" "}
                  {type === "EVENT" ? "Event" : "Club Activity"}.
                </p>

                <button type="button" onClick={() => setShowCreate(true)}>
                  Tạo Spreadsheet
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
                onDelete={handleDelete}
              />
            )}
          </div>
        </section>
      </main>

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

function SheetCard({ sheet, onOpen, onViewData, onEditData, onDelete }) {
  const [menu, setMenu] = useState(false);

  const formattedDate = sheet.createdAt
    ? new Date(sheet.createdAt).toLocaleDateString("vi-VN")
    : "Không rõ ngày";

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
              aria-label={`Mở menu của ${sheet.title}`}
              onClick={() => setMenu((current) => !current)}
            >
              <MoreVertical size={18} />
            </button>

            {menu && (
              <div className="workspace-menu-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onEditData();
                  }}
                >
                  <Edit3 size={16} />
                  Chỉnh sửa dữ liệu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onOpen();
                  }}
                >
                  <FileSpreadsheet size={16} />
                  Xem Spreadsheet
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
                  xóa spreadsheet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
function SheetsList({ sheets, onOpen, onViewData, onEditData, onDelete }) {
  return (
    <div className="workspace-list-view">
      <div className="workspace-list-header">
        <span />

        <span>Tên</span>

        <span className="owner-column">Chủ sở hữu</span>

        <span className="date-column">Ngày cập nhật</span>

        <span />
      </div>

      {sheets.map((sheet) => (
        <SheetListRow
          key={sheet.spreadsheetId || sheet.id}
          sheet={sheet}
          onOpen={() => onOpen(sheet)}
          onViewData={() => onViewData(sheet)}
          onEditData={() => onEditData(sheet)}
          onDelete={() => onDelete(sheet)}
        />
      ))}
    </div>
  );
}

function SheetListRow({ sheet, onOpen, onViewData, onEditData, onDelete }) {
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
          ? "Tôi"
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
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onOpen();
              }}
            >
              <FileSpreadsheet size={16} />
              Mở Spreadsheet
            </button>
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onViewData();
              }}
            >
              <Eye size={16} />
              Xem dữ liệu
            </button>

            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onEditData();
              }}
            >
              <Edit3 size={16} />
              Chỉnh sửa dữ liệu
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
              Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
function formatWorkspaceDate(value) {
  if (!value) return "Không rõ ngày";

  return new Date(value).toLocaleDateString("vi-VN", {
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

        <h2>Create Spreadsheet</h2>

        <p className="workspace-modal-description">
          Loại: {type === "EVENT" ? "Event" : "Club Activity"}
        </p>

        <label>Title</label>

        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nhập tên Spreadsheet..."
          disabled={loading}
        />

        <div className="workspace-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
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
            Array.from(
              { length: columnCount },
              (_, index) => row?.[index] ?? "",
            ),
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
                  ? "Chỉnh sửa dữ liệu Spreadsheet"
                  : "Xem dữ liệu Spreadsheet"}
              </p>
            </div>
          </div>

          <div className="spreadsheet-range-row">
            <div>
              <label>Vùng dữ liệu</label>

              <input
                value={range}
                onChange={(event) => onRangeChange(event.target.value)}
                placeholder="Sheet1!A1:D10"
                disabled={loading || saving}
              />
            </div>

            <button
              type="button"
              onClick={onReload}
              disabled={loading || saving}
            >
              {loading ? "Đang đọc..." : "Đọc dữ liệu"}
            </button>
          </div>

          <div className="spreadsheet-modal-toolbar">
            <span>
              {normalizedValues.length} hàng, {columnCount} cột
            </span>

            <div>
              {mode === "edit" && (
                <>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    disabled={saving}
                  >
                    <Plus size={16} />
                    Thêm hàng
                  </button>

                  <button
                    type="button"
                    onClick={handleAddColumn}
                    disabled={saving}
                  >
                    <Plus size={16} />
                    Thêm cột
                  </button>
                </>
              )}

              {canEdit && mode === "view" && (
                <button type="button" onClick={() => onModeChange("edit")}>
                  <Edit3 size={16} />
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          {!canEdit && mode === "edit" && (
            <div className="spreadsheet-permission-warning">
              Bạn không có quyền ghi dữ liệu.
            </div>
          )}

          <div className="spreadsheet-table-wrap">
            {loading ? (
              <div className="workspace-status">Đang tải dữ liệu...</div>
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
            <button
              type="button"
              onClick={onClose}
              disabled={loading || saving}
            >
              Đóng
            </button>

            {mode === "edit" && canEdit && (
              <button
                type="button"
                onClick={onSave}
                disabled={loading || saving}
              >
                <Save size={17} />

                {saving ? "Đang lưu..." : "Lưu dữ liệu"}
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
}
