import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  ListTodo,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles.css";

const RECENT_ACTIVITIES = [
  {
    id: 1,
    title: "Nguyễn Văn An completed a task",
    description: "Design the new club logo",
    time: "10 minutes ago",
    type: "TASK",
  },
  {
    id: 2,
    title: "A new member has joined",
    description: "Trần Minh Khoa was approved to join the club",
    time: "35 minutes ago",
    type: "MEMBER",
  },
  {
    id: 3,
    title: "A new document has been created",
    description: "Meeting minutes for July",
    time: "1 hour ago",
    type: "DOCUMENT",
  },
  {
    id: 4,
    title: "A new event has been scheduled",
    description: "Leadership Skills Workshop",
    time: "3 hours ago",
    type: "EVENT",
  },
];

const UPCOMING_EVENTS = [
  {
    id: 1,
    title: "Workshop leadership skills",
    date: "25",
    month: "AUGUST",
    time: "18:30 - 20:30",
  },
  {
    id: 2,
    title: "Meeting with the new club members",
    date: "27",
    month: "JULY",
    time: "19:00 - 20:00",
  },
  {
    id: 3,
    title: "Orientation for New Students",
    date: "02",
    month: "AUGUST",
    time: "08:00 - 17:00",
  },
];

const DEPARTMENT_PROGRESS = [
  {
    name: "department of Marketing",
    completed: 18,
    total: 22,
    percentage: 82,
  },
  {
    name: "department of Events",
    completed: 14,
    total: 20,
    percentage: 70,
  },
  {
    name: "department of Finance",
    completed: 11,
    total: 15,
    percentage: 73,
  },
  {
    name: "department of Human Resources",
    completed: 8,
    total: 14,
    percentage: 57,
  },
];

export default function DashboardPage() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page / Dashboard" />

        <section className="dashboard-page">
          <header className="dashboard-heading">
            <div>
              <h1>Club Dashboard</h1>

              <p>
                Overview of club activities, members, finances, and progress.
              </p>
            </div>

            <div className="dashboard-date">
              <CalendarDays size={18} />
              July 22, 2026
            </div>
          </header>

          <div className="dashboard-stat-grid">
            <StatCard
              title="Total Members"
              value="128"
              change="+12.5%"
              positive
              icon={<Users />}
              className="members"
            />

            <StatCard
              title="Events This Month"
              value="8"
              change="+2 events"
              positive
              icon={<CalendarDays />}
              className="events"
            />

            <StatCard
              title="Tasks Completed"
              value="74%"
              change="+8.2%"
              positive
              icon={<CheckCircle2 />}
              className="tasks"
            />

            <StatCard
              title="Current Balance"
              value="42.5M"
              change="-4.1%"
              positive={false}
              icon={<WalletCards />}
              className="finance"
            />
          </div>

          <div className="dashboard-main-grid">
            <article className="dashboard-panel dashboard-finance-chart">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Income and Expenses (Last 6 Months)</h2>
                  <p>Unit: Million VND</p>
                </div>

                <select defaultValue="6_MONTHS">
                  <option value="6_MONTHS">6 months</option>
                  <option value="12_MONTHS">12 months</option>
                </select>
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

              <div className="finance-bar-chart">
                <FinanceBar month="T2" income={62} expense={36} />
                <FinanceBar month="T3" income={74} expense={48} />
                <FinanceBar month="T4" income={58} expense={42} />
                <FinanceBar month="T5" income={86} expense={54} />
                <FinanceBar month="T6" income={72} expense={62} />
                <FinanceBar month="T7" income={92} expense={67} />
              </div>
            </article>

            <article className="dashboard-panel dashboard-task-summary">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Task Progress</h2>
                  <p>Overview of task status</p>
                </div>

                <ListTodo size={22} />
              </div>

              <div className="task-donut-wrap">
                <div className="task-donut">
                  <div>
                    <strong>50</strong>
                    <span>Total Tasks</span>
                  </div>
                </div>
              </div>

              <div className="task-summary-list">
                <SummaryRow label="Completed" value="28" className="done" />

                <SummaryRow label="In Progress" value="14" className="doing" />

                <SummaryRow label="To Do" value="8" className="todo" />
              </div>
            </article>
          </div>

          <div className="dashboard-bottom-grid">
            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Recent Activities</h2>
                  <p>Latest updates in the club</p>
                </div>

                <Activity size={21} />
              </div>

              <div className="activity-list">
                {RECENT_ACTIVITIES.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Upcoming Events</h2>
                  <p>Schedule of upcoming activities</p>
                </div>

                <CalendarDays size={21} />
              </div>

              <div className="upcoming-event-list">
                {UPCOMING_EVENTS.map((event) => (
                  <UpcomingEventItem key={event.id} event={event} />
                ))}
              </div>
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Department Performance</h2>
                  <p>Task completion rates</p>
                </div>

                <TrendingUp size={21} />
              </div>

              <div className="department-progress-list">
                {DEPARTMENT_PROGRESS.map((department) => (
                  <DepartmentProgress
                    key={department.name}
                    department={department}
                  />
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value, change, positive, icon, className }) {
  return (
    <article className={`dashboard-stat-card ${className}`}>
      <div className="dashboard-stat-top">
        <div className="dashboard-stat-icon">{icon}</div>

        <span
          className={`dashboard-stat-change ${
            positive ? "positive" : "negative"
          }`}
        >
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}

          {change}
        </span>
      </div>

      <strong>{value}</strong>
      <p>{title}</p>
    </article>
  );
}

function FinanceBar({ month, income, expense }) {
  return (
    <div className="finance-bar-item">
      <div className="finance-bars">
        <span className="income-bar" style={{ height: `${income}%` }} />

        <span className="expense-bar" style={{ height: `${expense}%` }} />
      </div>

      <small>{month}</small>
    </div>
  );
}

function SummaryRow({ label, value, className }) {
  return (
    <div className="task-summary-row">
      <span>
        <i className={className} />
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  );
}

function ActivityItem({ activity }) {
  const icons = {
    TASK: <CheckCircle2 size={18} />,
    MEMBER: <Users size={18} />,
    DOCUMENT: <FileText size={18} />,
    EVENT: <CalendarDays size={18} />,
  };

  return (
    <div className="activity-item">
      <div className={`activity-icon ${activity.type.toLowerCase()}`}>
        {icons[activity.type]}
      </div>

      <div>
        <strong>{activity.title}</strong>
        <p>{activity.description}</p>

        <span>
          <Clock3 size={13} />
          {activity.time}
        </span>
      </div>
    </div>
  );
}

function UpcomingEventItem({ event }) {
  return (
    <div className="upcoming-event-item">
      <div className="upcoming-event-date">
        <strong>{event.date}</strong>
        <span>{event.month}</span>
      </div>

      <div>
        <strong>{event.title}</strong>
        <span>
          <Clock3 size={13} />
          {event.time}
        </span>
      </div>
    </div>
  );
}

function DepartmentProgress({ department }) {
  return (
    <div className="department-progress-item">
      <div>
        <strong>{department.name}</strong>

        <span>
          {department.completed}/{department.total} tasks
        </span>
      </div>

      <div className="department-progress-track">
        <span
          style={{
            width: `${department.percentage}%`,
          }}
        />
      </div>

      <small>{department.percentage}%</small>
    </div>
  );
}
