import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Mail,
  Megaphone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles.css";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: "Annual Tech Symposium 2026: Call for Volunteers",
    description:
      "Big tech event coming up. We need volunteers for logistics, communications, and event management.",
    category: "CLUB_EVENT",
    categoryLabel: "Club Event",
    date: "24/07/2026",
    visibility: 84,
    status: "PUBLISHED",
    featured: true,
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Weekly Progress Update",
    description:
      "All department heads need to submit weekly progress reports before 5:00 PM on Fridays.",
    category: "REMINDER",
    categoryLabel: "Reminder",
    date: "22/07/2026",
    visibility: 84,
    status: "PUBLISHED",
    featured: false,
  },
  {
    id: 3,
    title: "New Member Onboarding",
    description:
      "Welcome 15 new members. The onboarding session will be held next week.",
    category: "MEMBER",
    categoryLabel: "Member",
    date: "21/07/2026",
    visibility: 92,
    status: "PUBLISHED",
    featured: false,
  },
  {
    id: 4,
    title: "Urgent: Server Maintenance",
    description:
      "The club system will be temporarily unavailable from 11:00 PM to 1:00 AM for maintenance.",
    category: "URGENT",
    categoryLabel: "Urgent",
    date: "20/07/2026",
    visibility: 20,
    status: "ARCHIVED",
    featured: false,
  },
  {
    id: 5,
    title: "Partnership Announcement",
    description: "The club officially partners with Global Innovation Network.",
    category: "ANNOUNCEMENT",
    categoryLabel: "Announcement",
    date: "18/07/2026",
    visibility: 100,
    status: "SCHEDULED",
    featured: false,
  },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "ANNOUNCEMENT",
  status: "PUBLISHED",
  image: "",
  featured: false,
};

export default function GlobalNotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState("PUBLISHED");
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filteredNotifications = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesTab =
        activeTab === "ALL" || notification.status === activeTab;

      const matchesSearch =
        !keyword ||
        [
          notification.title,
          notification.description,
          notification.categoryLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, notifications, searchText]);

  const featuredNotification =
    filteredNotifications.find((item) => item.featured) ||
    filteredNotifications[0];

  const secondaryNotifications = filteredNotifications.filter(
    (item) => item.id !== featuredNotification?.id,
  );

  const openCreateModal = () => {
    setEditingNotification(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (notification) => {
    setEditingNotification(notification);

    setForm({
      title: notification.title || "",
      description: notification.description || "",
      category: notification.category || "ANNOUNCEMENT",
      status: notification.status || "PUBLISHED",
      image: notification.image || "",
      featured: Boolean(notification.featured),
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNotification(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      alert("Please enter a title for the notification.");
      return;
    }

    if (!form.description.trim()) {
      alert("Please enter the content for the notification.");
      return;
    }

    const categoryLabels = {
      ANNOUNCEMENT: "Announcement",
      CLUB_EVENT: "Club Event",
      MEMBER: "Member",
      REMINDER: "Reminder",
      URGENT: "Urgent",
    };

    if (editingNotification) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === editingNotification.id
            ? {
                ...item,
                ...form,
                categoryLabel: categoryLabels[form.category],
              }
            : item,
        ),
      );
    } else {
      const nextNotification = {
        id: Date.now(),
        ...form,
        categoryLabel: categoryLabels[form.category],
        date: new Date().toLocaleDateString("vi-VN"),
        visibility: 0,
      };

      setNotifications((current) => [nextNotification, ...current]);
    }

    closeModal();
  };

  const handleDelete = (notification) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the notification "${notification.title}"?`,
    );

    if (!confirmed) return;

    setNotifications((current) =>
      current.filter((item) => item.id !== notification.id),
    );
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page / Global Notifications" />

        <section className="notification-page">
          <header className="notification-header">
            <div className="notification-heading">
              <Megaphone size={34} />

              <div>
                <h1>Notifications</h1>

                <p>
                  Manage notifications, activities, and updates for club
                  members.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="notification-new-button"
              onClick={openCreateModal}
            >
              <Plus size={18} />
              New Post
            </button>
          </header>

          <div className="notification-toolbar">
            <div className="notification-tabs">
              <TabButton
                active={activeTab === "PUBLISHED"}
                label="Your Club Posts"
                onClick={() => setActiveTab("PUBLISHED")}
              />

              <TabButton
                active={activeTab === "ARCHIVED"}
                label="Archived"
                onClick={() => setActiveTab("ARCHIVED")}
              />

              <TabButton
                active={activeTab === "SCHEDULED"}
                label="Scheduled"
                onClick={() => setActiveTab("SCHEDULED")}
              />

              <TabButton
                active={activeTab === "ALL"}
                label="All Posts"
                onClick={() => setActiveTab("ALL")}
              />
            </div>

            <div className="notification-search">
              <Search size={17} />

              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm kiếm thông báo..."
              />
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="notification-empty">
              <Bell size={46} />
              <h2>no notifications</h2>
              <p>There are no notifications to display.</p>
            </div>
          ) : (
            <div className="notification-layout single-column">
              <div className="notification-main-column">
                {featuredNotification && (
                  <FeaturedNotificationCard
                    notification={featuredNotification}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                )}

                <div className="notification-small-grid">
                  {secondaryNotifications.map((notification) => (
                    <SmallNotificationCard
                      key={notification.id}
                      notification={notification}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {showModal && (
          <NotificationModal
            form={form}
            setForm={setForm}
            editing={Boolean(editingNotification)}
            onClose={closeModal}
            onSave={handleSave}
          />
        )}
      </main>
    </div>
  );
}

function TabButton({ active, label, onClick }) {
  return (
    <button type="button" className={active ? "active" : ""} onClick={onClick}>
      {label}
    </button>
  );
}

function FeaturedNotificationCard({ notification, onEdit, onDelete }) {
  return (
    <article className="featured-notification-card">
      {notification.image && (
        <div className="featured-notification-image">
          <img src={notification.image} alt={notification.title} />

          <div className="featured-badges">
            <span>FEATURED</span>
            <span>{notification.categoryLabel}</span>
          </div>
        </div>
      )}

      <div className="featured-notification-body">
        <div className="notification-card-actions">
          <button type="button" onClick={() => onEdit(notification)}>
            <Edit3 size={17} />
          </button>

          <button type="button" onClick={() => onDelete(notification)}>
            <Trash2 size={17} />
          </button>
        </div>

        <small>Posted on {notification.date}</small>

        <h2>{notification.title}</h2>

        <p>{notification.description}</p>

        <div className="notification-card-footer">
          <div className="notification-audience">
            <div className="audience-avatar">M</div>
            <div className="audience-avatar">A</div>
            <div className="audience-avatar">K</div>
            <span>+42</span>
          </div>

          <div className="notification-visibility">
            <Eye size={15} />
            Seen by {notification.visibility}% members
          </div>
        </div>
      </div>
    </article>
  );
}

function SmallNotificationCard({ notification, onEdit, onDelete }) {
  return (
    <article className="small-notification-card">
      <div className="small-notification-top">
        <NotificationIcon category={notification.category} />

        <div className="notification-card-actions">
          <button type="button" onClick={() => onEdit(notification)}>
            <Edit3 size={15} />
          </button>

          <button type="button" onClick={() => onDelete(notification)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <small>{notification.date}</small>
      <h3>{notification.title}</h3>
      <p>{notification.description}</p>

      <span className="side-notification-visibility">
        <Eye size={13} />
        Seen by {notification.visibility}% members
      </span>
    </article>
  );
}

function NotificationIcon({ category }) {
  const icons = {
    ANNOUNCEMENT: <Mail size={18} />,
    CLUB_EVENT: <CalendarDays size={18} />,
    MEMBER: <Users size={18} />,
    REMINDER: <CheckCircle2 size={18} />,
    URGENT: <Clock3 size={18} />,
  };

  return (
    <span className={`notification-type-icon ${category.toLowerCase()}`}>
      {icons[category] || <Bell size={18} />}
    </span>
  );
}

function NotificationModal({ form, setForm, editing, onClose, onSave }) {
  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div
      className="notification-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="notification-modal">
        <header>
          <div>
            <h2>{editing ? "Edit Notification" : "Create New Notification"}</h2>
            <p>This notification is using hardcoded data on the frontend.</p>
          </div>

          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="notification-modal-body">
          <label>Title</label>

          <input
            type="text"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Enter notification title..."
          />

          <label>Content</label>

          <textarea
            rows="5"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            placeholder="Enter notification content..."
          />

          <div className="notification-form-grid">
            <div>
              <label>Notification Type</label>

              <select
                value={form.category}
                onChange={(event) => setField("category", event.target.value)}
              >
                <option value="ANNOUNCEMENT">Announcement</option>
                <option value="CLUB_EVENT">Club Event</option>
                <option value="MEMBER">Member</option>
                <option value="REMINDER">Reminder</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label>Status</label>

              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
              >
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <label>Image URL</label>

          <input
            type="url"
            value={form.image}
            onChange={(event) => setField("image", event.target.value)}
            placeholder="https://..."
          />

          <label className="notification-featured-checkbox">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => setField("featured", event.target.checked)}
            />
            Set as Featured
          </label>
        </div>

        <footer>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>

          <button type="button" className="primary" onClick={onSave}>
            {editing ? "Save Changes" : "Publish Notification"}
          </button>
        </footer>
      </div>
    </div>
  );
}
