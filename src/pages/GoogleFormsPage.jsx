import GlideList from "../components/reactbits/GlideList";
import RubberSegment from "../components/reactbits/RubberSegment";
import GlideSelectField from "../components/reactbits/GlideSelectField";
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
  CirclePlus,
  X,
} from "lucide-react";
import GoogleFormsIcon from "../components/icons/GoogleFormsIcon";
import GoogleWorkspacePickerModal from "../components/GoogleWorkspacePickerModal";
import { toast } from "react-toastify";
import ConfirmToast from "../components/ConfirmToast";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  addGoogleFormQuestion,
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
      toast.error("Please log in to load Google Forms");
      return;
    }

    try {
      setLoading(true);

      const data = await getGoogleForms();

      setForms(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = getApiError(error, "Failed to load Google Forms");

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
      toast.warning("Please enter a form name");
      return;
    }

    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    try {
      setCreating(true);

      const createdForm = await createGoogleForm({
        title: title.trim(),
        type,
      });
      toast.success("Successfully created Google Form");

      setTitle("");
      setShowCreate(false);

      await loadForms();

      if (createdForm?.formUrl) {
        window.open(createdForm.formUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      const message = getApiError(error, "Failed to create Google Form");

      console.log("CREATE GOOGLE FORM ERROR:", message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditor = (form) => {
    if (!form.formUrl) {
      toast.warning("Google Form does not have an edit link");
      return;
    }

    window.open(form.formUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenResponder = (form) => {
    if (!form.responderUri) {
      toast.warning("Google Form does not have a response link");
      return;
    }

    window.open(form.responderUri, "_blank", "noopener,noreferrer");
  };

  const handleResponses = async (form) => {
    try {
      const data = await getGoogleFormResponses(form.formId);
      console.log("FORM RESPONSES:", data);

      if (Array.isArray(data)) {
        toast.info(`Form has ${data.length} responses`);
      } else {
        toast.info("Successfully loaded form responses");
      }
    } catch (error) {
      const message = getApiError(error, "Failed to load responses");

      console.log("LOAD FORM RESPONSES ERROR:", message);
      toast.error(message);
    }
  };
  const handleOpenQuestionModal = (form) => {
    if (!form?.formId) {
      toast.error("Form ID not found");
      return;
    }

    setSelectedForm(form);
    setShowQuestionModal(true);
  };

  const handleCloseQuestionModal = () => {
    if (addingQuestion) return;

    setShowQuestionModal(false);
    setSelectedForm(null);
  };

  const handleAddQuestion = async (question) => {
    if (!selectedForm?.formId) {
      toast.error("Form ID not found");
      return;
    }

    try {
      setAddingQuestion(true);

      await addGoogleFormQuestion(selectedForm.formId, question);

      toast.success("Question added successfully");

      setShowQuestionModal(false);
      setSelectedForm(null);

      await loadForms();
    } catch (error) {
      const message = getApiError(error, "Failed to add question");

      console.log("ADD FORM QUESTION ERROR:", message);
      toast.error(message);
    } finally {
      setAddingQuestion(false);
    }
  };
  const handleDelete = (form) => {
    toast(
      ({ closeToast }) => (
        <ConfirmToast
          message={`Are you sure you want to delete Google Form "${form.title}"?`}
          closeToast={closeToast}
          onConfirm={async () => {
            try {
              await deleteGoogleForm(form.formId);

              setForms((current) =>
                current.filter(
                  (item) => item.formId !== form.formId && item.id !== form.id,
                ),
              );

              toast.success("Successfully deleted Google Form");
            } catch (error) {
              const message = getApiError(
                error,
                "Failed to delete Google Form",
              );

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
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const [selectedForm, setSelectedForm] = useState(null);

  const [addingQuestion, setAddingQuestion] = useState(false);
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
                placeholder="Search Google Forms..."
              />
            </div>
          </div>

          <div className="workspace-content">
            <h3 className="workspace-section-title">Create New Google Form</h3>

            <div className="template-list">
              <button
                type="button"
                className="new-file-card form-new-card"
                onClick={() => setShowCreate(true)}
              >
                <div className="new-file-preview">
                  <Plus size={64} />
                </div>

                <span>New Form</span>
              </button>

              <FormTemplate title="Registration Form" />
              <FormTemplate title="Member Survey" />
              <FormTemplate title="CLB Feedback" />
              <FormTemplate title="Attendance Sheet" />
            </div>

            <div className="recent-header">
              <h3>Recent Forms</h3>

              <div className="workspace-owner-sort">
                <span>Owner</span>

                <RubberSegment as="div" className="recent-actions">
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
                      title="Sort"
                    >
                      <ArrowDownAZ size={20} />
                    </button>

                    {showSortMenu && (
                      <GlideList as="div" className="workspace-sort-menu">
                        <p>Sort by</p>

                        <button
                          type="button"
                          className={sortBy === "date" ? "active" : ""}
                          onClick={() => {
                            setSortBy("date");
                            setShowSortMenu(false);
                          }}
                        >
                          Date created
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
              <div className="workspace-status">Loading Google Forms...</div>
            ) : filteredForms.length === 0 ? (
              <div className="workspace-empty">
                <ClipboardList size={50} />

                <h2>No Google Forms Found</h2>

                <p>
                  There are no forms of type{" "}
                  {type === "EVENT" ? "Event" : "Club Activity"}.
                </p>

                <button type="button" onClick={() => setShowCreate(true)}>
                  Create Google Form
                </button>
              </div>
            ) : view === "grid" ? (
              <div className="workspace-files grid">
                {filteredForms.map((form) => (
                  <FormCard
                    key={form.formId || form.id}
                    form={form}
                    onAddQuestion={() => handleOpenQuestionModal(form)}
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
                onAddQuestion={handleOpenQuestionModal}
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
      {showQuestionModal && selectedForm && (
        <AddQuestionModal
          form={selectedForm}
          loading={addingQuestion}
          onClose={handleCloseQuestionModal}
          onSubmit={handleAddQuestion}
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
  onAddQuestion,
  onOpenEditor,
  onOpenResponder,
  onResponses,
  onDelete,
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

      {forms.map((form) => (
        <FormListRow
          key={form.formId || form.id}
          form={form}
          onAddQuestion={() => onAddQuestion(form)}
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
  onAddQuestion,
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
              Edit Form
            </button>
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onAddQuestion();
              }}
            >
              <CirclePlus size={16} />
              Add Question
            </button>
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onOpenResponder();
              }}
            >
              <ExternalLink size={16} />
              Open Form Responses
            </button>

            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onResponses();
              }}
            >
              <ClipboardList size={16} />
              View Responses
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
  onAddQuestion,
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
                  Edit Form
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onOpenResponder();
                  }}
                >
                  <ExternalLink size={16} />
                  Open Form Responses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onAddQuestion();
                  }}
                >
                  <CirclePlus size={16} />
                  Add Question
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    onResponses();
                  }}
                >
                  <ClipboardList size={16} />
                  View Responses
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
          <GoogleFormsIcon size={34} />
        </div>
        <h2>Create Google Form</h2>

        <p className="workspace-modal-description">
          Type: {type === "EVENT" ? "Event" : "Club Activity"}
        </p>

        <label>Title</label>

        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Enter Form Title..."
          disabled={loading}
        />

        <div className="workspace-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Form"}
          </button>
        </div>
      </form>
    </div>
  );
}
function AddQuestionModal({ form, loading, onClose, onSubmit }) {
  const [question, setQuestion] = useState({
    title: "",
    type: "TEXT",
    required: false,
    options: ["", ""],
  });

  const typesWithOptions = ["MULTIPLE_CHOICE", "CHECKBOX", "DROPDOWN"];

  const needOptions = typesWithOptions.includes(question.type);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setQuestion((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleOptionChange = (index, value) => {
    setQuestion((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    }));
  };

  const handleAddOption = () => {
    setQuestion((current) => ({
      ...current,
      options: [...current.options, ""],
    }));
  };

  const handleRemoveOption = (index) => {
    setQuestion((current) => ({
      ...current,
      options: current.options.filter(
        (_, optionIndex) => optionIndex !== index,
      ),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!question.title.trim()) {
      toast.warning("Please enter the question content");
      return;
    }

    const cleanedOptions = needOptions
      ? question.options.map((option) => option.trim()).filter(Boolean)
      : [];

    if (needOptions && cleanedOptions.length < 2) {
      toast.warning("The question must have at least 2 options");
      return;
    }

    onSubmit({
      title: question.title.trim(),
      type: question.type,
      required: question.required,
      options: cleanedOptions,
    });
  };

  return (
    <div className="workspace-modal-backdrop" onMouseDown={onClose}>
      <form
        className="workspace-modal question-modal"
        onSubmit={handleSubmit}
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
          <GoogleFormsIcon size={34} />
        </div>

        <h2>Add Question</h2>

        <p className="workspace-modal-description">Form: {form.title}</p>

        <label>Question Content</label>

        <input
          autoFocus
          name="title"
          value={question.title}
          onChange={handleChange}
          placeholder="Example: Do you want to participate in the event?"
          disabled={loading}
        />

        <label>Question Type</label>

        <GlideSelectField
          name="type"
          value={question.type}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="TEXT">Short Answer</option>

          <option value="PARAGRAPH">Paragraph</option>

          <option value="MULTIPLE_CHOICE">Multiple Choice</option>

          <option value="CHECKBOX">Checkbox</option>

          <option value="DROPDOWN">Dropdown</option>
        </GlideSelectField>

        {needOptions && (
          <div className="question-options">
            <div className="question-options-header">
              <label>Options</label>

              <button
                type="button"
                onClick={handleAddOption}
                disabled={loading}
              >
                <Plus size={16} />
                Add Option
              </button>
            </div>

            {question.options.map((option, index) => (
              <div className="question-option-row" key={index}>
                <input
                  value={option}
                  onChange={(event) =>
                    handleOptionChange(index, event.target.value)
                  }
                  placeholder={`Option ${index + 1}`}
                  disabled={loading}
                />

                {question.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    disabled={loading}
                    aria-label="Remove option"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <label className="question-required">
          <input
            name="required"
            type="checkbox"
            checked={question.required}
            onChange={handleChange}
            disabled={loading}
          />

          <span>Required</span>
        </label>

        <div className="workspace-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>

          <button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Question"}
          </button>
        </div>
      </form>
    </div>
  );
}
function formatWorkspaceDate(value) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
