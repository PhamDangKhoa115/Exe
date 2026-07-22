import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Edit3,
  Lock,
  RefreshCw,
  Search,
  Unlock,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  approveClubMember,
  getClubMembers,
  getPendingClubMembers,
  lockClubMember,
  updateClubMember,
} from "../api/clubApi";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const ROLE_OPTIONS = [
  {
    value: "MEMBER",
    label: "Thành viên",
  },
  {
    value: "DEPARTMENT_HEAD",
    label: "Trưởng ban",
  },
  {
    value: "TREASURER",
    label: "Thủ quỹ",
  },
];

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeMember(member) {
  return {
    ...member,

    memberId: member.memberId ?? member.membershipId ?? member.id,

    userId: member.userId ?? member.user?.id,

    username: member.username ?? member.user?.username ?? "",

    fullName: member.fullName ?? member.user?.fullName ?? member.name ?? "",

    email: member.email ?? member.user?.email ?? "",

    role: member.role ?? member.memberRole ?? "MEMBER",

    departmentId: member.departmentId ?? member.department?.id ?? "",

    departmentName: member.departmentName ?? member.department?.name ?? "None",

    status: member.status ?? member.membershipStatus ?? "ACTIVE",

    locked: Boolean(
      member.locked ??
      member.isLocked ??
      String(member.status).toUpperCase() === "LOCKED",
    ),
  };
}

export default function MemberManagementPage() {
  const selectedRole = localStorage.getItem("selectedClubRole") || "MEMBER";

  const canManageMembers = ["PRESIDENT", "CLUB_MANAGER"].includes(
    selectedRole.toUpperCase(),
  );

  const [activeTab, setActiveTab] = useState("MEMBERS");

  const [members, setMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [actionMemberId, setActionMemberId] = useState(null);

  const [searchText, setSearchText] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [editingMember, setEditingMember] = useState(null);
  const handleExportMembers = () => {
    if (members.length === 0) {
      toast.warning("Không có dữ liệu thành viên để xuất.");
      return;
    }

    const headers = [
      "No",
      "Username",
      "Full Name",
      "Role",
      "Email",
      "Department",
      "Status",
    ];

    const rows = members.map((member, index) => [
      index + 1,
      member.username || "",
      member.fullName || "",
      member.role || "",
      member.email || "",
      member.departmentName || "",
      member.status || "",
    ]);

    const escapeCsvValue = (value) => {
      const text = String(value ?? "");

      if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        return `"${text.replaceAll('"', '""')}"`;
      }

      return text;
    };

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `club-members-${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("Xuất danh sách thành viên thành công.");
  };

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);

      const [memberData, pendingData] = await Promise.all([
        getClubMembers(),
        canManageMembers ? getPendingClubMembers() : Promise.resolve([]),
      ]);

      setMembers(normalizeArray(memberData).map(normalizeMember));

      setPendingMembers(normalizeArray(pendingData).map(normalizeMember));
    } catch (error) {
      console.error("LOAD MEMBERS ERROR:", error?.response?.data || error);

      toast.error(
        getErrorMessage(error, "Không thể tải danh sách thành viên."),
      );
    } finally {
      setLoading(false);
    }
  }, [canManageMembers]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, pageSize, searchText]);

  const currentData = activeTab === "MEMBERS" ? members : pendingMembers;

  const filteredMembers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return currentData;

    return currentData.filter((member) =>
      [
        member.username,
        member.fullName,
        member.email,
        member.role,
        member.departmentName,
        member.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [currentData, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));

  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * pageSize;

    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, page, pageSize]);

  const handleApprove = async (member, approve) => {
    try {
      setActionMemberId(member.memberId);

      await approveClubMember(member.memberId, approve);

      toast.success(
        approve
          ? `Đã chấp nhận ${member.fullName}.`
          : `Đã từ chối yêu cầu của ${member.fullName}.`,
      );

      await loadMembers();
    } catch (error) {
      console.error("APPROVE MEMBER ERROR:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Không thể xử lý yêu cầu tham gia."));
    } finally {
      setActionMemberId(null);
    }
  };

  const handleLock = async (member) => {
    const nextLock = !member.locked;

    const confirmed = window.confirm(
      nextLock
        ? `Khóa thành viên "${member.fullName}"?`
        : `Mở khóa thành viên "${member.fullName}"?`,
    );

    if (!confirmed) return;

    try {
      setActionMemberId(member.memberId);

      await lockClubMember(member.memberId, nextLock);

      toast.success(
        nextLock ? "Đã khóa thành viên." : "Đã mở khóa thành viên.",
      );

      await loadMembers();
    } catch (error) {
      console.error("LOCK MEMBER ERROR:", error?.response?.data || error);

      toast.error(
        getErrorMessage(error, "Không thể cập nhật trạng thái thành viên."),
      );
    } finally {
      setActionMemberId(null);
    }
  };

  const handleSaveMember = async (form) => {
    if (!editingMember) return;

    try {
      setActionMemberId(editingMember.memberId);

      await updateClubMember(editingMember.memberId, {
        role: form.role,
        departmentId: form.departmentId || null,
      });

      toast.success("Cập nhật thành viên thành công.");

      setEditingMember(null);
      await loadMembers();
    } catch (error) {
      console.error("UPDATE MEMBER ERROR:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Không thể cập nhật thành viên."));
    } finally {
      setActionMemberId(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Trang chủ / Members" />

        <section className="member-page">
          <div className="member-page-tabs">
            <button
              type="button"
              className={activeTab === "MEMBERS" ? "active" : ""}
              onClick={() => setActiveTab("MEMBERS")}
            >
              <Users size={18} />
              Thành viên
              <span>{members.length}</span>
            </button>

            {canManageMembers && (
              <button
                type="button"
                className={activeTab === "APPLICATIONS" ? "active" : ""}
                onClick={() => setActiveTab("APPLICATIONS")}
              >
                <UserRoundPlus size={18} />
                Application
                {pendingMembers.length > 0 && (
                  <span>{pendingMembers.length}</span>
                )}
              </button>
            )}
            <button
              type="button"
              className="member-export-button"
              onClick={handleExportMembers}
            >
              Export
            </button>
          </div>

          <div className="member-panel">
            <div className="member-panel-header">
              <div>
                <h1>
                  {activeTab === "MEMBERS"
                    ? "Member Management"
                    : "Application Management"}
                </h1>

                <p>
                  {activeTab === "MEMBERS"
                    ? "Theo dõi và quản lý thành viên trong câu lạc bộ."
                    : "Phê duyệt các yêu cầu tham gia câu lạc bộ."}
                </p>
              </div>

              <button
                type="button"
                className="member-refresh-button"
                onClick={loadMembers}
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? "spin-icon" : ""} />
              </button>
            </div>

            <div className="member-toolbar">
              <div className="member-search">
                <Search size={17} />

                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Tìm tên, email, vai trò, bộ phận..."
                />
              </div>
            </div>

            {loading ? (
              <div className="member-loading">
                <RefreshCw size={30} className="spin-icon" />

                <p>Đang tải thành viên...</p>
              </div>
            ) : paginatedMembers.length === 0 ? (
              <div className="member-empty">
                <CircleAlert size={42} />

                <h2>
                  {activeTab === "MEMBERS"
                    ? "Chưa có thành viên"
                    : "Không có yêu cầu chờ duyệt"}
                </h2>
              </div>
            ) : (
              <div className="member-table-wrapper">
                <table className="member-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Username</th>
                      <th>Full Name</th>

                      {activeTab === "MEMBERS" && (
                        <>
                          <th>Role</th>
                          <th>Email</th>
                          <th>Department</th>
                        </>
                      )}

                      <th>Status</th>
                      <th>Operation</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedMembers.map((member, index) => (
                      <tr key={member.memberId ?? member.userId}>
                        <td>{(page - 1) * pageSize + index + 1}</td>

                        <td>{member.username || `user_${member.userId}`}</td>

                        <td>
                          <strong>{member.fullName || "Không xác định"}</strong>
                        </td>

                        {activeTab === "MEMBERS" && (
                          <>
                            <td>{formatRole(member.role)}</td>

                            <td>{member.email || "Không có"}</td>

                            <td>{member.departmentName || "None"}</td>
                          </>
                        )}

                        <td>
                          <MemberStatusBadge
                            member={member}
                            pending={activeTab === "APPLICATIONS"}
                          />
                        </td>

                        <td>
                          <div className="member-actions">
                            {activeTab === "APPLICATIONS" ? (
                              <>
                                <button
                                  type="button"
                                  className="approve"
                                  title="Chấp nhận"
                                  disabled={actionMemberId === member.memberId}
                                  onClick={() => handleApprove(member, true)}
                                >
                                  <Check size={16} />
                                </button>

                                <button
                                  type="button"
                                  className="reject"
                                  title="Từ chối"
                                  disabled={actionMemberId === member.memberId}
                                  onClick={() => handleApprove(member, false)}
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              canManageMembers && (
                                <>
                                  <button
                                    type="button"
                                    title="Chỉnh sửa"
                                    onClick={() => setEditingMember(member)}
                                  >
                                    <Edit3 size={16} />
                                  </button>

                                  <button
                                    type="button"
                                    className={
                                      member.locked ? "unlock" : "lock"
                                    }
                                    title={member.locked ? "Mở khóa" : "Khóa"}
                                    disabled={
                                      actionMemberId === member.memberId
                                    }
                                    onClick={() => handleLock(member)}
                                  >
                                    {member.locked ? (
                                      <Unlock size={16} />
                                    ) : (
                                      <Lock size={16} />
                                    )}
                                  </button>
                                </>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="member-pagination">
              <div>
                <span>
                  {filteredMembers.length === 0 ? 0 : (page - 1) * pageSize + 1}
                  {" - "}
                  {Math.min(page * pageSize, filteredMembers.length)}
                  {" / "}
                  {filteredMembers.length}
                </span>

                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pagination-buttons">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={17} />
                </button>

                <span>
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {editingMember && (
          <EditMemberModal
            member={editingMember}
            saving={actionMemberId === editingMember.memberId}
            onClose={() => setEditingMember(null)}
            onSave={handleSaveMember}
          />
        )}
      </main>
    </div>
  );
}

function MemberStatusBadge({ member, pending }) {
  if (pending) {
    return <span className="member-status pending">Pending</span>;
  }

  if (member.locked) {
    return <span className="member-status locked">Locked</span>;
  }

  const active =
    String(member.status).toUpperCase() === "ACTIVE" ||
    String(member.status).toUpperCase() === "APPROVED";

  return (
    <span className={`member-status ${active ? "active" : "inactive"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function EditMemberModal({ member, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    role: member.role || "MEMBER",
    departmentId: member.departmentId || "",
  });

  return (
    <div
      className="member-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="member-modal">
        <header>
          <div>
            <h2>Chỉnh sửa thành viên</h2>
            <p>{member.fullName}</p>
          </div>

          <button type="button" onClick={onClose} disabled={saving}>
            <X size={20} />
          </button>
        </header>

        <div className="member-modal-body">
          <label>Vai trò</label>

          <select
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value,
              }))
            }
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          <label>Department ID</label>

          <input
            type="number"
            min="1"
            value={form.departmentId}
            placeholder="Có thể để trống"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                departmentId: event.target.value,
              }))
            }
          />

          <small>
            Có thể để trống nếu thành viên chưa thuộc phòng ban nào.
          </small>
        </div>

        <footer>
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>

          <button
            type="button"
            className="primary"
            disabled={saving}
            onClick={() => onSave(form)}
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function formatRole(role) {
  const labels = {
    PRESIDENT: "Chủ nhiệm",
    CLUB_MANAGER: "Quản lý CLB",
    DEPARTMENT_HEAD: "Trưởng ban",
    TREASURER: "Thủ quỹ",
    MEMBER: "Thành viên",
  };

  return labels[String(role).toUpperCase()] || role || "Thành viên";
}
