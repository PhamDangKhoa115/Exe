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

    name: department.name ?? department.departmentName ?? "Department",

    description: department.description ?? "",

    headMemberId: department.headMemberId ?? department.head?.memberId ?? "",

    headMemberName:
      department.headMemberName ??
      department.headName ??
      department.head?.fullName ??
      "No department head assigned",

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
      member.fullName ?? member.user?.fullName ?? member.name ?? "Unknown",

    role: member.role ?? member.memberRole ?? "MEMBER",

    status: member.status ?? member.membershipStatus ?? "ACTIVE",
  };
}

export default function DepartmentPage() {
  const role = localStorage.getItem("selectedClubRole") || "MEMBER";

  const clubName = localStorage.getItem("selectedClubName") || "Club";

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

      toast.error(getErrorMessage(error, "Cannot load department list."));

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
      toast.error("Please enter a department name.");
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

        toast.success("Department updated successfully.");
      } else {
        await createDepartment(payload);

        toast.success("Department created successfully.");
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
            ? "Cannot update department."
            : "Cannot create department.",
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
        toast.success(`You have access to the chat of ${department.name}.`);
      } else {
        toast.warning(
          result?.message ||
            `You do not have access to the chat of ${department.name}.`,
        );
      }
    } catch (error) {
      console.error("CHECK CHAT ACCESS ERROR:", error?.response?.data || error);

      toast.error(getErrorMessage(error, "Cannot check chat access."));
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
                    Manage departments of <strong>{clubName}</strong>
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
                Refresh
              </button>

              {canManageDepartments && (
                <button
                  type="button"
                  className="department-create-button"
                  onClick={openCreateModal}
                >
                  <CirclePlus size={18} />
                  Create Department
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
                placeholder="Search by name, description or department head..."
              />
            </div>

            <span>{filteredDepartments.length} departments</span>
          </div>

          {!canManageDepartments && (
            <div className="department-permission-note">
              <ShieldCheck size={18} />

              <span>
                You can view departments. Only department heads or club managers
                are allowed to create and edit departments.
              </span>
            </div>
          )}

          {loading ? (
            <div className="department-loading">
              <LoaderCircle size={34} className="spin-icon" />

              <p>Loading departments...</p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="department-empty">
              <Building2 size={50} />

              <h2>No departments found</h2>

              <p>
                Create the first department to organize members in the club.
              </p>

              {canManageDepartments && (
                <button type="button" onClick={openCreateModal}>
                  <CirclePlus size={18} />
                  Create First Department
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
            title="Edit Department"
          >
            <Edit3 size={17} />
          </button>
        )}
      </div>

      <h2>{department.name}</h2>

      <p>{department.description || "Department has no description."}</p>

      <div className="department-info-row">
        <UserRound size={17} />

        <div>
          <span>Department Head</span>

          <strong>{department.headMemberName}</strong>
        </div>
      </div>

      <div className="department-info-row">
        <Users size={17} />

        <div>
          <span>Members</span>

          <strong>{department.memberCount} people</strong>
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
            Checking...
          </>
        ) : (
          <>
            <MessageCircle size={17} />
            Check Chat Access
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
              <h2>{department ? "Edit Department" : "Create Department"}</h2>

              <p>Set the name, description, and department head.</p>
            </div>
          </div>

          <button type="button" onClick={onClose} disabled={saving}>
            <X size={21} />
          </button>
        </header>

        <div className="department-modal-body">
          <label htmlFor="department-name">
            Department Name <span>*</span>
          </label>

          <input
            id="department-name"
            type="text"
            value={form.name}
            placeholder="Example: Communications Department"
            onChange={(event) => setField("name", event.target.value)}
          />

          <label htmlFor="department-description">Description</label>

          <textarea
            id="department-description"
            rows="4"
            value={form.description}
            placeholder="Enter department description..."
            onChange={(event) => setField("description", event.target.value)}
          />

          <label htmlFor="department-head">Department Head</label>

          <select
            id="department-head"
            value={form.headMemberId}
            disabled={loadingMembers}
            onChange={(event) => setField("headMemberId", event.target.value)}
          >
            <option value="">
              {loadingMembers
                ? "Loading members..."
                : "No department head selected"}
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
            Cancel
          </button>

          <button
            type="button"
            className="primary"
            disabled={saving}
            onClick={() => onSave(form)}
          >
            {saving
              ? "Saving..."
              : department
                ? "Save Changes"
                : "Create Department"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function formatRole(role) {
  const labels = {
    PRESIDENT: "President",
    CLUB_MANAGER: "Club Manager",
    DEPARTMENT_HEAD: "Department Head",
    TREASURER: "Treasurer",
    MEMBER: "Member",
  };

  return labels[String(role || "").toUpperCase()] || role || "Member";
}
