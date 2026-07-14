import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ClipboardList,
  Eye,
  ExternalLink,
  FileQuestion,
  FolderOpen,
  Grid3X3,
  List,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import GoogleFormsIcon from "../components/icons/GoogleFormsIcon";
import GoogleWorkspacePickerModal from "../components/GoogleWorkspacePickerModal";
import { toast } from "react-toastify";
import ConfirmToast from "../components/ConfirmToast";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  createGoogleForm,
  deleteGoogleForm,
  getGoogleForms,
  getGoogleFormResponses,
} from "../api/googleFormsApi";

import { getApiError } from "../utils/getApiError";

export default function GoogleFormsPage() {
  const userId = localStorage.getItem("userId");

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("EVENT");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const loadForms = async () => {
    if (!userId) {
      toast.error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      setLoading(true);

      const data = await getGoogleForms(userId);

      setForms(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = getApiError(error, "Không thể tải Google Forms");

      console.log("LOAD GOOGLE FORMS ERROR:", message);
      toast.error(message);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, [userId]);

  const filteredForms = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = forms.filter((form) => {
      const matchSearch = (form.title || "").toLowerCase().includes(keyword);

      const matchType = form.type === type;

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
  }, [forms, search, type, sortBy, sortDir]);
  const handlePickerSelect = (form) => {
    handleOpenEditor(form);
  };
  const [view, setView] = useState("grid");
  const handleCreate = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.warning("Vui lòng nhập tên Form");
      return;
    }

    if (!userId) {
      toast.error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      setCreating(true);

      const createdForm = await createGoogleForm({
        userId,
        title: title.trim(),
        type,
      });

      toast.success("Tạo Google Form thành công");

      setTitle("");
      setShowCreate(false);

      await loadForms();

      if (createdForm?.formUrl) {
        window.open(createdForm.formUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      const message = getApiError(error, "Không thể tạo Google Form");

      console.log("CREATE GOOGLE FORM ERROR:", message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditor = (form) => {
    if (!form.formUrl) {
      toast.warning("Google Form chưa có đường dẫn chỉnh sửa");
      return;
    }

    window.open(form.formUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenResponder = (form) => {
    if (!form.responderUri) {
      toast.warning("Google Form chưa có đường dẫn trả lời");
      return;
    }

    window.open(form.responderUri, "_blank", "noopener,noreferrer");
  };

  const handleResponses = async (form) => {
    try {
      const data = await getGoogleFormResponses(form.formId, userId);

      console.log("FORM RESPONSES:", data);

      if (Array.isArray(data)) {
        toast.info(`Form có ${data.length} phản hồi`);
      } else {
        toast.info("Đã tải dữ liệu phản hồi của Form");
      }
    } catch (error) {
      const message = getApiError(error, "Không thể tải phản hồi");

      console.log("LOAD FORM RESPONSES ERROR:", message);
      toast.error(message);
    }
  };

  const handleDelete = (form) => {
    toast(
      ({ closeToast }) => (
        <ConfirmToast
          message={`Bạn có chắc muốn xóa Google Form "${form.title}" không?`}
          closeToast={closeToast}
          onConfirm={async () => {
            try {
              await deleteGoogleForm(form.formId, userId);

              setForms((current) =>
                current.filter((item) => item.id !== form.id),
              );

              toast.success("Xóa Google Form thành công");
            } catch (error) {
              const message = getApiError(error, "Không thể xóa Google Form");

              console.log("DELETE GOOGLE FORM ERROR:", message);
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
        <Topbar title="Home Page / Google Forms" />

        <section className="google-workspace-page forms-page">
          <div className="workspace-header">
            <div className="workspace-title google-forms-title">
              <GoogleFormsIcon size={30} />
              <h1>Google Forms</h1>
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
                placeholder="Tìm kiếm Google Forms..."
              />
            </div>
          </div>

          <div className="workspace-content">
            <h3 className="workspace-section-title">Tạo Google Form mới</h3>

            <div className="template-list">
              <button
                type="button"
                className="new-file-card form-new-card"
                onClick={() => setShowCreate(true)}
              >
                <div className="new-file-preview">
                  <Plus size={64} />
                </div>

                <span>Form mới</span>
              </button>

              <FormTemplate title="Đăng ký sự kiện" />
              <FormTemplate title="Khảo sát thành viên" />
              <FormTemplate title="Phản hồi CLB" />
              <FormTemplate title="Điểm danh" />
            </div>

            <div className="recent-header">
              <h3>Google Form gần đây</h3>

              <div className="workspace-owner-sort">
                <span>Owner</span>

                <div className="recent-actions">
                  <button
                    type="button"
                    className={view === "grid" ? "active" : ""}
                    onClick={() => setView("grid")}
                  >
                    <Grid3X3 size={19} />
                  </button>

                  <button
                    type="button"
                    className={view === "list" ? "active" : ""}
                    onClick={() => setView("list")}
                  >
                    <List size={19} />
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
              <div className="workspace-status">Đang tải Google Forms...</div>
            ) : filteredForms.length === 0 ? (
              <div className="workspace-empty">
                <ClipboardList size={50} />

                <h2>Chưa có Google Form</h2>

                <p>
                  Không có Form thuộc loại{" "}
                  {type === "EVENT" ? "Event" : "Club Activity"}.
                </p>

                <button type="button" onClick={() => setShowCreate(true)}>
                  Tạo Google Form
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="workspace-files grid">
                {filteredForms.map((form) => (
                  <FormCard
                    key={form.id}
                    form={form}
                    onOpenEditor={() => handleOpenEditor(form)}
                    onOpenResponder={() => handleOpenResponder(form)}
                    onResponses={() => handleResponses(form)}
                    onDelete={() => handleDelete(form)}
                  />
                ))}
              </div>
            ) : (
              <FormsList
                forms={filteredForms}
                onOpenEditor={handleOpenEditor}
                onOpenResponder={handleOpenResponder}
                onResponses={handleResponses}
                onDelete={handleDelete}
              />
            )}
          </div>
        </section>
      </main>

      {showCreate && (
        <CreateFormModal
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
      <GoogleWorkspacePickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        items={forms}
        loading={loading}
        type="form"
        onSelect={handlePickerSelect}
      />
    </div>
  );
}
function FormsList({
  forms,
  onOpenEditor,
  onOpenResponder,
  onResponses,
  onDelete,
}) {
  return (
    <div className="workspace-list-view">
      <div className="workspace-list-header">
        <span />

        <span>Tên</span>

        <span className="owner-column">Chủ sở hữu</span>

        <span className="date-column">Ngày cập nhật</span>

        <span />
      </div>

      {forms.map((form) => (
        <FormListRow
          key={form.id}
          form={form}
          onOpenEditor={() => onOpenEditor(form)}
          onOpenResponder={() => onOpenResponder(form)}
          onResponses={() => onResponses(form)}
          onDelete={() => onDelete(form)}
        />
      ))}
    </div>
  );
}

function FormListRow({
  form,
  onOpenEditor,
  onOpenResponder,
  onResponses,
  onDelete,
}) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="workspace-list-row">
      <div className="workspace-list-icon form">
        <GoogleFormsIcon size={28} />
      </div>

      <button
        type="button"
        className="workspace-list-name"
        onClick={onOpenEditor}
      >
        <span>{form.title}</span>
      </button>

      <span className="workspace-list-owner">
        {form.userId === Number(localStorage.getItem("userId"))
          ? "Tôi"
          : `User ${form.userId}`}
      </span>

      <span className="workspace-list-date">
        {formatWorkspaceDate(form.updatedAt || form.createdAt)}
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
                onOpenEditor();
              }}
            >
              <Eye size={16} />
              Chỉnh sửa Form
            </button>

            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onOpenResponder();
              }}
            >
              <ExternalLink size={16} />
              Mở Form trả lời
            </button>

            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onResponses();
              }}
            >
              <ClipboardList size={16} />
              Xem phản hồi
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
function FormTemplate({ title }) {
  return (
    <button type="button" className="workspace-template-card">
      <div className="form-template-preview">
        <div />
        <strong />
        <span />
        <span />
        <span />
      </div>

      <span>{title}</span>
    </button>
  );
}

function FormCard({
  form,
  onOpenEditor,
  onOpenResponder,
  onResponses,
  onDelete,
}) {
  const [menu, setMenu] = useState(false);

  return (
    <article className="workspace-file-card">
      <button
        type="button"
        className="workspace-file-preview"
        onClick={onOpenEditor}
      >
        <div className="form-preview">
          <div />

          <strong />

          <span />
          <span />
          <span />
          <span />
        </div>
      </button>

      <div className="workspace-file-info">
        <h4 title={form.title}>{form.title}</h4>

        <div className="workspace-file-meta">
          <GoogleFormsIcon size={21} />
          <span>
            {form.createdAt
              ? new Date(form.createdAt).toLocaleDateString("vi-VN")
              : "Google Form"}
          </span>

          <div className="workspace-card-menu">
            <button
              type="button"
              aria-label={`Mở menu của ${form.title}`}
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
                    onOpenEditor();
                  }}
                >
                  <Eye size={16} />
                  Chỉnh sửa Form
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onOpenResponder();
                  }}
                >
                  <ExternalLink size={16} />
                  Mở Form trả lời
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onResponses();
                  }}
                >
                  <ClipboardList size={16} />
                  Xem phản hồi
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
      </div>
    </article>
  );
}

function CreateFormModal({
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
          <FileQuestion size={32} />
        </div>

        <h2>Tạo Google Form</h2>

        <p className="workspace-modal-description">
          Loại: {type === "EVENT" ? "Event" : "Club Activity"}
        </p>

        <label>Tiêu đề</label>

        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nhập tiêu đề Form..."
          disabled={loading}
        />

        <div className="workspace-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Hủy
          </button>

          <button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo Form"}
          </button>
        </div>
      </form>
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
