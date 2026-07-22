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
    title: "Nguyễn Văn An hoàn thành công việc",
    description: "Thiết kế Banner Sự kiện Chào Tân",
    time: "10 phút trước",
    type: "TASK",
  },
  {
    id: 2,
    title: "Một thành viên mới đã tham gia",
    description: "Trần Minh Khoa được phê duyệt vào CLB",
    time: "35 phút trước",
    type: "MEMBER",
  },
  {
    id: 3,
    title: "Tài liệu mới được tạo",
    description: "Biên bản họp tháng 7",
    time: "1 giờ trước",
    type: "DOCUMENT",
  },
  {
    id: 4,
    title: "Sự kiện mới được lên lịch",
    description: "Workshop Kỹ năng lãnh đạo",
    time: "3 giờ trước",
    type: "EVENT",
  },
];

const UPCOMING_EVENTS = [
  {
    id: 1,
    title: "Workshop Kỹ năng lãnh đạo",
    date: "25",
    month: "THÁNG 7",
    time: "18:30 - 20:30",
  },
  {
    id: 2,
    title: "Họp Ban Truyền Thông",
    date: "27",
    month: "THÁNG 7",
    time: "19:00 - 20:00",
  },
  {
    id: 3,
    title: "Sự kiện Chào Tân Sinh Viên",
    date: "02",
    month: "THÁNG 8",
    time: "08:00 - 17:00",
  },
];

const DEPARTMENT_PROGRESS = [
  {
    name: "Ban Truyền Thông",
    completed: 18,
    total: 22,
    percentage: 82,
  },
  {
    name: "Ban Sự Kiện",
    completed: 14,
    total: 20,
    percentage: 70,
  },
  {
    name: "Ban Tài Chính",
    completed: 11,
    total: 15,
    percentage: 73,
  },
  {
    name: "Ban Nhân Sự",
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
                Tổng quan hoạt động, thành viên, tài chính và tiến độ của câu
                lạc bộ.
              </p>
            </div>

            <div className="dashboard-date">
              <CalendarDays size={18} />
              22 tháng 7, 2026
            </div>
          </header>

          <div className="dashboard-stat-grid">
            <StatCard
              title="Tổng thành viên"
              value="128"
              change="+12.5%"
              positive
              icon={<Users />}
              className="members"
            />

            <StatCard
              title="Sự kiện tháng này"
              value="8"
              change="+2 sự kiện"
              positive
              icon={<CalendarDays />}
              className="events"
            />

            <StatCard
              title="Công việc hoàn thành"
              value="74%"
              change="+8.2%"
              positive
              icon={<CheckCircle2 />}
              className="tasks"
            />

            <StatCard
              title="Số dư hiện tại"
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
                  <h2>Thu chi 6 tháng gần nhất</h2>
                  <p>Đơn vị: triệu đồng</p>
                </div>

                <select defaultValue="6_MONTHS">
                  <option value="6_MONTHS">6 tháng</option>
                  <option value="12_MONTHS">12 tháng</option>
                </select>
              </div>

              <div className="dashboard-chart-legend">
                <span>
                  <i className="income" />
                  Thu
                </span>

                <span>
                  <i className="expense" />
                  Chi
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
                  <h2>Tiến độ công việc</h2>
                  <p>Tổng quan trạng thái task</p>
                </div>

                <ListTodo size={22} />
              </div>

              <div className="task-donut-wrap">
                <div className="task-donut">
                  <div>
                    <strong>50</strong>
                    <span>Tổng task</span>
                  </div>
                </div>
              </div>

              <div className="task-summary-list">
                <SummaryRow label="Hoàn thành" value="28" className="done" />

                <SummaryRow
                  label="Đang thực hiện"
                  value="14"
                  className="doing"
                />

                <SummaryRow label="Chưa thực hiện" value="8" className="todo" />
              </div>
            </article>
          </div>

          <div className="dashboard-bottom-grid">
            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Hoạt động gần đây</h2>
                  <p>Cập nhật mới nhất trong câu lạc bộ</p>
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
                  <h2>Sự kiện sắp tới</h2>
                  <p>Lịch hoạt động trong thời gian tới</p>
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
                  <h2>Hiệu suất phòng ban</h2>
                  <p>Tỷ lệ hoàn thành công việc</p>
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
          {department.completed}/{department.total} công việc
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
