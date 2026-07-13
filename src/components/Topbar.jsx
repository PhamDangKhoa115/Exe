import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaCog,
  FaExchangeAlt,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";

export default function Topbar({ title = "Home Page" }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <h2>{title}</h2>

      <div className="profile-box">
        <FaBell className="bell" />

        <div className="profile-info">
          <b>{localStorage.getItem("fullName")}</b>
          <span>
            {localStorage.getItem("selectedClubRole") || "CLB MANAGER"}
          </span>
        </div>

        <img
          src={
            localStorage.getItem("avatarUrl") ||
            "https://i.pravatar.cc/100?img=32"
          }
          alt="avatar"
          onClick={() => setOpen(!open)}
        />

        {open && (
          <div className="profile-dropdown">
            <button onClick={() => navigate("/profile")}>
              <FaUser /> Profile
            </button>

            <button onClick={() => navigate("/setting")}>
              <FaCog /> Setting
            </button>

            <button onClick={logout}>
              <FaSignOutAlt /> Logout
            </button>

            <button onClick={() => navigate("/select-club")}>
              <FaExchangeAlt /> Switch Club
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
