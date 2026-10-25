import RubberSegment from "../components/reactbits/RubberSegment";
import GlideSelectField from "../components/reactbits/GlideSelectField";
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
  const selectedClubName = localStorage.getItem("selectedClubName") || "Club";

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

      toast.error(getErrorMessage(error, "Cannot load task list."));

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
        getErrorMessage(error, "Unable to load task statistics."),
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

      toast.error(getErrorMessage(error, "Cannot load club member list."));

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
              "Cannot connect to Trello or load Board list.",
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

    toast.success("Trello connection successful.");

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
      toast.error("Please enter a title for the task.");
      return false;
    }

    if (!form.assignedUserId) {
      toast.error("Please select a member to assign the task to.");
      return false;
    }
    if (!form.dueDate) {
      toast.error("Please select a due date.");
      return false;
    }

    const dueDate = new Date(form.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      toast.error("Invalid due date.");
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
        toast.success("Task updated successfully.");
      } else {
        await createTask(payload);
        toast.success("Task created successfully.");
      }

      closeTaskModal();

      await Promise.all([loadTasks(), loadDashboardData()]);
    } catch (error) {
      console.error("SAVE TASK ERROR:", error);

      toast.error(
        getErrorMessage(
          error,
          editingTask ? "Cannot update task." : "Cannot create task.",
        ),
      );
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the task "${task.title}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteTask(task.taskId);

      toast.success("Task deleted successfully.");

      await Promise.all([loadTasks(), loadDashboardData()]);
    } catch (error) {
      console.error("DELETE TASK ERROR:", error);

      toast.error(getErrorMessage(error, "Cannot delete task."));
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

      toast.success(`Task moved to ${nextStatus}.`);

      await Promise.all([loadTasks(), loadDashboardData()]);
    } catch (error) {
      console.error("MOVE TASK ERROR:", error);

      toast.error(getErrorMessage(error, "Cannot change task status."));
    }
  };

  const handleConnectTrello = async () => {
    try {
      await connectTrello();
    } catch (error) {
      console.error("CONNECT TRELLO ERROR:", error);

      toast.error(getErrorMessage(error, "Cannot start Trello connection."));
    }
  };

  const handleLinkBoard = async () => {
    if (!selectedBoardId) {
      toast.error("Please select a Trello Board.");
      return;
    }

    try {
      setLinkingBoard(true);

      await linkTrelloBoard(selectedBoardId);

      toast.success(
        "Successfully linked Trello Board. The system has created default lists and registered the Webhook.",
      );

      await Promise.all([loadBoards({ showError: true }), loadTasks()]);
    } catch (error) {
      console.error("LINK BOARD ERROR:", error);

      toast.error(getErrorMessage(error, "Cannot link Trello Board."));
    } finally {
      setLinkingBoard(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([loadTasks(), loadDashboardData(), loadBoards()]);

    toast.success("Data refreshed successfully.");
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="← Home / Trello & Jobs" />

        <div className="trello-page">
          <section className="trello-header">
            <div>
              <div className="trello-title-row">
                <div className="trello-logo">
                  <KanbanSquare size={28} />
                </div>

                <div>
                  <h1>Jobs management</h1>
                  <p>{selectedClubName} · Real-time Trello synchronization</p>
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
                Refresh
              </button>

              <button
                type="button"
                className="trello-btn primary"
                onClick={() => openCreateTaskModal()}
              >
                <CirclePlus size={18} />
                Create Task
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
                    ? "Already connected to Trello account"
                    : "Not connected to Trello"}
                </strong>

                <p>
                  {trelloConnected
                    ? `${boards.length} Boards available for use`
                    : "Connect to Trello to create Cards and synchronize tasks."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="trello-btn trello"
              onClick={handleConnectTrello}
            >
              <KanbanSquare size={17} />
              {trelloConnected ? "Reconnect" : "Connect to Trello"}
            </button>
          </section>

          <RubberSegment as="nav" className="trello-tabs">
            <TabButton
              active={activeTab === "board"}
              icon={<ListTodo size={18} />}
              label="Board"
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
              label="Reminders"
              badge={reminders.length}
              onClick={() => setActiveTab("reminders")}
            />

            <TabButton
              active={activeTab === "performance"}
              icon={<BarChart3 size={18} />}
              label="Performance"
              onClick={() => setActiveTab("performance")}
            />

            <TabButton
              active={activeTab === "settings"}
              icon={<Settings size={18} />}
              label="Trello Settings"
              onClick={() => setActiveTab("settings")}
            />
          </RubberSegment>

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
            placeholder="Search by name, member, event..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <GlideSelectField
          value={filters.filterType}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              filterType: event.target.value,
            }))
          }
        >
          <option value="ALL">All Tasks</option>
          <option value="MY_TASKS">My Tasks</option>
          <option value="EVENT">By Event</option>
          <option value="DEPARTMENT">By Department</option>
        </GlideSelectField>

        <GlideSelectField
          value={filters.status}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value,
            }))
          }
        >
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="Doing">Doing</option>
          <option value="Done">Done</option>
        </GlideSelectField>

        <input
          type="text"
          placeholder="Department name..."
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
        <PageLoading text="Loading tasks..." />
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
          title={`Create task in ${column.label}`}
        >
          <CirclePlus size={19} />
        </button>
      </div>

      <div className="kanban-task-list">
        {tasks.length === 0 ? (
          <div className="kanban-empty">
            <ListTodo size={30} />
            <p>No tasks available</p>
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
            <span className="task-label finance">Financial</span>
          )}

          {task.isEventCritical && (
            <span className="task-label critical">Critical</span>
          )}
        </div>

        <div className="task-card-menu">
          <button type="button" onClick={() => onEdit(task)} title="Edit">
            <Pencil size={15} />
          </button>

          <button type="button" onClick={() => onDelete(task)} title="Delete">
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
          <span>Event:</span>
          <strong>{task.eventTitle}</strong>
        </div>
      )}

      <div className="task-card-details">
        <div>
          <UserRoundCheck size={15} />
          <span>
            {task.assignedUserName || `Member #${task.assignedUserId}`}
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
            Open Trello
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="task-move-row">
        <GlideSelectField
          value={status}
          onChange={(event) => onMove(task, event.target.value)}
        >
          <option value="To Do">To Do</option>
          <option value="Doing">Doing</option>
          <option value="Done">Done</option>
        </GlideSelectField>

        <ChevronDown size={15} />
      </div>
    </article>
  );
}

function DashboardTab({ dashboard, loading }) {
  if (loading) {
    return <PageLoading text="Loading dashboard..." />;
  }

  const data = dashboard || {};

  const cards = [
    {
      label: "Total Tasks",
      value: data.totalTasks || 0,
      icon: <ListTodo />,
      className: "total",
    },
    {
      label: "To Do",
      value: data.todoTasks || 0,
      icon: <Clock3 />,
      className: "todo",
    },
    {
      label: "Doing",
      value: data.doingTasks || 0,
      icon: <RefreshCw />,
      className: "doing",
    },
    {
      label: "Done",
      value: data.doneTasks || 0,
      icon: <CheckCircle2 />,
      className: "done",
    },
    {
      label: "Overdue",
      value: data.overdueTasksCount || 0,
      icon: <AlertTriangle />,
      className: "overdue",
    },
    {
      label: "Financial",
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
            <h2>Task Progress</h2>
            <p>Completion rate of important tasks for the event</p>
          </div>

          <strong>{progress.toFixed(1)}%</strong>
        </div>

        <div className="progress-track">
          <div className="progress-value" style={{ width: `${progress}%` }} />
        </div>

        <div className="dashboard-summary">
          <div>
            <span>Important Tasks</span>
            <strong>{data.isEventCriticalTasks || 0}</strong>
          </div>

          <div>
            <span>Completed</span>
            <strong>{data.doneTasks || 0}</strong>
          </div>

          <div>
            <span>Remaining</span>
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
    return <PageLoading text="Loading reminders..." />;
  }

  return (
    <section className="reminders-section">
      <div className="section-heading">
        <div>
          <h2>Tasks to Attention</h2>
          <p>Tasks that are overdue or due within the next 48 hours.</p>
        </div>

        <span>{reminders.length} tasks</span>
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={42} />}
          title="No tasks to attention"
          description="Currently, there are no tasks that are overdue or due soon."
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

                    <span>{overdue ? "Overdue" : "Upcoming"}</span>
                  </div>

                  <p>
                    {task.assignedUserName || `Member #${task.assignedUserId}`}
                    {" · "}
                    {formatDateTime(task.dueDate)}
                  </p>

                  {task.department && <small>{task.department}</small>}
                </div>

                <button type="button" onClick={() => onEdit(task)}>
                  View Task
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
    return <PageLoading text="Loading performance..." />;
  }

  return (
    <section className="performance-section">
      <div className="section-heading">
        <div>
          <h2>Member Performance</h2>
          <p>Statistics of assigned tasks and completion results.</p>
        </div>
      </div>

      {performance.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={42} />}
          title="No performance data available"
          description="Data will appear once members are assigned tasks."
        />
      ) : (
        <div className="performance-table-wrap">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Assigned</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>Overdue</th>
                <th>Completion Rate</th>
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
          <h2>Connect Trello Account</h2>

          <p>
            Grant Read/Write permissions for the system to create Cards, update
            status, and receive Webhooks from Trello.
          </p>

          <div className={`settings-status ${connected ? "connected" : ""}`}>
            <span />
            {connected
              ? "Trello account is connected"
              : "Trello account is not connected"}
          </div>
        </div>

        <button type="button" className="trello-btn trello" onClick={onConnect}>
          <Link2 size={17} />
          {connected ? "Reconnect" : "Connect Now"}
        </button>
      </article>

      <article className="settings-card board-link-card">
        <div className="settings-card-content">
          <h2>Link Trello Board</h2>

          <p>
            After linking, the system will create To Do, Doing, Done lists and
            automatically register Webhooks.
          </p>

          <div className="board-picker-row">
            <GlideSelectField
              value={selectedBoardId}
              onChange={(event) => setSelectedBoardId(event.target.value)}
              disabled={loadingBoards || boards.length === 0}
            >
              <option value="">
                {loadingBoards ? "Loading Board..." : "Select Trello Board"}
              </option>

              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </GlideSelectField>

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
              Load Board
            </button>

            <button
              type="button"
              className="trello-btn primary"
              onClick={onLinkBoard}
              disabled={!selectedBoardId || linkingBoard}
            >
              <Link2 size={16} />
              {linkingBoard ? "Linking Board..." : "Link Board"}
            </button>
          </div>

          {selectedBoard && (
            <div className="selected-board-preview">
              <div>
                <KanbanSquare size={22} />

                <span>
                  <strong>{selectedBoard.name}</strong>

                  <small>
                    {selectedBoard.desc || "Trello Board of the club"}
                  </small>
                </span>
              </div>

              {selectedBoard.url && (
                <a href={selectedBoard.url} target="_blank" rel="noreferrer">
                  Open Board
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
            <h2>{editingTask ? "Edit Task" : "Create New Task"}</h2>

            <p>The task will be synchronized to a Trello Card.</p>
          </div>

          <button type="button" onClick={onClose} disabled={saving}>
            <X size={21} />
          </button>
        </div>

        <div className="task-modal-body">
          <label>
            Task Title <span>*</span>
          </label>

          <input
            type="text"
            placeholder="Example: Design the welcome event banner"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
          />

          <label>Description</label>

          <textarea
            rows="4"
            placeholder="Enter the detailed description of the task..."
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
          />

          <div className="task-form-grid">
            <div>
              <label>
                Assigned Member <span>*</span>
              </label>

              <GlideSelectField
                value={form.assignedUserId}
                onChange={(event) =>
                  setField("assignedUserId", event.target.value)
                }
                disabled={loadingMembers || saving}
              >
                <option value="">
                  {loadingMembers ? "Loading members..." : "Select member"}
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
              </GlideSelectField>

              {!loadingMembers && members.length === 0 && (
                <small className="task-field-message">
                  No active members found in the club.
                </small>
              )}
            </div>

            <div>
              <label>Related Event</label>

              <input
                type="number"
                min="1"
                placeholder="Event ID, can be left empty"
                value={form.eventId}
                onChange={(event) => setField("eventId", event.target.value)}
              />
            </div>

            <div>
              <label>Status</label>

              <GlideSelectField
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
              >
                <option value="To Do">To Do</option>
                <option value="Doing">Doing</option>
                <option value="Done">Done</option>
              </GlideSelectField>
            </div>

            <div>
              <label>
                Due Date <span>*</span>
              </label>

              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(event) => setField("dueDate", event.target.value)}
              />
            </div>
          </div>

          <label>Responsible Department</label>

          <input
            type="text"
            placeholder="Example: Communications Department"
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
                <strong>Finance Related</strong>
                <small>Mark tasks that need to be tracked for budgeting.</small>
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
                <strong>Critical Event Task</strong>
                <small>Counted towards the main progress of the event.</small>
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
            Cancel
          </button>

          <button
            type="button"
            className="trello-btn primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingTask
                ? "Save Changes"
                : "Create Task"}
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
    SYNCED: "Synced",
    SUCCESS: "Synced",
    NOT_SYNCED: "Not Synced",
    PENDING: "Syncing",
    FAILED: "Sync Failed",
    ERROR: "Sync Error",
  };

  return (
    <span
      className={`task-sync-badge ${normalized
        .toLowerCase()
        .replaceAll("_", "-")}`}
    >
      {labels[normalized] || status || "Not Synced"}
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
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatMemberRole(role) {
  const roleLabels = {
    PRESIDENT: "President",
    TREASURER: "Treasurer",
    MEMBER: "Member",
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
