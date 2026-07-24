import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "react-toastify";

import { getAdminDashboard } from "../../api/adminApi";

import "../../styles.css";

const PIE_COLORS = ["#6d28d9", "#2563eb", "#16a34a", "#f59e0b", "#ec4899"];

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getAdminDashboard();

      setData(result);
    } catch (error) {
      console.error(
        "LOAD ADMIN DASHBOARD ERROR:",
        error?.response?.data || error,
      );

      toast.error("Cannot load Admin Dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const displayedClubs = useMemo(() => {
    if (!data?.clubs) return [];

    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return data.clubs.slice(0, 6);
    }

    return data.clubs
      .filter((club) =>
        [club.name, club.clubName, club.createdByName, club.visibility]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword),
      )
      .slice(0, 6);
  }, [data, search]);

  return (
    <div className="admin-layout">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onExit={() => navigate("/")}
      />

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>

            <div>
              <h1>System Administration</h1>
              <p>Monitor and manage the entire S-Club platform.</p>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-refresh-button"
              disabled={loading}
              onClick={loadDashboard}
            >
              <RefreshCw size={17} className={loading ? "admin-spin" : ""} />
              Refresh
            </button>

            <div className="admin-account">
              <div className="admin-account-avatar">SA</div>

              <div>
                <strong>System Admin</strong>
                <span>Super Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <section className="admin-dashboard">
          <div className="admin-page-heading">
            <div>
              <h2>Dashboard Overview</h2>

              <p>Platform statistics, growth and system feature usage.</p>
            </div>

            <span
              className={`admin-api-status ${
                data?.clubApiAvailable ? "online" : "mock"
              }`}
            >
              {data?.clubApiAvailable ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              Club data: {data?.clubApiAvailable ? "Live API" : "Mock data"}
            </span>
          </div>

          {loading && !data ? (
            <div className="admin-loading">
              <RefreshCw size={38} className="admin-spin" />
              <p>Loading administration data...</p>
            </div>
          ) : (
            <>
              <div className="admin-stat-grid">
                <AdminStatCard
                  title="Total Accounts"
                  value={formatNumber(data?.totalUsers)}
                  description={`${data?.newUsersThisMonth || 0} new this month`}
                  icon={<Users />}
                  className="users"
                  mock
                />

                <AdminStatCard
                  title="Total Clubs"
                  value={formatNumber(data?.totalClubs)}
                  description={
                    data?.clubApiAvailable
                      ? "Loaded from current API"
                      : "Temporary mock value"
                  }
                  icon={<Building2 />}
                  className="clubs"
                  live={data?.clubApiAvailable}
                />

                <AdminStatCard
                  title="Active Users"
                  value={formatNumber(data?.activeUsers)}
                  description="Monthly active accounts"
                  icon={<Activity />}
                  className="active"
                  mock
                />

                <AdminStatCard
                  title="Total Content"
                  value={formatNumber(
                    (data?.totalDocuments || 0) +
                      (data?.totalForms || 0) +
                      (data?.totalSheets || 0),
                  )}
                  description="Documents, forms and sheets"
                  icon={<FileText />}
                  className="content"
                  mock
                />
              </div>

              <div className="admin-secondary-stats">
                <MiniStat
                  label="Documents"
                  value={data?.totalDocuments}
                  icon={<FileText />}
                />

                <MiniStat
                  label="Events"
                  value={data?.totalEvents}
                  icon={<CalendarDays />}
                />

                <MiniStat
                  label="Tasks"
                  value={data?.totalTasks}
                  icon={<ClipboardList />}
                />

                <MiniStat
                  label="Forms"
                  value={data?.totalForms}
                  icon={<FileText />}
                />

                <MiniStat
                  label="Spreadsheets"
                  value={data?.totalSheets}
                  icon={<FileSpreadsheet />}
                />
              </div>

              <div className="admin-chart-grid">
                <AdminPanel
                  title="Platform Growth"
                  description="User and club growth by month"
                  badge="Mock analytics"
                >
                  <div className="admin-chart">
                    <ResponsiveContainer width="100%" height={330}>
                      <LineChart
                        data={data?.userGrowth || []}
                        margin={{
                          top: 20,
                          right: 20,
                          left: -10,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="#e8eaf1"
                        />

                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip />
                        <Legend />

                        <Line
                          type="monotone"
                          dataKey="users"
                          name="Users"
                          stroke="#6d28d9"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                          }}
                          activeDot={{
                            r: 6,
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="clubs"
                          name="Clubs"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </AdminPanel>

                <AdminPanel
                  title="Feature Usage"
                  description="Estimated usage distribution"
                  badge="Mock analytics"
                >
                  <div className="admin-pie-wrap">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data?.featureUsage || []}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={94}
                          paddingAngle={4}
                        >
                          {(data?.featureUsage || []).map((item, index) => (
                            <Cell
                              key={item.name}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="admin-pie-legend">
                      {(data?.featureUsage || []).map((item, index) => (
                        <div key={item.name}>
                          <span
                            style={{
                              background: PIE_COLORS[index % PIE_COLORS.length],
                            }}
                          />

                          <p>{item.name}</p>
                          <strong>{item.value}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </AdminPanel>
              </div>

              <AdminPanel
                title="Monthly System Usage"
                description="Content created through platform features"
                badge="Mock analytics"
              >
                <div className="admin-chart admin-usage-chart">
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart
                      data={data?.monthlyUsage || []}
                      barGap={4}
                      barCategoryGap="22%"
                      margin={{
                        top: 20,
                        right: 20,
                        left: -10,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid vertical={false} stroke="#e8eaf1" />

                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip />
                      <Legend />

                      <Bar
                        dataKey="documents"
                        name="Documents"
                        fill="#6d28d9"
                        radius={[6, 6, 0, 0]}
                      />

                      <Bar
                        dataKey="events"
                        name="Events"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                      />

                      <Bar
                        dataKey="forms"
                        name="Forms"
                        fill="#16a34a"
                        radius={[6, 6, 0, 0]}
                      />

                      <Bar
                        dataKey="sheets"
                        name="Sheets"
                        fill="#f59e0b"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </AdminPanel>

              <div className="admin-bottom-grid">
                <AdminPanel
                  title="Current Clubs"
                  description="Clubs registered in the system"
                  badge={data?.clubApiAvailable ? "Live API" : "Mock data"}
                >
                  <div className="admin-table-search">
                    <Search size={17} />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search clubs..."
                    />
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Club</th>
                          <th>Visibility</th>
                          <th>Manager</th>
                          <th>Created</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {displayedClubs.length === 0 ? (
                          <tr>
                            <td colSpan="5">
                              <div className="admin-table-empty">
                                No club data found.
                              </div>
                            </td>
                          </tr>
                        ) : (
                          displayedClubs.map((club, index) => (
                            <tr key={club.id ?? index}>
                              <td>
                                <div className="admin-club-cell">
                                  <div>
                                    {(club.name || club.clubName || "C")
                                      .slice(0, 1)
                                      .toUpperCase()}
                                  </div>

                                  <strong>
                                    {club.name ||
                                      club.clubName ||
                                      "Unnamed Club"}
                                  </strong>
                                </div>
                              </td>

                              <td>
                                <span className="admin-visibility">
                                  {club.visibility || "UNKNOWN"}
                                </span>
                              </td>

                              <td>
                                {club.createdByName ||
                                  club.presidentName ||
                                  "Not available"}
                              </td>

                              <td>{formatDate(club.createdAt)}</td>

                              <td>
                                <span className="admin-status active">
                                  Active
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </AdminPanel>

                <AdminPanel
                  title="Recent System Activity"
                  description="Latest operations in the platform"
                  badge="Mock activity"
                >
                  <div className="admin-activity-list">
                    {(data?.recentActivities || []).map((activity) => (
                      <div className="admin-activity-item" key={activity.id}>
                        <div
                          className={`admin-activity-icon ${activity.type.toLowerCase()}`}
                        >
                          <ActivityTypeIcon type={activity.type} />
                        </div>

                        <div>
                          <p>
                            <strong>{activity.actor}</strong> {activity.action}
                          </p>

                          <span>{activity.target}</span>
                          <small>{activity.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </AdminPanel>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminSidebar({ open, onClose, onExit }) {
  const menus = [
    {
      label: "Overview",
      icon: <LayoutDashboard size={19} />,
      active: true,
    },
    {
      label: "Users",
      icon: <Users size={19} />,
    },
    {
      label: "Clubs",
      icon: <Building2 size={19} />,
    },
    {
      label: "Analytics",
      icon: <BarChart3 size={19} />,
    },
    {
      label: "System Activity",
      icon: <Activity size={19} />,
    },
    {
      label: "Settings",
      icon: <Settings size={19} />,
    },
  ];

  return (
    <>
      {open && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}

      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="admin-brand">
          <div>
            <ShieldCheck size={27} />
          </div>

          <span>
            <strong>S-Club Admin</strong>
            <small>System Management</small>
          </span>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-navigation">
          <p>ADMINISTRATION</p>

          {menus.map((menu) => (
            <button
              type="button"
              className={menu.active ? "active" : ""}
              key={menu.label}
            >
              {menu.icon}
              <span>{menu.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-system-health">
            <span />
            <div>
              <strong>System Operational</strong>
              <small>All services running</small>
            </div>
          </div>

          <button type="button" onClick={onExit}>
            <LogOut size={18} />
            Return to Website
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminStatCard({ title, value, description, icon, className, live }) {
  return (
    <article className={`admin-stat-card ${className}`}>
      <div className="admin-stat-card-top">
        <div className="admin-stat-icon">{icon}</div>

        <span className={live ? "live" : "mock"}>{live ? "LIVE" : "MOCK"}</span>
      </div>

      <strong>{value}</strong>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function MiniStat({ label, value, icon }) {
  return (
    <article className="admin-mini-stat">
      <div>{icon}</div>

      <span>
        <strong>{formatNumber(value)}</strong>
        <small>{label}</small>
      </span>
    </article>
  );
}

function AdminPanel({ title, description, badge, children }) {
  return (
    <article className="admin-panel">
      <header className="admin-panel-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        {badge && <span>{badge}</span>}
      </header>

      {children}
    </article>
  );
}

function ActivityTypeIcon({ type }) {
  const icons = {
    CLUB: <Building2 size={17} />,
    DOCUMENT: <FileText size={17} />,
    EVENT: <CalendarDays size={17} />,
    TRELLO: <ClipboardList size={17} />,
    USER: <Users size={17} />,
  };

  return icons[type] || <Activity size={17} />;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-GB");
}
