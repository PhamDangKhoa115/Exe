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
        throw new Error("Google does not return credential");
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

      toast.success("Register with Google successfully");
      navigate("/select-club", { replace: true });
    } catch (err) {
      console.log("GOOGLE REGISTER ERROR:", err.response?.data || err);

      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Register with Google failed",
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
    let resizeTimeoutId;
    let cancelled = false;

    const renderGoogleButton = () => {
      const container = googleButtonRef.current;

      if (cancelled || !container || !window.google?.accounts?.id) {
        return;
      }

      container.innerHTML = "";

      const containerWidth = container.getBoundingClientRect().width;

      const buttonWidth = Math.floor(Math.max(240, containerWidth));

      window.google.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signup_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: buttonWidth,
        locale: "vi",
      });
    };

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

      requestAnimationFrame(() => {
        renderGoogleButton();
      });
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimeoutId);

      resizeTimeoutId = window.setTimeout(() => {
        renderGoogleButton();
      }, 150);
    };

    initializeGoogleButton();
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;

      window.removeEventListener("resize", handleResize);

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (resizeTimeoutId) {
        window.clearTimeout(resizeTimeoutId);
      }
    };
  }, []);
  return (
    <div className="auth-page">
      <form className="auth-card register-card" onSubmit={handleRegister}>
        <img src="/logo.png" alt="S-Club Logo" className="auth-logo" />

        <h1>Join S-Club</h1>

        <div className="register-fields">
          <div className="auth-field">
            <label htmlFor="fullName">Full Name</label>

            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Tran Van A"
              disabled={loading || googleLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="username">Username</label>

            <input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="tranvana"
              disabled={loading || googleLoading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">University Email</label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tranvana@fpt.edu.vn"
              disabled={loading || googleLoading}
            />
          </div>

          <div className="two-cols">
            <div className="auth-field">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading || googleLoading}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm</label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading || googleLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="main-btn full"
            disabled={loading || googleLoading}
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="google-register-wrapper" ref={googleButtonRef}>
            {googleLoading && (
              <span className="google-loading-overlay">Registering...</span>
            )}
          </div>

          {googleLoading && (
            <p className="google-login-status">Registering with Google...</p>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </form>
    </div>
  );
}

function decodeGoogleCredential(credential) {
  const parts = credential.split(".");

  if (parts.length !== 3) {
    throw new Error("Google credential is invalid");
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
