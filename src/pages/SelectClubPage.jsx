import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Globe2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

import Topbar from "../components/Topbar";

import { getAllClubs, getUserClubs, joinClub } from "../api/clubApi";

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
  if (Array.isArray(data?.clubs)) return data.clubs;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

export default function SelectClubPage() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  const [activeTab, setActiveTab] = useState("MY_CLUBS");

  const [myClubs, setMyClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [joiningClubId, setJoiningClubId] = useState(null);

  const [searchText, setSearchText] = useState("");

  const loadData = useCallback(async () => {
    if (!userId) {
      toast.error("Không tìm thấy userId.");
      return;
    }

    try {
      setLoading(true);

      const [myClubData, allClubData] = await Promise.all([
        getUserClubs(Number(userId)),
        getAllClubs(),
      ]);

      const normalizedMyClubs = normalizeArray(myClubData);

      const activeClubs = normalizedMyClubs.filter((club) => {
        const status = String(
          club.status ?? club.membershipStatus ?? club.memberStatus ?? "",
        ).toUpperCase();

        return status === "ACTIVE" || status === "APPROVED";
      });

      setMyClubs(activeClubs);
      setAllClubs(normalizeArray(allClubData));
    } catch (error) {
      console.error("LOAD CLUBS ERROR:", error?.response?.data || error);

      toast.error(
        getErrorMessage(error, "Không thể tải danh sách câu lạc bộ."),
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myClubIds = useMemo(() => {
    return new Set(
      myClubs
        .map((club) => Number(club.clubId ?? club.id))
        .filter(Number.isFinite),
    );
  }, [myClubs]);

  const exploredClubs = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return allClubs.filter((club) => {
      const id = Number(club.id);

      if (myClubIds.has(id)) {
        return false;
      }

      if (!keyword) return true;

      return [club.name, club.description, club.createdByName, club.visibility]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [allClubs, myClubIds, searchText]);

  const selectClub = (club) => {
    const clubId = club.clubId ?? club.id;

    const clubName = club.clubName ?? club.name;

    localStorage.setItem("selectedClubId", String(clubId));

    localStorage.setItem("selectedClubName", clubName || "Club");

    localStorage.setItem(
      "selectedClubRole",
      club.role || club.memberRole || "MEMBER",
    );

    navigate("/home");
  };

  const handleJoinClub = async (club) => {
    try {
      setJoiningClubId(club.id);

      const response = await joinClub(club.id);

      const isPrivate = String(club.visibility).toUpperCase() === "PRIVATE";

      toast.success(
        response?.message ||
          (isPrivate
            ? "Đã gửi yêu cầu tham gia. Vui lòng chờ quản lý CLB phê duyệt."
            : "Gia nhập câu lạc bộ thành công."),
      );

      await loadData();
    } catch (error) {
      console.error("JOIN CLUB ERROR:", error?.response?.data || error);

      toast.error(
        getErrorMessage(error, "Không thể gửi yêu cầu tham gia câu lạc bộ."),
      );
    } finally {
      setJoiningClubId(null);
    }
  };

  return (
    <div className="app-layout">
      <main className="main-content">
        <Topbar title="Home Page / Select Club" />

        <section className="club-browser-page">
          <header className="club-browser-header">
            <div>
              <h1>Choose your club</h1>
              <p>Chọn câu lạc bộ hiện có hoặc khám phá cộng đồng mới.</p>
            </div>

            <button
              type="button"
              className="club-refresh-button"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin-icon" : ""} />
              Làm mới
            </button>
          </header>

          <div className="club-browser-tabs">
            <button
              type="button"
              className={activeTab === "MY_CLUBS" ? "active" : ""}
              onClick={() => setActiveTab("MY_CLUBS")}
            >
              <Users size={18} />
              Câu lạc bộ của tôi
              <span>{myClubs.length}</span>
            </button>

            <button
              type="button"
              className={activeTab === "EXPLORE" ? "active" : ""}
              onClick={() => setActiveTab("EXPLORE")}
            >
              <Globe2 size={18} />
              Explore Club
            </button>
          </div>

          {activeTab === "EXPLORE" && (
            <div className="club-explore-search">
              <Search size={18} />

              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm theo tên hoặc mô tả câu lạc bộ..."
              />
            </div>
          )}

          {loading ? (
            <div className="club-page-loading">
              <RefreshCw className="spin-icon" size={30} />
              <p>Đang tải câu lạc bộ...</p>
            </div>
          ) : activeTab === "MY_CLUBS" ? (
            <div
              className={`club-select-grid ${
                myClubs.length === 0 ? "empty" : ""
              }`}
            >
              {myClubs.length === 0 && (
                <div className="empty-club-state">
                  <Users size={50} />

                  <h2>Bạn chưa tham gia câu lạc bộ nào</h2>

                  <p>Khám phá câu lạc bộ hoặc tạo một câu lạc bộ mới.</p>

                  <button type="button" onClick={() => setActiveTab("EXPLORE")}>
                    Explore Club
                  </button>
                </div>
              )}

              {myClubs.map((club) => (
                <MyClubCard
                  key={club.id ?? club.clubId}
                  club={club}
                  onSelect={selectClub}
                />
              ))}

              <button
                type="button"
                className="club-card create"
                onClick={() => navigate("/create-club")}
              >
                <div className="club-create-icon">
                  <Plus size={34} />
                </div>

                <h2>Create Club</h2>
                <p>Tạo một cộng đồng mới cho bạn.</p>
              </button>
            </div>
          ) : (
            <div className="explore-club-grid">
              {exploredClubs.length === 0 ? (
                <div className="empty-club-state">
                  <Globe2 size={50} />

                  <h2>Không tìm thấy câu lạc bộ</h2>

                  <p>
                    Bạn đã tham gia tất cả CLB hoặc không có kết quả phù hợp.
                  </p>
                </div>
              ) : (
                exploredClubs.map((club) => (
                  <ExploreClubCard
                    key={club.id}
                    club={club}
                    joining={joiningClubId === club.id}
                    onJoin={handleJoinClub}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function MyClubCard({ club, onSelect }) {
  const clubName = club.clubName ?? club.name;

  const role = club.role ?? club.memberRole ?? "MEMBER";

  return (
    <article className="club-card">
      <div className="club-card-logo">
        <img
          src={
            isValidImageUrl(club.logoUrl)
              ? club.logoUrl
              : `https://placehold.co/120x120?text=${encodeURIComponent(
                  clubName?.slice(0, 1) || "C",
                )}`
          }
          alt={clubName}
        />
      </div>

      <div className="club-card-information">
        <h2>{clubName}</h2>

        <span className="club-role-badge">{formatRole(role)}</span>
      </div>

      <button
        type="button"
        className="club-enter-button"
        onClick={() => onSelect(club)}
      >
        Go in!
      </button>
    </article>
  );
}

function ExploreClubCard({ club, joining, onJoin }) {
  const isPublic = String(club.visibility).toUpperCase() === "PUBLIC";

  return (
    <article className="explore-club-card">
      <div className="explore-club-cover">
        <img
          src={
            isValidImageUrl(club.logoUrl)
              ? club.logoUrl
              : `https://placehold.co/500x240?text=${encodeURIComponent(
                  club.name?.slice(0, 1) || "C",
                )}`
          }
          alt={club.name}
        />

        <span
          className={`club-visibility-badge ${isPublic ? "public" : "private"}`}
        >
          {isPublic ? <Globe2 size={13} /> : <LockKeyhole size={13} />}

          {isPublic ? "Public" : "Private"}
        </span>
      </div>

      <div className="explore-club-content">
        <h2>{club.name}</h2>

        <p>{club.description || "Câu lạc bộ chưa có mô tả."}</p>

        <small>
          Quản lý bởi <strong>{club.createdByName || "Không xác định"}</strong>
        </small>

        <button type="button" disabled={joining} onClick={() => onJoin(club)}>
          {joining ? (
            <>
              <RefreshCw size={16} className="spin-icon" />
              Đang xử lý...
            </>
          ) : isPublic ? (
            <>
              <CheckCircle2 size={16} />
              Join now
            </>
          ) : (
            <>
              <Clock3 size={16} />
              Request to join
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function formatRole(role) {
  const roleLabels = {
    PRESIDENT: "Chủ nhiệm",
    CLUB_MANAGER: "Quản lý CLB",
    DEPARTMENT_HEAD: "Trưởng ban",
    TREASURER: "Thủ quỹ",
    MEMBER: "Thành viên",
  };

  return roleLabels[String(role).toUpperCase()] || role;
}

function isValidImageUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}
