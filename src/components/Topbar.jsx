import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaCog,
  FaExchangeAlt,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";

import API from "../api/api";

const FALLBACK_AVATAR = "https://placehold.co/100x100?text=User";

export default function Topbar({ title = "Home Page" }) {
  const [open, setOpen] = useState(false);

  const [profile, setProfile] = useState({
    fullName: localStorage.getItem("fullName") || "User",

    avatarUrl: localStorage.getItem("avatarUrl") || "",
  });

  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem("userId");

  const isSelectClubPage = location.pathname === "/select-club";

  useEffect(() => {
    if (!userId) return;

    let active = true;

    async function loadProfile() {
      try {
        const response = await API.get(`/api/users/${userId}`);

        const user = response.data || {};

        if (!active) return;

        const fullName =
          user.fullName || localStorage.getItem("fullName") || "User";

        const avatarUrl =
          user.avatarUrl || localStorage.getItem("avatarUrl") || "";

        setProfile({
          fullName,
          avatarUrl,
        });

        localStorage.setItem("fullName", fullName);

        if (avatarUrl) {
          localStorage.setItem("avatarUrl", avatarUrl);
        } else {
          localStorage.removeItem("avatarUrl");
        }
      } catch (error) {
        console.error(
          "LOAD TOPBAR PROFILE ERROR:",
          error?.response?.data || error,
        );
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.clear();

    navigate("/login", {
      replace: true,
    });
  };

  const handleAvatarClick = () => {
    setOpen((current) => !current);
  };

  const handleAvatarError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_AVATAR;
  };

  return (
    <header className="topbar">
      <h2>{title}</h2>

      <div className="profile-box">
        {!isSelectClubPage && <FaBell className="bell" />}

        <div className="profile-info">
          <b>{profile.fullName}</b>

          <span>
            {formatRole(
              localStorage.getItem("selectedClubRole"),
              isSelectClubPage,
            )}
          </span>
        </div>

        <button
          type="button"
          className="topbar-avatar-button"
          onClick={handleAvatarClick}
          aria-label="Open profile menu"
          aria-expanded={open}
        >
          <img
            src={
              isValidImageUrl(profile.avatarUrl)
                ? profile.avatarUrl
                : FALLBACK_AVATAR
            }
            alt={profile.fullName}
            onError={handleAvatarError}
            className="topbar-avatar"
          />
        </button>

        {open && (
          <div
            className={`profile-dropdown ${
              isSelectClubPage ? "logout-only" : ""
            }`}
          >
            {!isSelectClubPage && (
              <>
                <button type="button" onClick={() => navigate("/profile")}>
                  <FaUser />
                  Profile
                </button>

                <button type="button" onClick={() => navigate("/setting")}>
                  <FaCog />
                  Setting
                </button>

                <button type="button" onClick={() => navigate("/select-club")}>
                  <FaExchangeAlt />
                  Switch Club
                </button>
              </>
            )}

            <button type="button" className="logout-button" onClick={logout}>
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function isValidImageUrl(value) {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    /^https?:\/\//i.test(value)
  );
}

function formatRole(role, isSelectClubPage) {
  if (isSelectClubPage) {
    return "CHOOSE CLUB";
  }

  const labels = {
    PRESIDENT: "CLB MANAGER",
    CLUB_MANAGER: "CLB MANAGER",
    DEPARTMENT_HEAD: "DEPARTMENT HEAD",
    TREASURER: "TREASURER",
    MEMBER: "MEMBER",
  };

  return labels[String(role || "").toUpperCase()] || "CLB MEMBER";
}
