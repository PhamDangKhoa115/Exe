import { Link, useLocation } from "react-router-dom";
import {
  FaBell,
  FaChartPie,
  FaUsers,
  FaFileAlt,
  FaBuilding,
  FaCalendarAlt,
  FaMoneyBill,
  FaChartBar,
  FaCog,
  FaTable,
  FaWpforms,
} from "react-icons/fa";
export default function Sidebar() {
  const location = useLocation();
  const menus = [
    { name: "Home", path: "/home", icon: <FaChartPie /> },
    { name: "Global Notifications", path: "/dashboard", icon: <FaBell /> },
    { name: "Dashboard", path: "/dashboard", icon: <FaChartPie /> },
    { name: "Members", path: "/dashboard", icon: <FaUsers /> },

    {
      name: "Google Docs",
      path: "/google-docs",
      icon: <FaFileAlt />,
    },

    {
      name: "Google Sheets",
      path: "/google-sheets",
      icon: <FaTable />,
    },

    {
      name: "Google Forms",
      path: "/google-forms",
      icon: <FaWpforms />,
    },
    { name: "Trello", path: "/trello", icon: <FaTable /> },
    { name: "Calendar", path: "/calendar", icon: <FaCalendarAlt /> },
    { name: "Finance", path: "/dashboard", icon: <FaMoneyBill /> },
  ];

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <div className="logo">CS</div>
        <div>
          <h2>ClubSync</h2>
          <p>CLUB MANAGER PRO</p>
        </div>
      </div>

      <nav className="side-menu">
        {menus.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={
              location.pathname === item.path ||
              (item.path === "/google-docs" &&
                location.pathname.startsWith("/documents/"))
                ? "active"
                : ""
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <button
        className="logout-btn"
        onClick={() => {
          localStorage.clear();

          window.location = "/login";
        }}
      >
        Logout
      </button>
      <div className="upgrade-box">
        <h3>Upgrade to Premium</h3>
        <p>Unlock advanced analytics, finance automation and AI assistant.</p>
        <button>Upgrade pack</button>
      </div>
    </aside>
  );
}
