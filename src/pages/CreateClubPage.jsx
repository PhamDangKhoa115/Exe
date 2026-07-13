import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Topbar from "../components/Topbar";

export default function CreateClubPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    logoUrl: "",
    visibility: "PRIVATE",
  });

  const submit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("userId");

    const res = await api.post("/api/clubs", form, {
      params: {
        userId,
      },
    });

    const club = res.data;

    localStorage.setItem("selectedClubId", club.id);
    localStorage.setItem("selectedClubName", club.name);
    localStorage.setItem("selectedClubRole", "Club Manager");

    navigate("/home");
  };

  return (
    <div className="app-layout">
      <main className="main-content">
        <Topbar title="Home Page / Create Club" />

        <form className="profile-form" onSubmit={submit}>
          <h1>Create Club</h1>

          <label>Club Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Badminton Club"
          />

          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label>Logo URL</label>
          <input
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />

          <div className="radio-row">
            <label>
              <input
                type="radio"
                checked={form.visibility === "PRIVATE"}
                onChange={() => setForm({ ...form, visibility: "PRIVATE" })}
              />
              Private
            </label>

            <label>
              <input
                type="radio"
                checked={form.visibility === "PUBLIC"}
                onChange={() => setForm({ ...form, visibility: "PUBLIC" })}
              />
              Public
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate("/select-club")}>
              Cancel
            </button>
            <button type="submit">Save</button>
          </div>
        </form>
      </main>
    </div>
  );
}
