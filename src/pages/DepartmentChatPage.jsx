import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AtSign,
  Bell,
  FileText,
  Image,
  MoreVertical,
  Paperclip,
  Pin,
  Search,
  Send,
  Smile,
  Users,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles.css";

const MOCK_MEMBERS = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Creative Director",
    initials: "SJ",
    online: true,
  },
  {
    id: 2,
    name: "James Doe",
    role: "Lead Coordinator",
    initials: "JD",
    online: true,
  },
  {
    id: 3,
    name: "Emma Watson",
    role: "Social Media Manager",
    initials: "EW",
    online: false,
  },
  {
    id: 4,
    name: "Alex Rivera",
    role: "Content Specialist",
    initials: "AR",
    online: true,
  },
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    senderId: 1,
    senderName: "Sarah Jenkins",
    senderInitials: "SJ",
    time: "09:32 AM",
    own: false,
    text: "Hey team, I just uploaded the new posters for the Spring Gala! Let me know if we need any adjustments to the typography.",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    senderId: 2,
    senderName: "James Doe",
    senderInitials: "JD",
    time: "10:45 AM",
    own: true,
    text: "Looks great! I really like the color palette. It fits the brand guide perfectly.",
    reactions: [
      { emoji: "🔥", count: 3 },
      { emoji: "🙌", count: 1 },
    ],
  },
  {
    id: 3,
    type: "divider",
    label: "TODAY",
  },
  {
    id: 4,
    senderId: 4,
    senderName: "Alex Rivera",
    senderInitials: "AR",
    time: "09:12 AM",
    own: false,
    text: "Good morning everyone! @MarketingTeam, just a reminder about the content strategy meeting at 2 PM today.",
  },
];

const MOCK_FILES = [
  {
    id: 1,
    name: "Brand Guideline v2.4.pdf",
    size: "4.2 MB",
  },
  {
    id: 2,
    name: "Content Calendar Q3.xlsx",
    size: "1.1 MB",
  },
  {
    id: 3,
    name: "Spring Gala Poster.png",
    size: "8.7 MB",
  },
];

export default function DepartmentChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { departmentId } = useParams();

  const currentUserId = Number(localStorage.getItem("userId")) || 999;
  const currentUserName = localStorage.getItem("fullName") || "You";

  const department = location.state?.department || {
    id: departmentId,
    name: "Marketing Department",
    description:
      "Driving the visual identity and communication strategies for all campus-wide events and organizational outreach.",
    memberCount: 24,
    headMemberName: "Sarah Jenkins",
  };

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [messageText, setMessageText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [detailTab, setDetailTab] = useState("DETAILS");

  const fileInputRef = useRef(null);

  const filteredMessages = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return messages;
    }

    return messages.filter((message) => {
      if (message.type === "divider") return false;

      return [message.senderName, message.text]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [messages, searchText]);

  const handleSendMessage = () => {
    const content = messageText.trim();

    if (!content) return;

    const now = new Date();

    const newMessage = {
      id: Date.now(),
      senderId: currentUserId,
      senderName: currentUserName,
      senderInitials: getInitials(currentUserName),
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      own: true,
      text: content,
    };

    setMessages((current) => [...current, newMessage]);
    setMessageText("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-layout department-chat-layout">
      <Sidebar />

      <main className="main-content department-chat-main-content">
        <Topbar title={`Home Page / Departments / ${department.name}`} />
        <section className="department-chat-page">
          <div className="department-chat-main">
            <header className="department-chat-header">
              <div className="department-chat-title">
                <button
                  type="button"
                  className="department-chat-back"
                  onClick={() => navigate("/departments")}
                  title="Back to Departments"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="department-chat-avatar">
                  {getInitials(department.name)}
                  <span />
                </div>

                <div>
                  <h1>{department.name}</h1>

                  <p>
                    {department.memberCount || MOCK_MEMBERS.length} Members
                    <span>•</span>
                    Active now
                  </p>
                </div>
              </div>

              <div className="department-chat-header-actions">
                <div className="department-chat-search">
                  <Search size={17} />

                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search in chat..."
                  />
                </div>

                <button type="button" title="Notifications">
                  <Bell size={19} />
                </button>

                <button type="button" title="More">
                  <MoreVertical size={19} />
                </button>
              </div>
            </header>

            <div className="department-chat-messages">
              {filteredMessages.length === 0 ? (
                <div className="department-chat-empty">
                  <Search size={36} />
                  <h2>No messages found</h2>
                  <p>Try another search keyword.</p>
                </div>
              ) : (
                filteredMessages.map((message) => {
                  if (message.type === "divider") {
                    return (
                      <div className="department-chat-divider" key={message.id}>
                        <span />
                        <strong>{message.label}</strong>
                        <span />
                      </div>
                    );
                  }

                  return <ChatMessage key={message.id} message={message} />;
                })
              )}
            </div>

            <div className="department-chat-composer-wrap">
              <div className="department-chat-composer">
                <textarea
                  rows="2"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                />

                <div className="department-chat-composer-footer">
                  <div className="department-chat-tools">
                    <button type="button" title="Emoji">
                      <Smile size={18} />
                    </button>

                    <button
                      type="button"
                      title="Attach file"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip size={18} />
                    </button>

                    <button type="button" title="Image">
                      <Image size={18} />
                    </button>

                    <button
                      type="button"
                      title="Mention member"
                      onClick={() => setMessageText((current) => `${current}@`)}
                    >
                      <AtSign size={18} />
                    </button>

                    <input ref={fileInputRef} type="file" hidden />
                  </div>

                  <button
                    type="button"
                    className="department-chat-send"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    Send
                    <Send size={17} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="department-chat-sidebar">
            <div className="department-chat-sidebar-tabs">
              <button
                type="button"
                className={detailTab === "DETAILS" ? "active" : ""}
                onClick={() => setDetailTab("DETAILS")}
              >
                Details
              </button>

              <button
                type="button"
                className={detailTab === "FILES" ? "active" : ""}
                onClick={() => setDetailTab("FILES")}
              >
                Files
              </button>
            </div>

            {detailTab === "DETAILS" ? (
              <DepartmentDetails
                department={department}
                members={MOCK_MEMBERS}
              />
            ) : (
              <DepartmentFiles files={MOCK_FILES} />
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}

function ChatMessage({ message }) {
  return (
    <article
      className={`department-chat-message ${message.own ? "own" : "other"}`}
    >
      {!message.own && (
        <div className="department-message-avatar">
          {message.senderInitials}
          <span />
        </div>
      )}

      <div className="department-message-column">
        <div className="department-message-meta">
          {!message.own && <strong>{message.senderName}</strong>}

          <span>{message.time}</span>

          {message.own && <strong>{message.senderName}</strong>}
        </div>

        <div className="department-message-bubble">
          <p>{renderMessageText(message.text)}</p>

          {message.image && <img src={message.image} alt="Shared content" />}
        </div>

        {message.reactions?.length > 0 && (
          <div className="department-message-reactions">
            {message.reactions.map((reaction) => (
              <button type="button" key={reaction.emoji}>
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}
      </div>

      {message.own && (
        <div className="department-message-avatar own">
          {message.senderInitials}
        </div>
      )}
    </article>
  );
}

function DepartmentDetails({ department, members }) {
  return (
    <div className="department-chat-details">
      <section>
        <h3>Department Info</h3>

        <div className="department-chat-info-card">
          <p>
            {department.description ||
              "Department information has not been updated."}
          </p>
        </div>
      </section>

      <section>
        <div className="department-details-heading">
          <h3>Members</h3>
          <span>{department.memberCount || members.length}</span>
        </div>

        <div className="department-chat-member-list">
          {members.map((member) => (
            <div className="department-chat-member" key={member.id}>
              <div className="department-member-avatar">
                {member.initials}

                <span className={member.online ? "online" : "offline"} />
              </div>

              <div>
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>
          <Pin size={14} />
          Pinned Messages
        </h3>

        <div className="department-pinned-list">
          <article className="department-pinned-card important">
            <small>Shared on May 12</small>
            <p>
              Brand Guideline v2.4 PDF available for download in the Files
              section.
            </p>
          </article>

          <article className="department-pinned-card">
            <small>Meeting Notes</small>
            <p>Q3 Content Calendar - Approved by Faculty Advisor.</p>
          </article>
        </div>
      </section>

      <button type="button" className="department-directory-button">
        <Users size={17} />
        View Full Directory
      </button>
    </div>
  );
}

function DepartmentFiles({ files }) {
  return (
    <div className="department-chat-files">
      <div className="department-details-heading">
        <h3>Shared Files</h3>
        <span>{files.length}</span>
      </div>

      {files.map((file) => (
        <article className="department-shared-file" key={file.id}>
          <div>
            <FileText size={20} />
          </div>

          <span>
            <strong>{file.name}</strong>
            <small>{file.size}</small>
          </span>
        </article>
      ))}
    </div>
  );
}

function renderMessageText(text) {
  if (!text) return "";

  const parts = text.split(/(@\w+)/g);

  return parts.map((part, index) =>
    part.startsWith("@") ? (
      <strong className="department-message-mention" key={`${part}-${index}`}>
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

function getInitials(value) {
  if (!value) return "?";

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
