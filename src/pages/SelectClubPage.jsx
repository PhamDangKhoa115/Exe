import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Topbar from "../components/Topbar";

export default function SelectClubPage() {
  const [clubs, setClubs] = useState([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    api.get(`/api/clubs/user/${userId}`).then((res) => {
      setClubs(res.data || []);
    });
  }, [userId]);

  const selectClub = (club) => {
    localStorage.setItem("selectedClubId", club.clubId);
    localStorage.setItem("selectedClubName", club.clubName);
    localStorage.setItem("selectedClubRole", club.role || "Member");

    navigate("/home");
  };
  return (
    <div className="app-layout">
      <main className="main-content">
        <Topbar title="Home Page / Switch Club" />

        <div
          className={`club-select-grid ${clubs.length === 0 ? "empty" : ""}`}
        >
          {clubs.length === 0 && (
            <div className="empty-club-state">
              <h1>You don’t have any club yet</h1>
              <p>Create your first club to start using ClubSync.</p>
            </div>
          )}
          {clubs.map((club) => (
            <div className="club-card" key={club.id}>
              <div className="club-card-row">
                <img
                  src={club.logoUrl || "https://i.pravatar.cc/100?img=12"}
                  alt="club"
                />
                <h2>{club.clubName}</h2>
              </div>

              <div className="club-card-row">
                <span>👤</span>
                <h3>
                  {club.role || club.memberRole || club.status || "Member"}
                </h3>
              </div>

              <button onClick={() => selectClub(club)}>Go in !</button>
            </div>
          ))}

          <div
            className="club-card create"
            onClick={() => navigate("/create-club")}
          >
            <div className="club-card-row">
              <h2>Create Club</h2>
            </div>

            <button type="button">+</button>
          </div>
        </div>
      </main>
    </div>
  );
}
