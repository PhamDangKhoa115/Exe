import GlideList from "../../components/reactbits/GlideList";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, BarChart3, Building2, LayoutDashboard, LogOut, Menu, MessageSquare, RefreshCw, Settings, ShieldCheck, Users, X } from "lucide-react";
import { AdminOverview, AdminAnalytics, AdminUsers, AdminClubs, AdminFeedback } from './AdminDataViews';
import "../../styles.css";
import './AdminDataViews.css';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [revision, setRevision] = useState(0);
  const logout = () => { localStorage.clear(); navigate('/login', { replace: true }); };
  return <div className="admin-layout">
    <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onExit={() => navigate('/')} activeTab={activeTab} onSelect={setActiveTab} onLogout={logout}/>
    <main className="admin-main">
      <header className="admin-topbar"><div className="admin-topbar-left"><button type="button" className="admin-mobile-menu" aria-label="Open administration menu" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button><div><h1>System Administration</h1><p>Monitor and manage the entire S-Club platform.</p></div></div><div className="admin-topbar-right"><button type="button" className="admin-refresh-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={17}/>Refresh</button><div className="admin-account"><div className="admin-account-avatar">SA</div><div><strong>{localStorage.getItem('fullName') || 'System Admin'}</strong><span>Administrator</span></div></div></div></header>
      <section className="admin-dashboard"><div className="admin-page-heading"><div><h2>{activeTab === 'Overview' ? 'Dashboard Overview' : activeTab}</h2><p>Authenticated administration data</p></div></div>
        {activeTab === 'Overview' && <AdminOverview revision={revision}/>}
        {activeTab === 'Analytics' && <AdminAnalytics revision={revision}/>}
        {activeTab === 'Users' && <AdminUsers revision={revision}/>}
        {activeTab === 'Clubs' && <AdminClubs revision={revision}/>}
        {activeTab === 'Feedback' && <AdminFeedback revision={revision}/>}
        {activeTab === 'System Activity' && <AdminOverview revision={revision} activityOnly/>}
      </section>
    </main>
  </div>;
}

function AdminSidebar({ open, onClose, onExit, activeTab, onSelect, onLogout }) {
  const menus = [
    {
      label: "Overview",
      icon: <LayoutDashboard size={19} />,

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
      label: "Feedback",
      icon: <MessageSquare size={19} />,
    },
    {
      label: "Settings",
      icon: <Settings size={19} />,
      disabled: true,
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

        <GlideList className="admin-navigation">
          <p>ADMINISTRATION</p>

          {menus.map((menu) => (
            <button
              type="button"
              className={activeTab === menu.label ? "active" : ""}
              disabled={menu.disabled}
              title={menu.disabled ? 'No verified Admin settings endpoint is available.' : undefined}
              onClick={() => { onSelect(menu.label); onClose(); }}
              key={menu.label}
            >
              {menu.icon}
              <span>{menu.label}</span>
            </button>
          ))}
        </GlideList>

        <div className="admin-sidebar-footer">
          <div className="admin-system-health">
            <span />
            <div>
              <strong>Administrator Session</strong>
              <small>Backend authorization required</small>
            </div>
          </div>

          <button type="button" onClick={onLogout}><LogOut size={18}/>Log Out</button>
          <button type="button" onClick={onExit}>
            <LogOut size={18} />
            Return to Website
          </button>
        </div>
      </aside>
    </>
  );
}
