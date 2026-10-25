import RubberSegment from "../components/reactbits/RubberSegment";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getClubMembers } from "../api/clubApi";
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
  Trash2,
  Users,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  deleteMessage,
  getDepartmentMessages,
  getChatEmojis,
  pinMessage,
  sendDepartmentMessage,
} from "../api/chatApi";

import "../styles.css";
import "../components/DepartmentChatEmoji.css";

/* =========================================================
   TEMPORARY MOCK DATA

   Chat messages are NO LONGER mocked.
   Members are still mocked because the supplied Chat API
   does not contain a department-member endpoint.
========================================================= */

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

/* =========================================================
   PAGE
========================================================= */

export default function DepartmentChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { departmentId } = useParams();

  const currentUserId = Number(localStorage.getItem("userId"));
  const [departmentMembers, setDepartmentMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const currentUserName = localStorage.getItem("fullName") || "You";

  const clubId = Number(localStorage.getItem("selectedClubId"));

  const department = location.state?.department || {
    id: departmentId,
    name: "Department",
    description: "Department information has not been updated.",
    memberCount: 0,
    headMemberName: "",
  };

  /* =======================================================
     STATE
  ======================================================= */

  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] = useState("");

  const [searchText, setSearchText] = useState("");

  const [detailTab, setDetailTab] = useState("DETAILS");

  const [loadingMessages, setLoadingMessages] = useState(true);

  const [sendingMessage, setSendingMessage] = useState(false);

  const [chatError, setChatError] = useState("");

  const [actionMessageId, setActionMessageId] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const composerRef = useRef(null);
  const pendingCaret = useRef(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiCategories, setEmojiCategories] = useState(null);
  const [emojiLoading, setEmojiLoading] = useState(false);
  const [emojiError, setEmojiError] = useState("");
  useEffect(() => {
    if (!emojiOpen) return;
    const outside = event => {
      if (!composerRef.current?.contains(event.target)) setEmojiOpen(false);
    };
    const escape = event => { if (event.key === "Escape") setEmojiOpen(false); };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside, true); document.removeEventListener("keydown", escape); };
  }, [emojiOpen]);
  useEffect(() => {
    if (!emojiOpen || emojiCategories !== null) return;
    let active = true;
    setEmojiLoading(true); setEmojiError("");
    getChatEmojis().then(data => {
      if (!active) return;
      if (!Array.isArray(data) || data.some(group => typeof group?.category !== "string" || !Array.isArray(group.emojis) || group.emojis.some(emoji => typeof emoji !== "string"))) throw new Error("Invalid emoji response.");
      setEmojiCategories(data);
    }).catch(error => { if (active) setEmojiError(getErrorMessage(error, "Cannot load emojis.")); })
      .finally(() => { if (active) setEmojiLoading(false); });
    return () => { active = false; };
  }, [emojiOpen, emojiCategories]);
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !messageInputRef.current) return;
    const caret = pendingCaret.current; pendingCaret.current = null;
    messageInputRef.current.focus({ preventScroll: true });
    messageInputRef.current.setSelectionRange(caret, caret);
  }, [messageText]);
  const insertEmoji = emoji => {
    if (sendingMessage) return;
    const input = messageInputRef.current;
    const start = input?.selectionStart ?? messageText.length;
    const end = input?.selectionEnd ?? start;
    pendingCaret.current = start + emoji.length;
    setMessageText(current => current.slice(0, start) + emoji + current.slice(end));
  };


  /* =======================================================
     LOAD MESSAGES
  ======================================================= */

  const loadMessages = useCallback(async () => {
    if (!clubId || !departmentId || !currentUserId) {
      setChatError(
        "Missing club, department or user information. Please login and select a club again.",
      );

      setLoadingMessages(false);
      return;
    }

    try {
      setLoadingMessages(true);
      setChatError("");

      const response = await getDepartmentMessages({
        clubId,
        departmentId: Number(departmentId),
        requesterUserId: currentUserId,
        limit: 50,
      });

      console.log("CHAT MESSAGES RESPONSE:", response);

      const rawMessages = extractMessages(response);
      const normalizedMessages = rawMessages.map((message) =>
        normalizeMessage(message, currentUserId),
      );

      const sortedMessages = sortMessagesOldestFirst(normalizedMessages);

      setMessages(sortedMessages);
    } catch (error) {
      console.error("LOAD CHAT ERROR:", error.response?.data || error);

      setChatError(getErrorMessage(error, "Unable to load messages."));
    } finally {
      setLoadingMessages(false);
    }
  }, [clubId, departmentId, currentUserId]);
  useEffect(() => {
    let active = true;

    const loadDepartmentMembers = async () => {
      try {
        setLoadingMembers(true);

        const response = await getClubMembers();

        const allMembers = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.content)
              ? response.content
              : [];

        const currentDepartmentId = Number(departmentId);

        const members = allMembers
          .filter((member) => {
            const memberDepartmentId = Number(
              member.departmentId ??
                member.department?.departmentId ??
                member.department?.id,
            );

            return memberDepartmentId === currentDepartmentId;
          })
          .map((member) => {
            const name =
              member.fullName ??
              member.userFullName ??
              member.name ??
              member.user?.fullName ??
              "Member";

            return {
              id: member.memberId ?? member.userId ?? member.id,

              name,

              initials: getInitials(name),

              role: formatMemberRole(
                member.role ?? member.clubRole ?? member.memberRole,
              ),

              // BE hiện chưa cung cấp online presence.
              online: false,
            };
          });

        if (active) {
          setDepartmentMembers(members);
        }
      } catch (error) {
        console.error(
          "LOAD DEPARTMENT MEMBERS ERROR:",
          error?.response?.data || error,
        );

        if (active) {
          setDepartmentMembers([]);
        }
      } finally {
        if (active) {
          setLoadingMembers(false);
        }
      }
    };

    loadDepartmentMembers();

    return () => {
      active = false;
    };
  }, [departmentId]);
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);
  const refreshMessagesSilently = useCallback(async () => {
    if (!clubId || !departmentId || !currentUserId) {
      return;
    }

    try {
      const response = await getDepartmentMessages({
        clubId,
        departmentId: Number(departmentId),
        requesterUserId: currentUserId,
        limit: 50,
      });

      const rawMessages = extractMessages(response);

      const normalizedMessages = rawMessages.map((message) =>
        normalizeMessage(message, currentUserId),
      );

      const sortedMessages = sortMessagesOldestFirst(normalizedMessages);

      setMessages(sortedMessages);
    } catch (error) {
      console.error("REFRESH CHAT ERROR:", error.response?.data || error);
    }
  }, [clubId, departmentId, currentUserId]);

  useEffect(() => {
    if (!clubId || !departmentId || !currentUserId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      refreshMessagesSilently();
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [clubId, departmentId, currentUserId, refreshMessagesSilently]);
  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  useEffect(() => {
    if (loadingMessages) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "auto",
      block: "end",
    });
  }, [loadingMessages]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredMessages = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return messages;
    }

    return messages.filter((message) => {
      return [
        message.senderName,
        message.text,
        ...(message.attachments || []).map((attachment) => attachment.fileName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [messages, searchText]);

  /* =======================================================
     PINNED MESSAGES
  ======================================================= */

  const pinnedMessages = useMemo(
    () => messages.filter((message) => message.isPinned),
    [messages],
  );

  /* =======================================================
     SHARED FILES
  ======================================================= */

  const sharedFiles = useMemo(() => {
    return messages.flatMap((message) =>
      (message.attachments || []).map((attachment) => ({
        ...attachment,
        messageId: message.id,
        senderName: message.senderName,
      })),
    );
  }, [messages]);

  /* =======================================================
     SEND TEXT MESSAGE
  ======================================================= */

  const handleSendMessage = async () => {
    setEmojiOpen(false);
    const content = messageText.trim();

    if (!content || sendingMessage) {
      return;
    }

    if (!clubId || !departmentId || !currentUserId) {
      setChatError("Missing club, department or user information.");

      return;
    }

    try {
      setSendingMessage(true);
      setChatError("");

      const response = await sendDepartmentMessage({
        clubId,
        departmentId: Number(departmentId),
        requesterUserId: currentUserId,

        content,

        messageType: "TEXT",

        attachments: [],

        isPinned: false,
      });

      console.log("SEND MESSAGE RESPONSE:", response);

      setMessageText("");

      const rawMessage = extractSingleMessage(response);

      /*
       * If backend returns the created message,
       * append it immediately.
       *
       * Otherwise reload messages.
       */

      if (rawMessage && hasMessageIdentity(rawMessage)) {
        const normalized = normalizeMessage(rawMessage, currentUserId);

        setMessages((current) => {
          const alreadyExists = current.some(
            (message) => String(message.id) === String(normalized.id),
          );

          if (alreadyExists) {
            return current;
          }

          return sortMessagesOldestFirst([...current, normalized]);
        });
      } else {
        await loadMessages();
      }
    } catch (error) {
      console.error("SEND CHAT ERROR:", error.response?.data || error);

      setChatError(getErrorMessage(error, "Unable to send message."));
    } finally {
      setSendingMessage(false);
    }
  };

  /* =======================================================
     ENTER TO SEND
  ======================================================= */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSendMessage();
    }
  };

  /* =======================================================
     PIN MESSAGE
  ======================================================= */

  const handlePinMessage = async (message) => {
    if (!message?.id || !currentUserId) {
      return;
    }

    try {
      setActionMessageId(message.id);
      setChatError("");

      await pinMessage(message.id, currentUserId);

      /*
       * Endpoint is PUT /pin.
       *
       * Because Swagger does not specify
       * whether this toggles pin/unpin or
       * only pins, reload server state
       * instead of guessing.
       */

      await loadMessages();
    } catch (error) {
      console.error("PIN MESSAGE ERROR:", error.response?.data || error);

      setChatError(getErrorMessage(error, "Unable to update pinned message."));
    } finally {
      setActionMessageId(null);
    }
  };

  /* =======================================================
     DELETE MESSAGE
  ======================================================= */

  const handleDeleteMessage = async (message) => {
    if (!message?.id || !currentUserId) {
      return;
    }

    const confirmed = window.confirm("Delete this message?");

    if (!confirmed) return;

    try {
      setActionMessageId(message.id);
      setChatError("");

      await deleteMessage(message.id, currentUserId);

      setMessages((current) =>
        current.filter((item) => String(item.id) !== String(message.id)),
      );
    } catch (error) {
      console.error("DELETE MESSAGE ERROR:", error.response?.data || error);

      setChatError(getErrorMessage(error, "Unable to delete message."));
    } finally {
      setActionMessageId(null);
    }
  };

  /* =======================================================
     FILE SELECTION

     Upload is intentionally not sent yet because Swagger
     only says:

     POST /api/chat/upload
     application/json
     { file: "string" }

     It does not specify whether "file" must be base64,
     data URL, URL, or another encoded value.
  ======================================================= */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    console.log("SELECTED CHAT FILE:", file);

    setChatError(
      "File selected, but upload is not enabled yet because the backend upload format for the `file` string has not been specified.",
    );

    event.target.value = "";
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="app-layout department-chat-layout">
      <Sidebar />

      <main className="main-content department-chat-main-content">
        <Topbar title={`Home Page / Departments / ${department.name}`} />

        <section className="department-chat-page">
          {/* ============================
              MAIN CHAT
          ============================ */}

          <div className="department-chat-main">
            {/* HEADER */}

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

            {/* ERROR */}

            {chatError && (
              <div
                style={{
                  padding: "10px 16px",
                  margin: "10px 16px 0",
                  borderRadius: "8px",
                  background: "#fff1f2",
                  color: "#be123c",
                  fontSize: "14px",
                }}
              >
                {chatError}
              </div>
            )}

            {/* MESSAGES */}

            <div className="department-chat-messages">
              {loadingMessages ? (
                <div className="department-chat-empty">
                  <p>Loading messages...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="department-chat-empty">
                  <Search size={36} />

                  <h2>
                    {searchText ? "No messages found" : "No messages yet"}
                  </h2>

                  <p>
                    {searchText
                      ? "Try another search keyword."
                      : "Start the conversation by sending a message."}
                  </p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    actionLoading={
                      String(actionMessageId) === String(message.id)
                    }
                    onPin={handlePinMessage}
                    onDelete={handleDeleteMessage}
                  />
                ))
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* COMPOSER */}

            <div className="department-chat-composer-wrap" ref={composerRef}>
              {emojiOpen && <section className="department-chat-emoji-picker" role="dialog" aria-label="Emoji Picker">
                {emojiLoading && <p role="status">Loading emojis...</p>}
                {emojiError && <p role="alert">{emojiError} Close and reopen the picker to retry.</p>}
                {emojiCategories?.map((group, index) => <section key={`${group.category}-${index}`}><h3>{group.category}</h3><div className="department-chat-emoji-grid">{group.emojis.map((emoji, emojiIndex) => <button type="button" key={`${emoji}-${emojiIndex}`} aria-label={emoji} disabled={sendingMessage} onMouseDown={e => e.preventDefault()} onClick={() => insertEmoji(emoji)}>{emoji}</button>)}</div></section>)}
                {emojiCategories?.length === 0 && <p>No emojis are available.</p>}
              </section>}

              <div className="department-chat-composer">
                <textarea
                  ref={messageInputRef}
                  rows="2"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                />

                <div className="department-chat-composer-footer">
                  <div className="department-chat-tools">
                    <button type="button" title="Emoji" aria-label="Emoji" aria-expanded={emojiOpen} disabled={sendingMessage} onClick={() => setEmojiOpen(current => !current)}>
                      <Smile size={18} />
                    </button>

                    <button
                      type="button"
                      title="Attach file"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip size={18} />
                    </button>

                    <button
                      type="button"
                      title="Image"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image size={18} />
                    </button>

                    <button
                      type="button"
                      title="Mention member"
                      onClick={() => setMessageText((current) => `${current}@`)}
                    >
                      <AtSign size={18} />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      onChange={handleFileChange}
                    />
                  </div>

                  <button
                    type="button"
                    className="department-chat-send"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                  >
                    {sendingMessage ? "Sending..." : "Send"}

                    <Send size={17} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================
              RIGHT SIDEBAR
          ============================ */}

          <aside className="department-chat-sidebar">
            <RubberSegment as="div" className="department-chat-sidebar-tabs">
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
            </RubberSegment>

            {detailTab === "DETAILS" ? (
              <DepartmentDetails
                department={department}
                members={departmentMembers}
                pinnedMessages={pinnedMessages}
                loadingMembers={loadingMembers}
              />
            ) : (
              <DepartmentFiles files={sharedFiles} />
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   MESSAGE COMPONENT
========================================================= */

function ChatMessage({ message, actionLoading, onPin, onDelete }) {
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
          {message.text && <p>{renderMessageText(message.text)}</p>}

          {message.attachments?.map((attachment) => (
            <Attachment
              key={
                attachment.id || `${attachment.fileUrl}-${attachment.fileName}`
              }
              attachment={attachment}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "6px",
            marginTop: "5px",
            justifyContent: message.own ? "flex-end" : "flex-start",
          }}
        >
          <button
            type="button"
            title={message.isPinned ? "Pinned message" : "Pin message"}
            disabled={actionLoading}
            onClick={() => onPin(message)}
            style={{
              border: "none",
              background: "transparent",
              cursor: actionLoading ? "wait" : "pointer",
              opacity: actionLoading ? 0.5 : 1,
            }}
          >
            <Pin size={15} fill={message.isPinned ? "currentColor" : "none"} />
          </button>

          {message.own && (
            <button
              type="button"
              title="Delete message"
              disabled={actionLoading}
              onClick={() => onDelete(message)}
              style={{
                border: "none",
                background: "transparent",
                cursor: actionLoading ? "wait" : "pointer",
                opacity: actionLoading ? 0.5 : 1,
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {message.own && (
        <div className="department-message-avatar own">
          {message.senderInitials}
        </div>
      )}
    </article>
  );
}

/* =========================================================
   ATTACHMENT
========================================================= */

function Attachment({ attachment }) {
  const isImage = attachment.fileType?.startsWith("image/");

  if (isImage) {
    return (
      <a href={attachment.fileUrl} target="_blank" rel="noreferrer">
        <img
          src={attachment.fileUrl}
          alt={attachment.fileName || "Shared image"}
          style={{
            maxWidth: "320px",
            width: "100%",
            borderRadius: "10px",
            marginTop: "8px",
          }}
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.fileUrl}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "8px",
        textDecoration: "none",
      }}
    >
      <FileText size={18} />

      <span>
        {attachment.fileName || "Attachment"}

        {attachment.fileSize ? (
          <small
            style={{
              display: "block",
            }}
          >
            {formatFileSize(attachment.fileSize)}
          </small>
        ) : null}
      </span>
    </a>
  );
}

/* =========================================================
   DETAILS
========================================================= */

function DepartmentDetails({ department, members, pinnedMessages }) {
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

          <span>{members.length}</span>
        </div>

        <div className="department-chat-member-list">
          {members.map((member) => (
            <div className="department-chat-member" key={member.id}>
              <div className="department-member-avatar">{member.initials}</div>

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
          {pinnedMessages.length === 0 ? (
            <p>No pinned messages.</p>
          ) : (
            pinnedMessages.map((message) => (
              <article className="department-pinned-card" key={message.id}>
                <small>
                  {message.senderName} • {message.time}
                </small>

                <p>
                  {message.text ||
                    message.attachments?.[0]?.fileName ||
                    "Attachment"}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <button type="button" className="department-directory-button">
        <Users size={17} />
        View Full Directory
      </button>
    </div>
  );
}

/* =========================================================
   FILES
========================================================= */

function DepartmentFiles({ files }) {
  return (
    <div className="department-chat-files">
      <div className="department-details-heading">
        <h3>Shared Files</h3>

        <span>{files.length}</span>
      </div>

      {files.length === 0 ? (
        <p>No shared files yet.</p>
      ) : (
        files.map((file, index) => (
          <a
            className="department-shared-file"
            key={file.id || `${file.messageId}-${index}`}
            href={file.fileUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
            }}
          >
            <div>
              <FileText size={20} />
            </div>

            <span>
              <strong>{file.fileName || "Attachment"}</strong>

              <small>{formatFileSize(file.fileSize)}</small>
            </span>
          </a>
        ))
      )}
    </div>
  );
}

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function extractMessages(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.messages)) {
    return response.messages;
  }

  if (Array.isArray(response?.content)) {
    return response.content;
  }

  if (Array.isArray(response?.data?.messages)) {
    return response.data.messages;
  }

  if (Array.isArray(response?.data?.content)) {
    return response.data.content;
  }

  return [];
}

function extractSingleMessage(response) {
  if (!response || typeof response !== "object") {
    return null;
  }

  if (response.messageId != null || response.id != null) {
    return response;
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    return response.data;
  }

  if (response.message && typeof response.message === "object") {
    return response.message;
  }

  return null;
}

function hasMessageIdentity(message) {
  return message?.messageId != null || message?.id != null;
}

/* =========================================================
   NORMALIZE BACKEND MESSAGE
========================================================= */

function normalizeMessage(rawMessage, currentUserId) {
  const sender =
    rawMessage.sender || rawMessage.user || rawMessage.createdBy || {};

  const senderId = Number(
    rawMessage.senderId ??
      rawMessage.userId ??
      rawMessage.senderUserId ??
      sender.userId ??
      sender.id,
  );

  const senderName =
    rawMessage.senderName ||
    rawMessage.fullName ||
    rawMessage.senderFullName ||
    sender.fullName ||
    sender.name ||
    sender.username ||
    "Unknown User";

  const createdAt =
    rawMessage.createdAt ||
    rawMessage.sentAt ||
    rawMessage.createdDate ||
    rawMessage.timestamp;

  return {
    ...rawMessage,

    id: rawMessage.messageId ?? rawMessage.id,

    senderId,

    senderName,

    senderInitials: getInitials(senderName),

    own: senderId === Number(currentUserId),

    text: rawMessage.content ?? rawMessage.text ?? "",

    messageType: rawMessage.messageType || "TEXT",

    attachments: Array.isArray(rawMessage.attachments)
      ? rawMessage.attachments
      : [],

    isPinned: Boolean(rawMessage.isPinned),
    createdAt,

    time: createdAt ? formatMessageTime(createdAt) : "",
  };
}

/* =========================================================
   TEXT
========================================================= */

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

/* =========================================================
   UTILITIES
========================================================= */

function getInitials(value) {
  if (!value) return "?";

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function parseBackendDate(value) {
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

function formatMessageTime(value) {
  const date = parseBackendDate(value);

  if (!date) return "";

  return date.toLocaleTimeString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
function getMessageTimestamp(message) {
  const value =
    message.createdAt ||
    message.sentAt ||
    message.createdDate ||
    message.timestamp;

  const date = parseBackendDate(value);

  return date ? date.getTime() : 0;
}

function sortMessagesOldestFirst(messages) {
  return [...messages].sort((a, b) => {
    const timeA = getMessageTimestamp(a);
    const timeB = getMessageTimestamp(b);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return Number(a.messageId ?? a.id ?? 0) - Number(b.messageId ?? b.id ?? 0);
  });
}
function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  return data?.message || data?.error || error?.message || fallback;
}
function formatMemberRole(role) {
  const labels = {
    PRESIDENT: "Club Manager",
    CLUB_MANAGER: "Club Manager",
    DEPARTMENT_HEAD: "Department Head",
    TREASURER: "Treasurer",
    MEMBER: "Member",
  };

  return labels[String(role || "").toUpperCase()] || "Member";
}
