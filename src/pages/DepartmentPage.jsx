import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CirclePlus,
  Edit3,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  createDepartment,
  getDepartmentChatAccess,
  getDepartments,
  updateDepartment,
} from "../api/departmentApi";

import { getClubMembers } from "../api/clubApi";

import "../styles.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  headMemberId: "",
};

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
  if (Array.isArray(data?.departments)) {
    return data.departments;
  }
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeDepartment(department) {
  return {
    ...department,

    id: department.id ?? department.departmentId,

    name: department.name ?? department.departmentName ?? "Phòng ban",

    description: department.description ?? "",

    headMemberId: department.headMemberId ?? department.head?.memberId ?? "",

    headMemberName:
      department.headMemberName ??
      department.headName ??
      department.head?.fullName ??
      "Chưa có trưởng ban",

    memberCount:
      department.memberCount ??
      department.membersCount ??
      department.totalMembers ??
      0,
  };
}

function normalizeMember(member) {
  return {
    ...member,

    memberId: member.memberId ?? member.membershipId ?? member.id,

    userId: member.userId ?? member.user?.id,

    fullName:
      member.fullName ??
      member.user?.fullName ??
      member.name ??
      "Không xác định",

    role: member.role ?? member.memberRole ?? "MEMBER",

    status: member.status ?? member.membershipStatus ?? "ACTIVE",
  };
}

export default function DepartmentPage() {
  const role = localStorage.getItem("selectedClubRole") || "MEMBER";

  const clubName = localStorage.getItem("selectedClubName") || "Câu lạc bộ";

  const canManageDepartments = useMemo(() => {
    return ["PRESIDENT", "CLUB_MANAGER"].includes(role.toUpperCase());
  }, [role]);

  const [departments, setDepartments] = useState([]);

  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingDepartment, setEditingDepartment] = useState(null);

  const [saving, setSaving] = useState(false);

  const [checkingChatId, setCheckingChatId] = useState(null);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getDepartments();

      setDepartments(normalizeArray(data).map(normalizeDepartment));
    } catch (error) {
      console.error("LOAD DEPARTMENTS ERROR:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Không thể tải danh sách phòng ban."));

      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);

      const data = await getClubMembers();

      const activeMembers = normalizeArray(data)
        .map(normalizeMember)
        .filter((member) => {
          const status = String(member.status).toUpperCase();

          return status === "ACTIVE" || status === "APPROVED";
        });

      setMembers(activeMembers);
    } catch (error) {
      console.error("LOAD MEMBERS ERROR:", error?.response?.data || error);

      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
    loadMembers();
  }, [loadDepartments, loadMembers]);

  const filteredDepartments = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return departments;

    return departments.filter((department) =>
      [department.name, department.description, department.headMemberName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [departments, searchText]);

  const openCreateModal = () => {
    setEditingDepartment(null);
    setShowModal(true);
  };

  const openEditModal = (department) => {
    setEditingDepartment(department);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingDepartment(null);
  };

  const handleSaveDepartment = async (form) => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên phòng ban.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        headMemberId: form.headMemberId ? Number(form.headMemberId) : null,
      };

      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, payload);

        toast.success("Cập nhật phòng ban thành công.");
      } else {
        await createDepartment(payload);

        toast.success("Tạo phòng ban thành công.");
      }

      setShowModal(false);
      setEditingDepartment(null);

      await loadDepartments();
    } catch (error) {
      console.error("SAVE DEPARTMENT ERROR:", error?.response?.data || error);

      toast.error(
        getErrorMessage(
          error,
          editingDepartment
            ? "Không thể cập nhật phòng ban."
            : "Không thể tạo phòng ban.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCheckChatAccess = async (department) => {
    try {
      setCheckingChatId(department.id);

      const result = await getDepartmentChatAccess(department.id);

      const allowed =
        result === true ||
        result?.allowed === true ||
        result?.hasAccess === true ||
        result?.chatAccess === true;

      if (allowed) {
        toast.success(`Bạn có quyền truy cập chat của ${department.name}.`);
      } else {
        toast.warning(
          result?.message ||
            `Bạn chưa có quyền truy cập chat của ${department.name}.`,
        );
      }
    } catch (error) {
      console.error("CHECK CHAT ACCESS ERROR:", error?.response?.data || error);

      toast.error(
        getErrorMessage(error, "Không thể kiểm tra quyền truy cập chat."),
      );
    } finally {
      setCheckingChatId(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page / Department" />

        <section className="department-page">
          <header className="department-header">
            <div>
              <div className="department-title">
                <Building2 size={30} />

                <div>
                  <h1>Department Management</h1>

                  <p>
                    Quản lý các phòng ban của <strong>{clubName}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="department-header-actions">
              <button
                type="button"
                className="department-refresh-button"
                onClick={loadDepartments}
                disabled={loading}
              >
                <RefreshCw size={17} className={loading ? "spin-icon" : ""} />
                Làm mới
              </button>

              {canManageDepartments && (
                <button
                  type="button"
                  className="department-create-button"
                  onClick={openCreateModal}
                >
                  <CirclePlus size={18} />
                  Tạo phòng ban
                </button>
              )}
            </div>
          </header>

          <div className="department-toolbar">
            <div className="department-search">
              <Search size={18} />

              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm theo tên, mô tả hoặc trưởng ban..."
              />
            </div>

            <span>{filteredDepartments.length} phòng ban</span>
          </div>

          {!canManageDepartments && (
            <div className="department-permission-note">
              <ShieldCheck size={18} />

              <span>
                Bạn có thể xem phòng ban. Chỉ Chủ nhiệm hoặc Quản lý CLB được
                phép tạo và chỉnh sửa.
              </span>
            </div>
          )}

          {loading ? (
            <div className="department-loading">
              <LoaderCircle size={34} className="spin-icon" />

              <p>Đang tải phòng ban...</p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="department-empty">
              <Building2 size={50} />

              <h2>Chưa có phòng ban</h2>

              <p>
                Hãy tạo phòng ban đầu tiên để tổ chức thành viên trong câu lạc
                bộ.
              </p>

              {canManageDepartments && (
                <button type="button" onClick={openCreateModal}>
                  <CirclePlus size={18} />
                  Tạo phòng ban đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="department-grid">
              {filteredDepartments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  canManage={canManageDepartments}
                  checkingChat={checkingChatId === department.id}
                  onEdit={openEditModal}
                  onCheckChat={handleCheckChatAccess}
                />
              ))}
            </div>
          )}
        </section>

        {showModal && (
          <DepartmentModal
            department={editingDepartment}
            members={members}
            loadingMembers={loadingMembers}
            saving={saving}
            onClose={closeModal}
            onSave={handleSaveDepartment}
          />
        )}
      </main>
    </div>
  );
}

function DepartmentCard({
  department,
  canManage,
  checkingChat,
  onEdit,
  onCheckChat,
}) {
  return (
    <article className="department-card">
      <div className="department-card-top">
        <div className="department-card-icon">
          <Users size={26} />
        </div>

        {canManage && (
          <button
            type="button"
            className="department-edit-button"
            onClick={() => onEdit(department)}
            title="Chỉnh sửa phòng ban"
          >
            <Edit3 size={17} />
          </button>
        )}
      </div>

      <h2>{department.name}</h2>

      <p>{department.description || "Phòng ban chưa có mô tả."}</p>

      <div className="department-info-row">
        <UserRound size={17} />

        <div>
          <span>Trưởng ban</span>

          <strong>{department.headMemberName}</strong>
        </div>
      </div>

      <div className="department-info-row">
        <Users size={17} />

        <div>
          <span>Thành viên</span>

          <strong>{department.memberCount} người</strong>
        </div>
      </div>

      <button
        type="button"
        className="department-chat-button"
        disabled={checkingChat}
        onClick={() => onCheckChat(department)}
      >
        {checkingChat ? (
          <>
            <LoaderCircle size={17} className="spin-icon" />
            Đang kiểm tra...
          </>
        ) : (
          <>
            <MessageCircle size={17} />
            Kiểm tra quyền Chat
          </>
        )}
      </button>
    </article>
  );
}

function DepartmentModal({
  department,
  members,
  loadingMembers,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,

    name: department?.name || "",

    description: department?.description || "",

    headMemberId: department?.headMemberId || "",
  });

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div
      className="department-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="department-modal">
        <header>
          <div className="department-modal-title">
            <Building2 size={25} />

            <div>
              <h2>{department ? "Chỉnh sửa phòng ban" : "Tạo phòng ban"}</h2>

              <p>Thiết lập tên, mô tả và trưởng ban.</p>
            </div>
          </div>

          <button type="button" onClick={onClose} disabled={saving}>
            <X size={21} />
          </button>
        </header>

        <div className="department-modal-body">
          <label htmlFor="department-name">
            Tên phòng ban <span>*</span>
          </label>

          <input
            id="department-name"
            type="text"
            value={form.name}
            placeholder="Ví dụ: Ban Truyền Thông"
            onChange={(event) => setField("name", event.target.value)}
          />

          <label htmlFor="department-description">Mô tả</label>

          <textarea
            id="department-description"
            rows="4"
            value={form.description}
            placeholder="Nhập mô tả phòng ban..."
            onChange={(event) => setField("description", event.target.value)}
          />

          <label htmlFor="department-head">Trưởng ban</label>

          <select
            id="department-head"
            value={form.headMemberId}
            disabled={loadingMembers}
            onChange={(event) => setField("headMemberId", event.target.value)}
          >
            <option value="">
              {loadingMembers
                ? "Đang tải thành viên..."
                : "Chưa chọn trưởng ban"}
            </option>

            {members.map((member) => (
              <option key={member.memberId} value={member.memberId}>
                {member.fullName} — {formatRole(member.role)}
              </option>
            ))}
          </select>
        </div>

        <footer>
          <button
            type="button"
            className="secondary"
            disabled={saving}
            onClick={onClose}
          >
            Hủy
          </button>

          <button
            type="button"
            className="primary"
            disabled={saving}
            onClick={() => onSave(form)}
          >
            {saving
              ? "Đang lưu..."
              : department
                ? "Lưu thay đổi"
                : "Tạo phòng ban"}
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

  return labels[String(role || "").toUpperCase()] || role || "Thành viên";
}
