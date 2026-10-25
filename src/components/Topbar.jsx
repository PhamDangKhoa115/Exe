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
import { getChatNotifications } from "../api/chatNotification";
const FALLBACK_AVATAR = "https://placehold.co/100x100?text=User";

export default function Topbar({ title = "Home Page" }) {
  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState({
    fullName: localStorage.getItem("fullName") || "User",

    avatarUrl: localStorage.getItem("avatarUrl") || "",
  });

  const navigate = useNavigate();
  const location = useLocation();

  const userId = localStorage.getItem("userId");
  const selectedClubId = localStorage.getItem("selectedClubId");
  const isSelectClubPage = location.pathname === "/select-club";
  useEffect(() => {
    if (!userId || !selectedClubId || isSelectClubPage) {
      return;
    }

    let active = true;

    const checkNotifications = async (firstLoad = false) => {
      try {
        const data = await getChatNotifications();

        if (!active) return;

        const sorted = [...data].sort((a, b) => {
          return (
            getNotificationTimestamp(b.createdAt) -
            getNotificationTimestamp(a.createdAt)
          );
        });

        const latest = sorted.slice(0, 20);

        setNotifications(latest);

        if (firstLoad) {
          // Lần đầu mở app không coi toàn bộ lịch sử là unread.
          latest.forEach((notification) => {
            markNotificationSeen(notification.id);
          });

          return;
        }

        const newNotifications = latest.filter(
          (notification) => !isNotificationSeen(notification.id),
        );

        if (newNotifications.length > 0) {
          setUnreadCount((current) => current + newNotifications.length);

          newNotifications.forEach((notification) => {
            markNotificationSeen(notification.id);
          });
        }
      } catch (error) {
        console.error(
          "LOAD CHAT NOTIFICATION ERROR:",
          error?.response?.data || error,
        );
      }
    };

    checkNotifications(true);

    const intervalId = window.setInterval(() => {
      checkNotifications(false);
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [userId, selectedClubId, isSelectClubPage]);
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
        {!isSelectClubPage && (
          <div className="topbar-notification">
            <button
              type="button"
              className="topbar-bell-button"
              onClick={() => {
                setNotificationOpen((current) => !current);
                setOpen(false);
                setUnreadCount(0);
              }}
              aria-label="Notifications"
            >
              <FaBell className="bell" />

              {unreadCount > 0 && (
                <span className="topbar-notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="topbar-notification-dropdown">
                <div className="topbar-notification-header">
                  <strong>Notifications</strong>

                  {notifications.length > 0 && (
                    <span>{notifications.length}</span>
                  )}
                </div>

                <div className="topbar-notification-list">
                  {notifications.length === 0 ? (
                    <div className="topbar-notification-empty">
                      No new notifications.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        type="button"
                        className="topbar-notification-item"
                        key={`${notification.departmentId}-${notification.id}`}
                        onClick={() => {
                          setNotificationOpen(false);

                          navigate(
                            `/departments/${notification.departmentId}/chat`,
                            {
                              state: {
                                department: {
                                  id: notification.departmentId,
                                  name: notification.departmentName,
                                },
                              },
                            },
                          );
                        }}
                      >
                        <div className="topbar-notification-avatar">
                          {getInitials(notification.senderName)}
                        </div>

                        <div className="topbar-notification-content">
                          <div>
                            <strong>{notification.senderName}</strong>

                            <span>
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </div>

                          <p>
                            New message in <b>{notification.departmentName}</b>
                          </p>

                          <small>{notification.content}</small>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
    PRESIDENT: "CLUB MANAGER",
    CLUB_MANAGER: "CLUB MANAGER",
    DEPARTMENT_HEAD: "DEPARTMENT HEAD",
    TREASURER: "TREASURER",
    MEMBER: "MEMBER",
  };

  return labels[String(role || "").toUpperCase()] || "CLUB MEMBER";
}
function getInitials(name) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function parseNotificationDate(value) {
  if (!value) return null;

  let normalizedValue = String(value).trim();

  const hasTimezone =
    /Z$/i.test(normalizedValue) || /[+-]\d{2}:\d{2}$/.test(normalizedValue);

  if (!hasTimezone) {
    normalizedValue += "Z";
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getNotificationTimestamp(value) {
  const date = parseNotificationDate(value);

  return date ? date.getTime() : 0;
}

function formatNotificationTime(value) {
  const date = parseNotificationDate(value);

  if (!date) return "";

  return date.toLocaleTimeString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getSeenNotificationKey(id) {
  return `chat-notification-seen-${id}`;
}

function isNotificationSeen(id) {
  return localStorage.getItem(getSeenNotificationKey(id)) === "1";
}

function markNotificationSeen(id) {
  localStorage.setItem(getSeenNotificationKey(id), "1");
}
