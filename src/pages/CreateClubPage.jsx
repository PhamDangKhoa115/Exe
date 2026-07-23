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
    const clubName = form.name.trim();

    if (!userId) {
      alert("No userId found. Please log in again.");
      return;
    }

    if (!clubName) {
      alert("Please enter a club name.");
      return;
    }

    try {
      const payload = {
        ...form,
        name: clubName,
        description: form.description.trim(),
        logoUrl: form.logoUrl.trim(),
      };

      const res = await api.post("/api/clubs", payload, {
        params: {
          userId: Number(userId),
        },
      });

      const club = res.data;

      const clubId = club?.id ?? club?.clubId;

      const createdClubName = club?.name ?? club?.clubName ?? clubName;

      if (!clubId) {
        throw new Error(
          "No clubId returned from backend after creating a club.",
        );
      }

      localStorage.setItem("selectedClubId", String(clubId));
      localStorage.setItem("selectedClubName", createdClubName);
      localStorage.setItem(
        "selectedClubRole",
        club?.role || club?.memberRole || "PRESIDENT",
      );

      navigate("/home", {
        replace: true,
      });
    } catch (error) {
      console.error("CREATE CLUB ERROR:", error?.response?.data || error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Cannot create club.",
      );
    }
  };

  return (
    <div className="app-layout">
      <main className="main-content">
        <Topbar title="Home Page / Create Club" />

        <form className="profile-form" onSubmit={submit}>
          <h1>Create Club</h1>

          <label>
            Club Name <span style={{ color: "red" }}>*</span>
          </label>

          <input
            required
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            placeholder="Ex: Badminton Club"
          />

          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label>Logo URL</label>

          <input
            type="url"
            maxLength={255}
            value={form.logoUrl}
            onChange={(e) =>
              setForm({
                ...form,
                logoUrl: e.target.value,
              })
            }
            placeholder="https://example.com/logo.png"
          />

          <small>Only enter a short image URL</small>

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
            <button type="submit" disabled={!form.name.trim()}>
              Save
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
