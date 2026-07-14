import { useEffect, useMemo, useState } from "react";
import {
  FileQuestion,
  FileSpreadsheet,
  FolderOpen,
  Grid3X3,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

export default function GoogleWorkspacePickerModal({
  open,
  onClose,
  items = [],
  loading = false,
  type = "sheet",
  onSelect,
}) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedId(null);
      setShowFilter(false);
    }
  }, [open]);

  const normalizedItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = items.filter((item) =>
      (item.title || "").toLowerCase().includes(keyword),
    );

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
  }, [items, search, sortBy, sortDir]);

  if (!open) return null;

  const selectedItem = items.find((item) => item.id === selectedId);

  const handleOpen = () => {
    if (!selectedItem) return;

    onSelect?.(selectedItem);
    onClose();
  };

  const isSheet = type === "sheet";

  return (
    <div className="drive-picker-overlay" onMouseDown={onClose}>
      <section
        className="drive-picker-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="drive-picker-header">
          <div className="drive-picker-title">
            {isSheet ? (
              <FileSpreadsheet size={23} />
            ) : (
              <FileQuestion size={23} />
            )}

            <h2>Mở {isSheet ? "Spreadsheet" : "Google Form"}</h2>
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
              placeholder={
                isSheet ? "Tìm Spreadsheet..." : "Tìm Google Form..."
              }
            />

            <button
              type="button"
              title="Sắp xếp"
              onClick={() => setShowFilter((current) => !current)}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>

          {showFilter && (
            <div className="drive-picker-filter-menu workspace-picker-sort">
              <p>Sắp xếp theo</p>

              <button
                type="button"
                className={sortBy === "date" ? "active" : ""}
                onClick={() => setSortBy("date")}
              >
                Ngày tạo
              </button>

              <button
                type="button"
                className={sortBy === "title" ? "active" : ""}
                onClick={() => setSortBy("title")}
              >
                Tên
              </button>

              <p>Thứ tự</p>

              <button
                type="button"
                className={sortDir === "asc" ? "active" : ""}
                onClick={() => setSortDir("asc")}
              >
                Tăng dần
              </button>

              <button
                type="button"
                className={sortDir === "desc" ? "active" : ""}
                onClick={() => setSortDir("desc")}
              >
                Giảm dần
              </button>
            </div>
          )}
        </div>

        <nav className="drive-picker-tabs">
          <button type="button" className="active">
            Gần đây
          </button>

          <button type="button" disabled>
            Drive của tôi
          </button>

          <button type="button" disabled>
            Được chia sẻ với tôi
          </button>

          <button type="button" disabled>
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
            <div className="drive-picker-status">Đang tải dữ liệu...</div>
          ) : normalizedItems.length === 0 ? (
            <div className="drive-picker-empty">
              <FolderOpen size={48} />
              <h3>Không tìm thấy tệp</h3>
            </div>
          ) : (
            normalizedItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`drive-picker-file ${
                  selectedId === item.id ? "selected" : ""
                }`}
                onClick={() => setSelectedId(item.id)}
                onDoubleClick={() => {
                  onSelect?.(item);
                  onClose();
                }}
              >
                <div className="drive-picker-file-icon">
                  {isSheet ? (
                    <FileSpreadsheet size={22} />
                  ) : (
                    <FileQuestion size={22} />
                  )}
                </div>

                <div className="drive-picker-file-info">
                  <strong>{item.title}</strong>

                  <span>
                    {item.type === "EVENT" ? "Event" : "Club Activity"}
                  </span>
                </div>

                <time>{formatDate(item.createdAt)}</time>
              </button>
            ))
          )}
        </div>

        <footer className="drive-picker-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Hủy
          </button>

          <button
            type="button"
            className="primary"
            disabled={!selectedItem}
            onClick={handleOpen}
          >
            Mở
          </button>
        </footer>
      </section>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("vi-VN");
}
