import GlideList from "./reactbits/GlideList";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import SpotlightCard from "./reactbits/SpotlightCard";
import StarBorder from "./reactbits/StarBorder";
export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const menus = [
    { name: "Home", path: "/home", icon: <FaChartPie /> },
    {
      name: "Global Notifications",
      path: "/global-notifications",
      icon: <FaBell />,
    },
    { name: "Dashboard", path: "/dashboard", icon: <FaChartPie /> },
    { name: "Members", path: "/members", icon: <FaUsers /> },

    {
      name: "Documents",
      path: "/google-docs",
      icon: <FaFileAlt />,
    },

    {
      name: "Spreadsheets",
      path: "/google-sheets",
      icon: <FaTable />,
    },
    {
      path: "/departments",
      name: "Departments",
      icon: <FaBuilding />,
    },
    {
      name: "Forms",
      path: "/google-forms",
      icon: <FaWpforms />,
    },
    { name: "Trello", path: "/trello", icon: <FaTable /> },
    { name: "Calendar", path: "/calendar", icon: <FaCalendarAlt /> },
    { name: "Finance", path: "/finance", icon: <FaMoneyBill /> },
  ];

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <img src="/logo.png" alt="ClubSync Logo" className="sidebar-logo" />

        <div>
          <h2>ClubSync</h2>
          <p>CLUB MANAGER PRO</p>
        </div>
      </div>

      <GlideList className="side-menu">
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
      </GlideList>

      <SpotlightCard className="upgrade-box" spotlightColor="rgba(167, 139, 250, 0.28)">
        <h3>Upgrade to Premium</h3>
        <p>Unlock advanced analytics, finance automation and AI assistant.</p>
        <StarBorder type="button" color="#c4b5fd" backgroundColor="#4c1d95" borderColor="#4c1d95" onClick={() => navigate("/dashboard#subscription")}>Upgrade pack</StarBorder>
      </SpotlightCard>
    </aside>
  );
}
