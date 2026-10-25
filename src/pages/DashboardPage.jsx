import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileClock,
  ListTodo,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import SubscriptionPanel from "../components/SubscriptionPanel";
import API from "../api/api";
import { getFinanceOverview } from "../api/financeApi";
const TASK_PROGRESS_DATA = [
  {
    name: "Completed",
    value: 28,
    color: "#22c55e",
  },
  {
    name: "In Progress",
    value: 14,
    color: "#f59e0b",
  },
  {
    name: "To Do",
    value: 8,
    color: "#cbd5e1",
  },
];

const TOTAL_TASKS = TASK_PROGRESS_DATA.reduce(
  (total, item) => total + item.value,
  0,
);
import "../styles.css";

const INITIAL_DASHBOARD = {
  members: [],
  events: [],
  tasks: [],
  pendingApplications: 0,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const clubId = Number(localStorage.getItem("selectedClubId"));
  const userId = Number(localStorage.getItem("userId"));
  const clubName = localStorage.getItem("selectedClubName") || "S-Club";

  const [data, setData] = useState(INITIAL_DASHBOARD);
  const [loading, setLoading] = useState(true);

  const [financeChart, setFinanceChart] = useState([]);
  const [financeError, setFinanceError] = useState('');
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeRevision, setFinanceRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setFinanceLoading(true); setFinanceChart([]); setFinanceError('');
    getFinanceOverview(clubId, 6, controller.signal).then(result => {
      if (!active || Number(localStorage.getItem('selectedClubId')) !== clubId) return;
      if (!Array.isArray(result?.labels) || !Array.isArray(result.incomeData) || !Array.isArray(result.expenseData) || result.labels.length !== result.incomeData.length || result.labels.length !== result.expenseData.length || ![...result.incomeData, ...result.expenseData].every(Number.isFinite)) throw new Error('Invalid finance chart response.');
      setFinanceChart(result.labels.map((month, index) => ({ month, income: result.incomeData[index] / 1000000, expense: result.expenseData[index] / 1000000 })));
    }).catch(error => { if (active) setFinanceError(error.response?.data?.message || error.message || 'Cannot load finance chart.'); })
      .finally(() => { if (active) setFinanceLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [clubId, financeRevision]);

  const loadDashboard = useCallback(async () => {
    if (!clubId || !userId) {
      toast.error("User or club information is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [membersResponse, eventsResponse, tasksResponse] =
        await Promise.all([
          API.get(`/api/clubs/${clubId}/members`),

          API.get(`/api/events/club/${clubId}`),

          API.get("/api/tasks", {
            params: {
              clubId,
              userId,
              filterType: "ALL",
            },
          }),
        ]);

      setData({
        members: Array.isArray(membersResponse.data)
          ? membersResponse.data
          : [],

        events: Array.isArray(eventsResponse.data) ? eventsResponse.data : [],

        tasks: Array.isArray(tasksResponse.data) ? tasksResponse.data : [],

        // Chưa có API đơn xin gia nhập đang chờ duyệt.
        // Khi có API, thay giá trị này bằng response tương ứng.
        pendingApplications: 0,
      });
    } catch (error) {
      console.error("LOAD DASHBOARD ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, [clubId, userId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statistics = useMemo(() => {
    const now = new Date();

    const activeMembers = data.members.filter(
      (member) => !member.status || member.status === "ACTIVE",
    );

    const newMembersThisMonth = activeMembers.filter(
      (member) =>
        member.joinedAt && isSameMonth(new Date(member.joinedAt), now),
    );

    const upcomingEvents = data.events.filter((event) => {
      const startDate = new Date(event.startTime);

      return (
        isValidDate(startDate) &&
        startDate >= startOfToday(now) &&
        !isCancelledEvent(event)
      );
    });

    const eventsThisWeek = upcomingEvents.filter((event) =>
      isDateInCurrentWeek(new Date(event.startTime), now),
    );

    /*
     * Tạm định nghĩa "Sự kiện cần chuẩn bị" là:
     * sự kiện chưa diễn ra và bắt đầu trong vòng 7 ngày tới.
     */
    const preparationDeadline = addDays(now, 7);

    const eventsNeedPreparation = upcomingEvents.filter((event) => {
      const startDate = new Date(event.startTime);

      return startDate <= preparationDeadline && startDate >= now;
    });

    const incompleteTasks = data.tasks.filter((task) => !isCompletedTask(task));

    const overdueTasks = incompleteTasks.filter((task) => {
      const dueDate = new Date(task.dueDate);

      return isValidDate(dueDate) && dueDate < now;
    });

    const tasksDueThisWeek = incompleteTasks.filter((task) => {
      const dueDate = new Date(task.dueDate);

      return (
        isValidDate(dueDate) &&
        dueDate >= now &&
        isDateInCurrentWeek(dueDate, now)
      );
    });

    return {
      totalMembers: activeMembers.length,
      newMembersThisMonth: newMembersThisMonth.length,
      pendingApplications: data.pendingApplications,

      upcomingEvents: upcomingEvents.length,
      eventsThisWeek: eventsThisWeek.length,
      eventsNeedPreparation: eventsNeedPreparation.length,

      incompleteTasks: incompleteTasks.length,
      overdueTasks: overdueTasks.length,
      tasksDueThisWeek: tasksDueThisWeek.length,

      upcomingEventList: upcomingEvents
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 5),

      urgentTaskList: incompleteTasks
        .filter((task) => task.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5),

      newMemberList: newMembersThisMonth
        .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
        .slice(0, 5),
    };
  }, [data]);
  const memberChartData = [
    {
      name: "Total Members",
      value: statistics.totalMembers,
    },
    {
      name: "New This Month",
      value: statistics.newMembersThisMonth,
    },
    {
      name: "Pending Approval",
      value: statistics.pendingApplications,
    },
  ];

  const eventChartData = [
    {
      name: "Upcoming",
      value: statistics.upcomingEvents,
    },
    {
      name: "This Week",
      value: statistics.eventsThisWeek,
    },
    {
      name: "Preparation Needed",
      value: statistics.eventsNeedPreparation,
    },
  ];

  const taskChartData = [
    {
      name: "Incomplete",
      value: statistics.incompleteTasks,
    },
    {
      name: "Overdue",
      value: statistics.overdueTasks,
    },
    {
      name: "Due This Week",
      value: statistics.tasksDueThisWeek,
    },
  ];
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page / Dashboard" />

        <section className="dashboard-page club-dashboard-page">
          <header className="dashboard-heading">
            <div>
              <h1>Dashboard {clubName}</h1>
            </div>

            <div className="dashboard-heading-actions">
              <div className="dashboard-date">
                <CalendarDays size={18} />
                {formatCurrentDate(new Date())}
              </div>

              <button
                type="button"
                className="dashboard-refresh-button"
                onClick={loadDashboard}
                disabled={loading}
              >
                <RefreshCw
                  size={17}
                  className={loading ? "dashboard-spin" : ""}
                />

                {loading ? "Loading..." : "refresh"}
              </button>
            </div>
          </header>

          <SubscriptionPanel key={`${clubId}:${userId}`} />

          {loading ? (
            <div className="dashboard-loading-state">
              <RefreshCw size={36} className="dashboard-spin" />

              <p>Loading Dashboard data...</p>
            </div>
          ) : (
            <>
              <div className="dashboard-overview-cards">
                <OverviewCard
                  label="Total Members"
                  value={statistics.totalMembers}
                  icon={<Users />}
                  className="members"
                />

                <OverviewCard
                  label="Upcoming Events"
                  value={statistics.upcomingEvents}
                  icon={<CalendarDays />}
                  className="events"
                />

                <OverviewCard
                  label="Incomplete Tasks"
                  value={statistics.incompleteTasks}
                  icon={<ListTodo />}
                  className="tasks"
                />

                <OverviewCard
                  label="Overdue Tasks"
                  value={statistics.overdueTasks}
                  icon={<AlertTriangle />}
                  className="danger"
                />
              </div>
              <div className="dashboard-main-grid">
                <article className="dashboard-panel dashboard-finance-chart">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2>Income and Expenses (Last 6 Months)</h2>
                      <p>Unit: Million VND</p>
                    </div>
                  </div>

                  <div className="dashboard-chart-legend">
                    <span>
                      <i className="income" />
                      Income
                    </span>

                    <span>
                      <i className="expense" />
                      Expenses
                    </span>
                  </div>

                  {financeError ? <p role="alert">{financeError} <button onClick={() => setFinanceRevision(value => value + 1)}>Retry</button></p> : financeLoading ? <p>Loading finance chart...</p> : !financeChart.length && <p>No finance data available.</p>}
                  <div className="dashboard-finance-chart-content">
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart
                        data={financeChart}
                        barGap={10}
                        barCategoryGap="38%"
                        margin={{
                          top: 20,
                          right: 10,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid vertical={false} stroke="#edf0f5" />

                        <XAxis
                          dataKey="month"
                          axisLine={{
                            stroke: "#dce2ea",
                          }}
                          tickLine={false}
                          tick={{
                            fill: "#64748b",
                            fontSize: 14,
                          }}
                          dy={10}
                        />

                        <YAxis hide />

                        <Tooltip
                          cursor={{
                            fill: "rgba(109, 40, 217, 0.04)",
                          }}
                          content={<FinanceTooltip />}
                        />

                        <Bar
                          dataKey="income"
                          name="Income"
                          fill="#6d28d9"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={28}
                        />

                        <Bar
                          dataKey="expense"
                          name="Expenses"
                          fill="#b8a5ff"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="dashboard-panel dashboard-task-summary">
                  <div className="dashboard-panel-header">
                    <div>
                      <h2>Task Progress</h2>
                      <p>Overview of task status</p>
                    </div>

                    <ListTodo size={25} />
                  </div>

                  <div className="dashboard-task-chart-wrap">
                    <ResponsiveContainer width="100%" height={270}>
                      <PieChart>
                        <Pie
                          data={TASK_PROGRESS_DATA}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={72}
                          outerRadius={108}
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                        >
                          {TASK_PROGRESS_DATA.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Pie>

                        <Tooltip content={<TaskTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="dashboard-donut-center">
                      <strong>{TOTAL_TASKS}</strong>
                      <span>Total Tasks</span>
                    </div>
                  </div>

                  <div className="task-summary-list">
                    {TASK_PROGRESS_DATA.map((item) => (
                      <div className="task-summary-row" key={item.name}>
                        <span>
                          <i
                            style={{
                              backgroundColor: item.color,
                            }}
                          />

                          {item.name}
                        </span>

                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="dashboard-detail-grid">
                <DashboardListPanel
                  title="Upcoming Events"
                  description="The 5 nearest upcoming events"
                  icon={<CalendarDays size={21} />}
                  emptyText="No upcoming events"
                  onNavigate={() => navigate("/calendar")}
                  navigateTitle="Open Calendar"
                >
                  {statistics.upcomingEventList.map((event) => (
                    <EventDashboardItem key={event.id} event={event} />
                  ))}
                </DashboardListPanel>

                <DashboardListPanel
                  title="Tasks Requiring Attention"
                  description="Sorted by the nearest due date"
                  icon={<ListTodo size={21} />}
                  emptyText="No tasks currently require attention"
                  onNavigate={() => navigate("/trello")}
                  navigateTitle="Open Task Board"
                >
                  {statistics.urgentTaskList.map((task) => (
                    <TaskDashboardItem key={task.taskId} task={task} />
                  ))}
                </DashboardListPanel>

                <DashboardListPanel
                  title="New Members"
                  description="Members who joined this month"
                  icon={<UserPlus size={21} />}
                  emptyText="No new members joined this month"
                  onNavigate={() => navigate("/members")}
                  navigateTitle="Open Members"
                >
                  {statistics.newMemberList.map((member) => (
                    <MemberDashboardItem key={member.id} member={member} />
                  ))}
                </DashboardListPanel>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function DashboardGroup({ title, description, icon, className, children }) {
  return (
    <section className={`dashboard-metric-group ${className}`}>
      <header className="dashboard-group-header">
        <div className="dashboard-group-icon">{icon}</div>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>

      <div className="dashboard-group-grid">{children}</div>
    </section>
  );
}

function DashboardMetric({
  title,
  value,
  description,
  icon,
  className,
  warning = false,
}) {
  return (
    <article
      className={`dashboard-metric-card ${className} ${
        warning && value > 0 ? "warning" : ""
      }`}
    >
      <div className="dashboard-metric-icon">{icon}</div>

      <div className="dashboard-metric-content">
        <strong>{value}</strong>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
function DashboardChartPanel({ title, description, icon, children }) {
  return (
    <article className="dashboard-panel dashboard-chart-panel">
      <div className="dashboard-panel-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="dashboard-chart-panel-icon">{icon}</div>
      </div>

      <div className="dashboard-chart-content">{children}</div>
    </article>
  );
}
function DashboardListPanel({
  title,
  description,
  icon,
  emptyText,
  children,
  onNavigate,
  navigateTitle,
}) {
  const items = Array.isArray(children)
    ? children.filter(Boolean)
    : children
      ? [children]
      : [];

  return (
    <article className="dashboard-panel dashboard-list-panel">
      <div className="dashboard-panel-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        {onNavigate ? (
          <button
            type="button"
            className="dashboard-panel-navigation"
            onClick={onNavigate}
            title={navigateTitle}
            aria-label={navigateTitle}
          >
            {icon}
          </button>
        ) : (
          <div className="dashboard-panel-static-icon">{icon}</div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="dashboard-list-empty">
          <CheckCircle2 size={30} />
          <span>{emptyText}</span>
        </div>
      ) : (
        <div className="dashboard-compact-list">{items}</div>
      )}
    </article>
  );
}

function EventDashboardItem({ event }) {
  const startDate = new Date(event.startTime);

  return (
    <div className="dashboard-list-item">
      <div className="dashboard-event-date">
        <strong>{String(startDate.getDate()).padStart(2, "0")}</strong>

        <span>THG {startDate.getMonth() + 1}</span>
      </div>

      <div className="dashboard-list-item-content">
        <strong>{event.title}</strong>

        <span>
          <Clock3 size={13} />
          {formatDateTime(event.startTime)}
        </span>

        {event.location && <small>{event.location}</small>}
      </div>
    </div>
  );
}

function TaskDashboardItem({ task }) {
  const overdue =
    task.dueDate &&
    !isCompletedTask(task) &&
    new Date(task.dueDate) < new Date();

  return (
    <div className="dashboard-list-item">
      <div className={`dashboard-task-status ${overdue ? "overdue" : ""}`}>
        {overdue ? <AlertTriangle size={19} /> : <ListTodo size={19} />}
      </div>

      <div className="dashboard-list-item-content">
        <strong>{task.title}</strong>

        <span className={overdue ? "danger-text" : ""}>
          <Clock3 size={13} />

          {task.dueDate ? formatDateTime(task.dueDate) : "No deadline"}
        </span>

        <small>{task.assignedUserName || `User #${task.assignedUserId}`}</small>
      </div>
    </div>
  );
}

function MemberDashboardItem({ member }) {
  return (
    <div className="dashboard-list-item">
      <div className="dashboard-member-avatar">
        {getInitials(member.fullName)}
      </div>

      <div className="dashboard-list-item-content">
        <strong>{member.fullName}</strong>

        <span>{member.email}</span>

        <small>
          {formatRole(member.role)}
          {member.departmentName && member.departmentName !== "None"
            ? ` · ${member.departmentName}`
            : ""}
        </small>
      </div>
    </div>
  );
}

function normalizeTaskStatus(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

function isCompletedTask(task) {
  const status = normalizeTaskStatus(task.status);

  return status === "DONE" || status === "COMPLETED" || status === "FINISHED";
}

function isCancelledEvent(event) {
  const status = String(event.status || "").toUpperCase();

  return status === "CANCELLED" || status === "CANCELED";
}

function isSameMonth(firstDate, secondDate) {
  return (
    isValidDate(firstDate) &&
    isValidDate(secondDate) &&
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth()
  );
}
function OverviewCard({ label, value, icon, className }) {
  return (
    <SpotlightCard as="article" className={`dashboard-overview-card ${className}`}>
      <div className="dashboard-overview-icon">{icon}</div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </SpotlightCard>
  );
}
function isDateInCurrentWeek(date, referenceDate) {
  if (!isValidDate(date)) return false;

  const weekStart = startOfWeekMonday(referenceDate);
  const weekEnd = addDays(weekStart, 7);

  return date >= weekStart && date < weekEnd;
}

function startOfWeekMonday(dateValue) {
  const date = startOfToday(dateValue);
  const day = date.getDay();

  const daysFromMonday = day === 0 ? 6 : day - 1;

  date.setDate(date.getDate() - daysFromMonday);

  return date;
}

function startOfToday(dateValue) {
  const date = new Date(dateValue);

  date.setHours(0, 0, 0, 0);

  return date;
}

function addDays(dateValue, days) {
  const date = new Date(dateValue);

  date.setDate(date.getDate() + days);

  return date;
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function formatCurrentDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (!isValidDate(date)) return "Unknown";

  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function FinanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="dashboard-custom-tooltip">
      <strong>{label}</strong>

      {payload.map((item) => (
        <div key={item.dataKey}>
          <span
            style={{
              backgroundColor: item.color,
            }}
          />

          <p>
            {item.name}: <strong>{item.value} million</strong>
          </p>
        </div>
      ))}
    </div>
  );
}

function TaskTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;

  return (
    <div className="dashboard-custom-tooltip">
      <div>
        <span
          style={{
            backgroundColor: item.color,
          }}
        />

        <p>
          {item.name}: <strong>{item.value}</strong>
        </p>
      </div>
    </div>
  );
}
function formatRole(role) {
  const labels = {
    PRESIDENT: "President",
    TREASURER: "Treasurer",
    MEMBER: "Member",
  };

  return labels[role] || role || "Member";
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
