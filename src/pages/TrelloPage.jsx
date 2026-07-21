import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  Link2,
  ListTodo,
  Pencil,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  KanbanSquare,
  UserRoundCheck,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  connectTrello,
  createTask,
  deleteTask,
  getMemberPerformance,
  getTaskDashboard,
  getTaskReminders,
  getTasks,
  getTrelloBoards,
  linkTrelloBoard,
  getClubMembers,
  updateTask,
} from "../api/trelloApi";
import { useSearchParams } from "react-router-dom";
import "../styles.css";

const EMPTY_TASK_FORM = {
  title: "",
  description: "",
  eventId: "",
  assignedUserId: "",
  status: "To Do",
  dueDate: "",
  department: "",
  financeRelated: false,
  eventCritical: false,
};

const STATUS_COLUMNS = [
  {
    key: "To Do",
    label: "To Do",
    className: "todo",
  },
  {
    key: "Doing",
    label: "Doing",
    className: "doing",
  },
  {
    key: "Done",
    label: "Done",
    className: "done",
  },
];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export default function TrelloPage() {
  const selectedClubName =
    localStorage.getItem("selectedClubName") || "Câu lạc bộ";

  const [activeTab, setActiveTab] = useState("board");

  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingStatistics, setLoadingStatistics] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [linkingBoard, setLinkingBoard] = useState(false);

  const [trelloConnected, setTrelloConnected] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [savingTask, setSavingTask] = useState(false);

  const [form, setForm] = useState(EMPTY_TASK_FORM);

  const [filters, setFilters] = useState({
    filterType: "ALL",
    status: "",
    department: "",
    eventId: "",
  });

  const [searchText, setSearchText] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);

      const data = await getTasks(filters);

      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("LOAD TASKS ERROR:", error);

      toast.error(getErrorMessage(error, "Không thể tải danh sách công việc."));

      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, [filters]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoadingStatistics(true);

      const [dashboardData, reminderData, performanceData] = await Promise.all([
        getTaskDashboard(),
        getTaskReminders(),
        getMemberPerformance(),
      ]);

      setDashboard(dashboardData || null);
      setReminders(Array.isArray(reminderData) ? reminderData : []);
      setPerformance(Array.isArray(performanceData) ? performanceData : []);
    } catch (error) {
      console.error("LOAD STATISTICS ERROR:", error);

      toast.error(
        getErrorMessage(error, "Không thể tải dữ liệu thống kê công việc."),
      );
    } finally {
      setLoadingStatistics(false);
    }
  }, []);
  const loadMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);

      const data = await getClubMembers();

      const activeMembers = Array.isArray(data)
        ? data.filter((member) => member.status === "ACTIVE")
        : [];

      setMembers(activeMembers);
    } catch (error) {
      console.error("LOAD CLUB MEMBERS ERROR:", error.response?.data || error);

      toast.error(
        getErrorMessage(error, "Không thể tải danh sách thành viên CLB."),
      );

      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);
  const loadBoards = useCallback(
    async ({ showError = false } = {}) => {
      try {
        setLoadingBoards(true);

        const data = await getTrelloBoards();
        const boardList = Array.isArray(data) ? data : [];

        setBoards(boardList);
        setTrelloConnected(true);

        if (boardList.length > 0 && !selectedBoardId) {
          setSelectedBoardId(boardList[0].id);
        }
      } catch (error) {
        console.error("LOAD TRELLO BOARDS ERROR:", error);

        setBoards([]);
        setTrelloConnected(false);

        if (showError) {
          toast.error(
            getErrorMessage(
              error,
              "Chưa kết nối Trello hoặc không thể tải danh sách Board.",
            ),
          );
        }
      } finally {
        setLoadingBoards(false);
      }
    },
    [selectedBoardId],
  );
  useEffect(() => {
    loadTasks();
    loadDashboardData();
    loadMembers();
  }, [loadTasks, loadDashboardData, loadMembers]);
  useEffect(() => {
    const callbackClubId = searchParams.get("clubId");

    if (!callbackClubId) return;

    const selectedClubId = localStorage.getItem("selectedClubId");

    if (!selectedClubId || String(selectedClubId) !== String(callbackClubId)) {
      localStorage.setItem("selectedClubId", callbackClubId);
    }

    toast.success("Kết nối Trello thành công.");

    loadBoards({
      showError: true,
    });

    // Xóa ?clubId=6 khỏi URL để tránh hiện toast lại khi refresh.
    setSearchParams(
      {},
      {
        replace: true,
      },
    );
  }, [searchParams, setSearchParams, loadBoards]);
  const filteredTasks = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return tasks;

    return tasks.filter((task) => {
      const searchableText = [
        task.title,
        task.description,
        task.department,
        task.assignedUserName,
        task.eventTitle,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [tasks, searchText]);

  const tasksByStatus = useMemo(() => {
    return {
      "To Do": filteredTasks.filter(
        (task) => normalizeStatus(task.status) === "To Do",
      ),
      Doing: filteredTasks.filter(
        (task) => normalizeStatus(task.status) === "Doing",
      ),
      Done: filteredTasks.filter(
        (task) => normalizeStatus(task.status) === "Done",
      ),
    };
  }, [filteredTasks]);

  const openCreateTaskModal = (defaultStatus = "To Do") => {
    setEditingTask(null);

    setForm({
      ...EMPTY_TASK_FORM,
      status: defaultStatus,
    });

    setShowTaskModal(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);

    setForm({
      title: task.title || "",
      description: task.description || "",
      eventId: task.eventId || "",
      assignedUserId: task.assignedUserId || "",
      status: normalizeStatus(task.status),
      dueDate: toDateTimeLocal(task.dueDate),
      department: task.department || "",
      isFinanceRelated: Boolean(task.isFinanceRelated),
      isEventCritical: Boolean(task.isEventCritical),
    });

    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    if (savingTask) return;

    setShowTaskModal(false);
    setEditingTask(null);
    setForm(EMPTY_TASK_FORM);
  };

  const validateTaskForm = () => {
    if (!form.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc.");
      return false;
    }

    if (!form.assignedUserId) {
      toast.error("Vui lòng chọn thành viên được giao.");
      return false;
    }
    if (!form.dueDate) {
      toast.error("Vui lòng chọn hạn hoàn thành.");
      return false;
    }

    const dueDate = new Date(form.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      toast.error("Hạn hoàn thành không hợp lệ.");
      return false;
    }

    return true;
  };

  const handleSaveTask = async () => {
    if (!validateTaskForm()) return;

    try {
      setSavingTask(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        eventId: form.eventId ? Number(form.eventId) : null,
        assignedUserId: Number(form.assignedUserId),
        status: form.status,
        dueDate: new Date(form.dueDate).toISOString(),
        department: form.department.trim(),
        isFinanceRelated: Boolean(form.financeRelated),
        isEventCritical: Boolean(form.eventCritical),
      };
      if (editingTask) {
        await updateTask(editingTask.taskId, payload);
        toast.success("Cập nhật công việc thành công.");
      } else {
        await createTask(payload);
        toast.success("Tạo công việc thành công.");
      }

      closeTaskModal();

      await Promise.all([loadTasks(), loadDashboardData()]);
    } catch (error) {
      console.error("SAVE TASK ERROR:", error);

      toast.error(
        getErrorMessage(
          error,
          editingTask
            ? "Không thể cập nhật công việc."
            : "Không thể tạo công việc.",
        ),
      );
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa công việc "${task.title}" không?`,
    );

    if (!confirmed) return;

    try {
      await deleteTask(task.taskId);

      toast.success("Xóa công việc thành công.");

      await Promise.all([loadTasks(), loadDashboardData()]);
    } catch (error) {
      console.error("DELETE TASK ERROR:", error);

      toast.error(getErrorMessage(error, "Không thể xóa công việc."));
    }
  };

  const handleMoveTask = async (task, nextStatus) => {
    const normalizedCurrentStatus = normalizeStatus(task.status);

    if (normalizedCurrentStatus === nextStatus) return;

    try {
      const payload = {
        title: task.title || "",
        description: task.description || "",
        eventId: task.eventId || null,
        assignedUserId: task.assignedUserId,
        status: nextStatus,
        dueDate: task.dueDate,
        department: task.department || "",
        isFinanceRelated: Boolean(task.isFinanceRelated),
        isEventCritical: Boolean(task.isEventCritical),
      };

      await updateTask(task.taskId, payload);

      toast.success(`Đã chuyển công việc sang ${nextStatus}.`);

      await Promise.all([loadTasks(), loadDashboardData()]);
    } catch (error) {
      console.error("MOVE TASK ERROR:", error);

      toast.error(
        getErrorMessage(error, "Không thể thay đổi trạng thái công việc."),
      );
    }
  };

  const handleConnectTrello = async () => {
    try {
      await connectTrello();
    } catch (error) {
      console.error("CONNECT TRELLO ERROR:", error);

      toast.error(getErrorMessage(error, "Không thể bắt đầu kết nối Trello."));
    }
  };

  const handleLinkBoard = async () => {
    if (!selectedBoardId) {
      toast.error("Vui lòng chọn một Trello Board.");
      return;
    }

    try {
      setLinkingBoard(true);

      await linkTrelloBoard(selectedBoardId);

      toast.success(
        "Liên kết Trello Board thành công. Hệ thống đã tạo các danh sách mặc định và đăng ký Webhook.",
      );

      await Promise.all([loadBoards({ showError: true }), loadTasks()]);
    } catch (error) {
      console.error("LINK BOARD ERROR:", error);

      toast.error(getErrorMessage(error, "Không thể liên kết Trello Board."));
    } finally {
      setLinkingBoard(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([loadTasks(), loadDashboardData(), loadBoards()]);

    toast.success("Đã làm mới dữ liệu.");
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="← Home / Trello & Công việc" />

        <div className="trello-page">
          <section className="trello-header">
            <div>
              <div className="trello-title-row">
                <div className="trello-logo">
                  <KanbanSquare size={28} />
                </div>

                <div>
                  <h1>Quản lý công việc</h1>
                  <p>{selectedClubName} · Đồng bộ Trello theo thời gian thực</p>
                </div>
              </div>
            </div>

            <div className="trello-header-actions">
              <button
                type="button"
                className="trello-btn secondary"
                onClick={handleRefresh}
                disabled={loadingTasks || loadingStatistics || loadingBoards}
              >
                <RefreshCw
                  size={17}
                  className={loadingTasks ? "spin-icon" : ""}
                />
                Làm mới
              </button>

              <button
                type="button"
                className="trello-btn primary"
                onClick={() => openCreateTaskModal()}
              >
                <CirclePlus size={18} />
                Tạo công việc
              </button>
            </div>
          </section>

          <section className="trello-connection-bar">
            <div className="trello-connection-info">
              <span
                className={`connection-dot ${
                  trelloConnected ? "connected" : ""
                }`}
              />

              <div>
                <strong>
                  {trelloConnected
                    ? "Đã kết nối tài khoản Trello"
                    : "Chưa kết nối Trello"}
                </strong>

                <p>
                  {trelloConnected
                    ? `${boards.length} Board có thể sử dụng`
                    : "Kết nối Trello để tạo Card và đồng bộ công việc."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="trello-btn trello"
              onClick={handleConnectTrello}
            >
              <KanbanSquare size={17} />
              {trelloConnected ? "Kết nối lại" : "Kết nối Trello"}
            </button>
          </section>

          <nav className="trello-tabs">
            <TabButton
              active={activeTab === "board"}
              icon={<ListTodo size={18} />}
              label="Bảng công việc"
              onClick={() => setActiveTab("board")}
            />

            <TabButton
              active={activeTab === "dashboard"}
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              onClick={() => setActiveTab("dashboard")}
            />

            <TabButton
              active={activeTab === "reminders"}
              icon={<Bell size={18} />}
              label="Nhắc nhở"
              badge={reminders.length}
              onClick={() => setActiveTab("reminders")}
            />

            <TabButton
              active={activeTab === "performance"}
              icon={<BarChart3 size={18} />}
              label="Hiệu suất"
              onClick={() => setActiveTab("performance")}
            />

            <TabButton
              active={activeTab === "settings"}
              icon={<Settings size={18} />}
              label="Cấu hình Trello"
              onClick={() => setActiveTab("settings")}
            />
          </nav>

          {activeTab === "board" && (
            <BoardTab
              loading={loadingTasks}
              filters={filters}
              setFilters={setFilters}
              searchText={searchText}
              setSearchText={setSearchText}
              tasksByStatus={tasksByStatus}
              onCreate={openCreateTaskModal}
              onEdit={openEditTaskModal}
              onDelete={handleDeleteTask}
              onMove={handleMoveTask}
            />
          )}

          {activeTab === "dashboard" && (
            <DashboardTab dashboard={dashboard} loading={loadingStatistics} />
          )}

          {activeTab === "reminders" && (
            <RemindersTab
              reminders={reminders}
              loading={loadingStatistics}
              onEdit={openEditTaskModal}
            />
          )}

          {activeTab === "performance" && (
            <PerformanceTab
              performance={performance}
              loading={loadingStatistics}
            />
          )}

          {activeTab === "settings" && (
            <TrelloSettingsTab
              connected={trelloConnected}
              boards={boards}
              loadingBoards={loadingBoards}
              selectedBoardId={selectedBoardId}
              setSelectedBoardId={setSelectedBoardId}
              linkingBoard={linkingBoard}
              onConnect={handleConnectTrello}
              onLoadBoards={() => loadBoards({ showError: true })}
              onLinkBoard={handleLinkBoard}
            />
          )}
        </div>

        {showTaskModal && (
          <TaskModal
            form={form}
            setForm={setForm}
            members={members}
            loadingMembers={loadingMembers}
            editingTask={editingTask}
            saving={savingTask}
            onClose={closeTaskModal}
            onSave={handleSaveTask}
          />
        )}
      </main>
    </div>
  );
}

function TabButton({ active, icon, label, badge, onClick }) {
  return (
    <button type="button" className={active ? "active" : ""} onClick={onClick}>
      {icon}
      <span>{label}</span>

      {badge > 0 && <span className="trello-tab-badge">{badge}</span>}
    </button>
  );
}

function BoardTab({
  loading,
  filters,
  setFilters,
  searchText,
  setSearchText,
  tasksByStatus,
  onCreate,
  onEdit,
  onDelete,
  onMove,
}) {
  return (
    <section className="trello-board-section">
      <div className="trello-filters">
        <div className="trello-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Tìm theo tên, thành viên, sự kiện..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <select
          value={filters.filterType}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              filterType: event.target.value,
            }))
          }
        >
          <option value="ALL">Tất cả công việc</option>
          <option value="MY_TASKS">Công việc của tôi</option>
          <option value="EVENT">Theo sự kiện</option>
          <option value="DEPARTMENT">Theo ban</option>
        </select>

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value,
            }))
          }
        >
          <option value="">Mọi trạng thái</option>
          <option value="To Do">To Do</option>
          <option value="Doing">Doing</option>
          <option value="Done">Done</option>
        </select>

        <input
          type="text"
          placeholder="Tên ban..."
          value={filters.department}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              department: event.target.value,
            }))
          }
        />

        <input
          type="number"
          min="1"
          placeholder="Event ID"
          value={filters.eventId}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              eventId: event.target.value,
            }))
          }
        />
      </div>

      {loading ? (
        <PageLoading text="Đang tải công việc..." />
      ) : (
        <div className="trello-kanban">
          {STATUS_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.key}
              column={column}
              tasks={tasksByStatus[column.key] || []}
              onCreate={onCreate}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function KanbanColumn({ column, tasks, onCreate, onEdit, onDelete, onMove }) {
  return (
    <div className={`kanban-column ${column.className}`}>
      <div className="kanban-column-header">
        <div>
          <span className="kanban-status-dot" />
          <strong>{column.label}</strong>
          <span className="kanban-count">{tasks.length}</span>
        </div>

        <button
          type="button"
          onClick={() => onCreate(column.key)}
          title={`Thêm công việc vào ${column.label}`}
        >
          <CirclePlus size={19} />
        </button>
      </div>

      <div className="kanban-task-list">
        {tasks.length === 0 ? (
          <div className="kanban-empty">
            <ListTodo size={30} />
            <p>Chưa có công việc</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onMove }) {
  const status = normalizeStatus(task.status);
  const overdue =
    task.dueDate && status !== "Done" && new Date(task.dueDate) < new Date();

  return (
    <article className={`trello-task-card ${overdue ? "overdue" : ""}`}>
      <div className="task-card-top">
        <div className="task-labels">
          {task.department && (
            <span className="task-label department">{task.department}</span>
          )}

          {task.isFinanceRelated && (
            <span className="task-label finance">Tài chính</span>
          )}

          {task.isEventCritical && (
            <span className="task-label critical">Quan trọng</span>
          )}
        </div>

        <div className="task-card-menu">
          <button type="button" onClick={() => onEdit(task)} title="Chỉnh sửa">
            <Pencil size={15} />
          </button>

          <button type="button" onClick={() => onDelete(task)} title="Xóa">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <h3>{task.title}</h3>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {task.eventTitle && (
        <div className="task-meta-line">
          <span>Sự kiện:</span>
          <strong>{task.eventTitle}</strong>
        </div>
      )}

      <div className="task-card-details">
        <div>
          <UserRoundCheck size={15} />
          <span>
            {task.assignedUserName || `Thành viên #${task.assignedUserId}`}
          </span>
        </div>

        <div className={overdue ? "overdue-text" : ""}>
          <Clock3 size={15} />
          <span>{formatDateTime(task.dueDate)}</span>
        </div>
      </div>

      <div className="task-sync-row">
        <SyncBadge status={task.syncStatus} />

        {task.trelloCardUrl && (
          <a href={task.trelloCardUrl} target="_blank" rel="noreferrer">
            Mở Trello
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="task-move-row">
        <select
          value={status}
          onChange={(event) => onMove(task, event.target.value)}
        >
          <option value="To Do">To Do</option>
          <option value="Doing">Doing</option>
          <option value="Done">Done</option>
        </select>

        <ChevronDown size={15} />
      </div>
    </article>
  );
}

function DashboardTab({ dashboard, loading }) {
  if (loading) {
    return <PageLoading text="Đang tải dashboard..." />;
  }

  const data = dashboard || {};

  const cards = [
    {
      label: "Tổng công việc",
      value: data.totalTasks || 0,
      icon: <ListTodo />,
      className: "total",
    },
    {
      label: "Chưa thực hiện",
      value: data.todoTasks || 0,
      icon: <Clock3 />,
      className: "todo",
    },
    {
      label: "Đang thực hiện",
      value: data.doingTasks || 0,
      icon: <RefreshCw />,
      className: "doing",
    },
    {
      label: "Đã hoàn thành",
      value: data.doneTasks || 0,
      icon: <CheckCircle2 />,
      className: "done",
    },
    {
      label: "Quá hạn",
      value: data.overdueTasksCount || 0,
      icon: <AlertTriangle />,
      className: "overdue",
    },
    {
      label: "Liên quan tài chính",
      value: data.financeRelatedTasks || 0,
      icon: <BarChart3 />,
      className: "finance",
    },
  ];

  const progress = Math.min(
    100,
    Math.max(0, Number(data.eventProgressPercentage) || 0),
  );

  return (
    <section className="trello-dashboard">
      <div className="dashboard-stat-grid">
        {cards.map((card) => (
          <article
            key={card.label}
            className={`dashboard-stat-card ${card.className}`}
          >
            <div className="dashboard-stat-icon">{card.icon}</div>

            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <article className="progress-panel">
        <div className="progress-panel-header">
          <div>
            <h2>Tiến độ công việc</h2>
            <p>Tỷ lệ hoàn thành công việc quan trọng của sự kiện</p>
          </div>

          <strong>{progress.toFixed(1)}%</strong>
        </div>

        <div className="progress-track">
          <div className="progress-value" style={{ width: `${progress}%` }} />
        </div>

        <div className="dashboard-summary">
          <div>
            <span>Công việc quan trọng</span>
            <strong>{data.isEventCriticalTasks || 0}</strong>
          </div>

          <div>
            <span>Hoàn thành</span>
            <strong>{data.doneTasks || 0}</strong>
          </div>

          <div>
            <span>Còn lại</span>
            <strong>
              {Math.max(0, (data.totalTasks || 0) - (data.doneTasks || 0))}
            </strong>
          </div>
        </div>
      </article>
    </section>
  );
}

function RemindersTab({ reminders, loading, onEdit }) {
  if (loading) {
    return <PageLoading text="Đang tải nhắc nhở..." />;
  }

  return (
    <section className="reminders-section">
      <div className="section-heading">
        <div>
          <h2>Công việc cần chú ý</h2>
          <p>Công việc đã quá hạn hoặc đến hạn trong vòng 48 giờ.</p>
        </div>

        <span>{reminders.length} công việc</span>
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={42} />}
          title="Không có công việc cần nhắc"
          description="Hiện tại không có công việc quá hạn hoặc sắp đến hạn."
        />
      ) : (
        <div className="reminder-list">
          {reminders.map((task) => {
            const overdue = task.dueDate && new Date(task.dueDate) < new Date();

            return (
              <article
                key={task.taskId}
                className={`reminder-card ${overdue ? "overdue" : "upcoming"}`}
              >
                <div className="reminder-icon">
                  {overdue ? <AlertTriangle size={23} /> : <Bell size={23} />}
                </div>

                <div className="reminder-content">
                  <div>
                    <h3>{task.title}</h3>

                    <span>{overdue ? "Đã quá hạn" : "Sắp đến hạn"}</span>
                  </div>

                  <p>
                    {task.assignedUserName ||
                      `Thành viên #${task.assignedUserId}`}
                    {" · "}
                    {formatDateTime(task.dueDate)}
                  </p>

                  {task.department && <small>{task.department}</small>}
                </div>

                <button type="button" onClick={() => onEdit(task)}>
                  Xem công việc
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PerformanceTab({ performance, loading }) {
  if (loading) {
    return <PageLoading text="Đang tải hiệu suất..." />;
  }

  return (
    <section className="performance-section">
      <div className="section-heading">
        <div>
          <h2>Hiệu suất thành viên</h2>
          <p>Thống kê số lượng công việc được giao và kết quả hoàn thành.</p>
        </div>
      </div>

      {performance.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={42} />}
          title="Chưa có dữ liệu hiệu suất"
          description="Dữ liệu sẽ xuất hiện sau khi thành viên được giao công việc."
        />
      ) : (
        <div className="performance-table-wrap">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Được giao</th>
                <th>Hoàn thành</th>
                <th>Đang làm</th>
                <th>Quá hạn</th>
                <th>Tỷ lệ hoàn thành</th>
              </tr>
            </thead>

            <tbody>
              {performance.map((member) => {
                const assigned = Number(member.assignedTasksCount) || 0;

                const completed = Number(member.completedTasksCount) || 0;

                const completionRate =
                  assigned > 0 ? (completed / assigned) * 100 : 0;

                return (
                  <tr key={member.userId}>
                    <td>
                      <div className="performance-user">
                        <div>{getInitials(member.fullName)}</div>

                        <span>
                          <strong>{member.fullName}</strong>
                          <small>{member.email}</small>
                        </span>
                      </div>
                    </td>

                    <td>{assigned}</td>
                    <td>{completed}</td>
                    <td>{member.inProgressTasksCount || 0}</td>
                    <td>
                      <span
                        className={
                          member.overdueTasksCount > 0 ? "table-overdue" : ""
                        }
                      >
                        {member.overdueTasksCount || 0}
                      </span>
                    </td>

                    <td>
                      <div className="member-progress">
                        <div>
                          <span
                            style={{
                              width: `${Math.min(100, completionRate)}%`,
                            }}
                          />
                        </div>

                        <strong>{completionRate.toFixed(0)}%</strong>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TrelloSettingsTab({
  connected,
  boards,
  loadingBoards,
  selectedBoardId,
  setSelectedBoardId,
  linkingBoard,
  onConnect,
  onLoadBoards,
  onLinkBoard,
}) {
  const selectedBoard = boards.find((board) => board.id === selectedBoardId);

  return (
    <section className="trello-settings-section">
      <article className="settings-card">
        <div className="settings-card-icon">
          <KanbanSquare size={28} />
        </div>

        <div className="settings-card-content">
          <h2>Kết nối tài khoản Trello</h2>

          <p>
            Cấp quyền Read/Write để hệ thống có thể tạo Card, cập nhật trạng
            thái và nhận Webhook từ Trello.
          </p>

          <div className={`settings-status ${connected ? "connected" : ""}`}>
            <span />
            {connected
              ? "Tài khoản Trello đã được kết nối"
              : "Chưa kết nối tài khoản Trello"}
          </div>
        </div>

        <button type="button" className="trello-btn trello" onClick={onConnect}>
          <Link2 size={17} />
          {connected ? "Kết nối lại" : "Kết nối ngay"}
        </button>
      </article>

      <article className="settings-card board-link-card">
        <div className="settings-card-content">
          <h2>Liên kết Trello Board</h2>

          <p>
            Sau khi liên kết, hệ thống sẽ tạo các List To Do, Doing, Done và
            đăng ký Webhook tự động.
          </p>

          <div className="board-picker-row">
            <select
              value={selectedBoardId}
              onChange={(event) => setSelectedBoardId(event.target.value)}
              disabled={loadingBoards || boards.length === 0}
            >
              <option value="">
                {loadingBoards ? "Đang tải Board..." : "Chọn Trello Board"}
              </option>

              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="trello-btn secondary"
              onClick={onLoadBoards}
              disabled={loadingBoards}
            >
              <RefreshCw
                size={16}
                className={loadingBoards ? "spin-icon" : ""}
              />
              Tải Board
            </button>

            <button
              type="button"
              className="trello-btn primary"
              onClick={onLinkBoard}
              disabled={!selectedBoardId || linkingBoard}
            >
              <Link2 size={16} />
              {linkingBoard ? "Đang liên kết..." : "Liên kết Board"}
            </button>
          </div>

          {selectedBoard && (
            <div className="selected-board-preview">
              <div>
                <KanbanSquare size={22} />

                <span>
                  <strong>{selectedBoard.name}</strong>

                  <small>
                    {selectedBoard.desc || "Trello Board của câu lạc bộ"}
                  </small>
                </span>
              </div>

              {selectedBoard.url && (
                <a href={selectedBoard.url} target="_blank" rel="noreferrer">
                  Mở Board
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          )}
        </div>
      </article>
    </section>
  );
}

function TaskModal({
  form,
  setForm,
  members,
  loadingMembers,
  editingTask,
  saving,
  onClose,
  onSave,
}) {
  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div
      className="task-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="task-modal">
        <div className="task-modal-header">
          <div>
            <h2>{editingTask ? "Chỉnh sửa công việc" : "Tạo công việc mới"}</h2>

            <p>Công việc sẽ được đồng bộ sang Trello Card.</p>
          </div>

          <button type="button" onClick={onClose} disabled={saving}>
            <X size={21} />
          </button>
        </div>

        <div className="task-modal-body">
          <label>
            Tiêu đề công việc <span>*</span>
          </label>

          <input
            type="text"
            placeholder="Ví dụ: Thiết kế Banner Chào Tân"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
          />

          <label>Mô tả</label>

          <textarea
            rows="4"
            placeholder="Nhập nội dung chi tiết của công việc..."
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
          />

          <div className="task-form-grid">
            <div>
              <label>
                Thành viên được giao <span>*</span>
              </label>

              <select
                value={form.assignedUserId}
                onChange={(event) =>
                  setField("assignedUserId", event.target.value)
                }
                disabled={loadingMembers || saving}
              >
                <option value="">
                  {loadingMembers
                    ? "Đang tải thành viên..."
                    : "Chọn thành viên"}
                </option>

                {members.map((member) => (
                  <option key={member.id} value={member.userId}>
                    {member.fullName}
                    {member.role ? ` — ${formatMemberRole(member.role)}` : ""}
                    {member.departmentName && member.departmentName !== "None"
                      ? ` — ${member.departmentName}`
                      : ""}
                  </option>
                ))}
              </select>

              {!loadingMembers && members.length === 0 && (
                <small className="task-field-message">
                  Không tìm thấy thành viên đang hoạt động trong CLB.
                </small>
              )}
            </div>

            <div>
              <label>Sự kiện liên quan</label>

              <input
                type="number"
                min="1"
                placeholder="Event ID, có thể để trống"
                value={form.eventId}
                onChange={(event) => setField("eventId", event.target.value)}
              />
            </div>

            <div>
              <label>Trạng thái</label>

              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
              >
                <option value="To Do">To Do</option>
                <option value="Doing">Doing</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label>
                Hạn hoàn thành <span>*</span>
              </label>

              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(event) => setField("dueDate", event.target.value)}
              />
            </div>
          </div>

          <label>Ban phụ trách</label>

          <input
            type="text"
            placeholder="Ví dụ: Ban Truyền Thông"
            value={form.department}
            onChange={(event) => setField("department", event.target.value)}
          />

          <div className="task-checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={form.financeRelated}
                onChange={(event) =>
                  setField("financeRelated", event.target.checked)
                }
              />

              <span>
                <strong>Liên quan tài chính</strong>
                <small>Đánh dấu công việc cần theo dõi ngân sách.</small>
              </span>
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.isEventCritical}
                onChange={(event) =>
                  setField("isEventCritical", event.target.checked)
                }
              />

              <span>
                <strong>Công việc quan trọng</strong>
                <small>Được tính vào tiến độ chính của sự kiện.</small>
              </span>
            </label>
          </div>
        </div>

        <div className="task-modal-footer">
          <button
            type="button"
            className="trello-btn secondary"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>

          <button
            type="button"
            className="trello-btn primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving
              ? "Đang lưu..."
              : editingTask
                ? "Lưu thay đổi"
                : "Tạo công việc"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SyncBadge({ status }) {
  const normalized = String(status || "NOT_SYNCED")
    .toUpperCase()
    .replaceAll(" ", "_");

  const labels = {
    SYNCED: "Đã đồng bộ",
    SUCCESS: "Đã đồng bộ",
    NOT_SYNCED: "Chưa đồng bộ",
    PENDING: "Đang đồng bộ",
    FAILED: "Đồng bộ lỗi",
    ERROR: "Đồng bộ lỗi",
  };

  return (
    <span
      className={`task-sync-badge ${normalized
        .toLowerCase()
        .replaceAll("_", "-")}`}
    >
      {labels[normalized] || status || "Chưa đồng bộ"}
    </span>
  );
}

function PageLoading({ text }) {
  return (
    <div className="trello-page-loading">
      <RefreshCw size={28} className="spin-icon" />
      <span>{text}</span>
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="trello-empty-state">
      {icon}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toUpperCase()
    .replaceAll("_", " ");

  if (value === "DONE" || value === "COMPLETED") {
    return "Done";
  }

  if (value === "DOING" || value === "IN PROGRESS" || value === "IN-PROGRESS") {
    return "Doing";
  }

  return "To Do";
}

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "Chưa có thời hạn";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Thời gian không hợp lệ";
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatMemberRole(role) {
  const roleLabels = {
    PRESIDENT: "Chủ nhiệm",
    TREASURER: "Thủ quỹ",
    MEMBER: "Thành viên",
  };

  return roleLabels[role] || role;
}
function getInitials(fullName) {
  if (!fullName) return "?";

  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
