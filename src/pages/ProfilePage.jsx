import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { getApiError } from "../utils/getApiError";
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "../api/userApi";
import { toast } from "react-toastify";
export default function ProfilePage() {
  const userId = localStorage.getItem("userId");

  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    avatarUrl: "",
  });

  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile(userId);

      setProfile({
        fullName: data.fullName || "",
        username: data.username || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        avatarUrl: data.avatarUrl || "",
      });
    } catch (error) {
      console.log("LOAD PROFILE ERROR:", error.response?.data || error);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const updated = await updateUserProfile(userId, profile);

      localStorage.setItem("fullName", updated.fullName || profile.fullName);
      localStorage.setItem("username", updated.username || profile.username);
      localStorage.setItem("email", updated.email || profile.email);
      localStorage.setItem("avatarUrl", updated.avatarUrl || profile.avatarUrl);

      toast.success("Profile updated successfully");
      await loadProfile();
    } catch (error) {
      const message = getApiError(error, "Cannot update profile");
      console.log("UPDATE PROFILE ERROR:", error.response?.data || error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      !password.oldPassword ||
      !password.newPassword ||
      !password.confirmPassword
    ) {
      toast.error("Please fill all password fields");
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      toast.error("Confirm password does not match");
      return;
    }

    try {
      setLoading(true);

      await changePassword(userId, password);

      toast.success("Password changed successfully");

      setPassword({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      const message = getApiError(error, "Cannot change password");
      console.log("CHANGE PASSWORD ERROR:", error.response?.data || error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page / Profile" />

        <div className="profile-page-wrap">
          <form
            className="profile-form profile-card"
            onSubmit={handleSaveProfile}
          >
            <div className="profile-avatar-wrap">
              <img
                className="profile-avatar-large"
                src={profile.avatarUrl || "https://i.pravatar.cc/150?img=32"}
                alt="avatar"
              />
            </div>

            <h1>User Profile</h1>

            <label>Full Name</label>
            <input
              value={profile.fullName}
              onChange={(e) =>
                setProfile({ ...profile, fullName: e.target.value })
              }
              placeholder="Full name"
            />

            <label>Username</label>
            <input
              value={profile.username}
              onChange={(e) =>
                setProfile({ ...profile, username: e.target.value })
              }
              placeholder="Username"
            />

            <label>Email</label>
            <input
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              placeholder="Email"
            />

            <label>Phone number</label>
            <input
              value={profile.phoneNumber}
              onChange={(e) =>
                setProfile({ ...profile, phoneNumber: e.target.value })
              }
              placeholder="09xxxxxxxx"
            />

            <label>Avatar URL</label>
            <input
              value={profile.avatarUrl}
              onChange={(e) =>
                setProfile({ ...profile, avatarUrl: e.target.value })
              }
              placeholder="https://..."
            />

            <div className="form-actions">
              <button type="button" onClick={() => window.history.back()}>
                Back
              </button>
              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <form
            className="profile-form profile-card"
            onSubmit={handleChangePassword}
          >
            <h1>Change Password</h1>

            <label>Old Password</label>
            <input
              type="password"
              value={password.oldPassword}
              onChange={(e) =>
                setPassword({ ...password, oldPassword: e.target.value })
              }
              placeholder="Old password"
            />

            <label>New Password</label>
            <input
              type="password"
              value={password.newPassword}
              onChange={(e) =>
                setPassword({ ...password, newPassword: e.target.value })
              }
              placeholder="New password"
            />

            <label>Confirm Password</label>
            <input
              type="password"
              value={password.confirmPassword}
              onChange={(e) =>
                setPassword({ ...password, confirmPassword: e.target.value })
              }
              placeholder="Confirm password"
            />

            <div className="form-actions">
              <button
                type="button"
                onClick={() =>
                  setPassword({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                }
              >
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                Change
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
