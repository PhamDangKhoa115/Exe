import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardPage() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Dashboard" />

        <section className="dashboard-content">
          <div className="welcome-card">
            <h1>
              Welcome to <span>S-Club</span>
            </h1>
            <p>Manage your club activities smarter and faster.</p>
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <h3>Total Members</h3>
              <strong>245</strong>
              <p>+12 this month</p>
            </div>

            <div className="stat-card">
              <h3>Upcoming Events</h3>
              <strong>8</strong>
              <p>3 events this week</p>
            </div>

            <div className="stat-card">
              <h3>Pending Applications</h3>
              <strong>36</strong>
              <p>Need review</p>
            </div>

            <div className="stat-card">
              <h3>Current Balance</h3>
              <strong>12.5M</strong>
              <p>VND available</p>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="panel">
              <h2>Recent Activities</h2>

              <div className="activity-item">
                <b>New event created</b>
                <p>Workshop: Design Thinking</p>
              </div>

              <div className="activity-item">
                <b>New member joined</b>
                <p>Nguyen Minh Anh joined Media Department</p>
              </div>

              <div className="activity-item">
                <b>Finance updated</b>
                <p>Event budget approved</p>
              </div>
            </div>

            <div className="panel">
              <h2>Quick Actions</h2>
              <button>Create Event</button>
              <button>Review Applications</button>
              <button>Export Report</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
