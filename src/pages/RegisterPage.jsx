import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { register, loginWithGoogle } from "../api/authApi";

export default function RegisterPage() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    setForm((previousForm) => ({
      ...previousForm,
      [e.target.name]: e.target.value,
    }));
  };

  const saveAuthData = (data) => {
    if (!data?.token || !data?.userId) {
      throw new Error(
        "Backend không trả về token hoặc userId sau khi đăng nhập Google",
      );
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", String(data.userId));
    localStorage.setItem("username", data.username || "");
    localStorage.setItem("fullName", data.fullName || "");
    localStorage.setItem("email", data.email || "");
    localStorage.setItem("avatarUrl", data.avatarUrl || "");

    localStorage.removeItem("selectedClubId");
    localStorage.removeItem("selectedClubName");
    localStorage.removeItem("selectedClubRole");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.username || !form.email) {
      toast.error("Please fill full name, username and email");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Confirm password does not match");
      return;
    }

    try {
      setLoading(true);

      await register({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      toast.success("Register successfully. Please login.");
      navigate("/login");
    } catch (err) {
      console.log("REGISTER ERROR:", err.response?.data || err);

      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Register failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (response) => {
    try {
      if (!response?.credential) {
        throw new Error("Google không trả về thông tin tài khoản");
      }

      setGoogleLoading(true);

      const googleProfile = decodeGoogleCredential(response.credential);

      const data = await loginWithGoogle({
        googleId: googleProfile.sub,
        email: googleProfile.email,
        fullName: googleProfile.name || googleProfile.email || "Google User",
        avatarUrl: googleProfile.picture || "",
      });

      saveAuthData(data);

      toast.success("Đăng ký bằng Google thành công");
      navigate("/select-club", { replace: true });
    } catch (err) {
      console.log("GOOGLE REGISTER ERROR:", err.response?.data || err);

      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Đăng ký bằng Google thất bại",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("Thiếu VITE_GOOGLE_CLIENT_ID trong file .env");
      return;
    }

    let timeoutId;
    let cancelled = false;

    const initializeGoogleButton = () => {
      if (cancelled) return;

      if (!window.google?.accounts?.id) {
        timeoutId = window.setTimeout(initializeGoogleButton, 300);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
        ux_mode: "popup",
        auto_select: false,
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "rectangular",
          width: 340,
          locale: "en",
        });
      }
    };

    initializeGoogleButton();

    return () => {
      cancelled = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className="auth-page">
      <form className="auth-card register-card" onSubmit={handleRegister}>
        <div className="big-logo">CS</div>

        <h1>Join S-Club</h1>
        <p>The unified student clubs OS.</p>

        <label>Full Name</label>
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Tran Van A"
          disabled={loading || googleLoading}
        />

        <label>Username</label>
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="tranvana"
          disabled={loading || googleLoading}
        />

        <label>University Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="tranvana@fpt.edu.vn"
          disabled={loading || googleLoading}
        />

        <div className="two-cols">
          <div>
            <label>Password</label>

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading || googleLoading}
            />
          </div>

          <div>
            <label>Confirm</label>

            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading || googleLoading}
            />
          </div>
        </div>

        <div className="role-box">Default role: New User</div>

        <button
          type="submit"
          className="main-btn full"
          disabled={loading || googleLoading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <div className="divider">OR</div>

        <div
          ref={googleButtonRef}
          className={
            googleLoading
              ? "google-login-container loading"
              : "google-login-container"
          }
        />

        {googleLoading && (
          <p className="google-login-status">Đang đăng ký bằng Google...</p>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}

function decodeGoogleCredential(credential) {
  const parts = credential.split(".");

  if (parts.length !== 3) {
    throw new Error("Thông tin đăng nhập Google không hợp lệ");
  }

  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");

  const paddedPayload = payload.padEnd(
    payload.length + ((4 - (payload.length % 4)) % 4),
    "=",
  );

  const decodedPayload = decodeURIComponent(
    window
      .atob(paddedPayload)
      .split("")
      .map(
        (character) =>
          `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`,
      )
      .join(""),
  );

  return JSON.parse(decodedPayload);
}
