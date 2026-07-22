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

    if (!userId) {
      alert("Không tìm thấy userId. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const res = await api.post("/api/clubs", form, {
        params: {
          userId: Number(userId),
        },
      });

      const club = res.data;

      const clubId = club?.id ?? club?.clubId;

      const clubName = club?.name ?? club?.clubName ?? form.name;

      if (!clubId) {
        throw new Error("Backend không trả về ID câu lạc bộ.");
      }

      localStorage.setItem("selectedClubId", String(clubId));

      localStorage.setItem("selectedClubName", clubName);

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
          "Không thể tạo câu lạc bộ.",
      );
    }
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
