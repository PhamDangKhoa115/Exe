import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { login, loginWithGoogle } from "../api/authApi";

export default function LoginPage() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const saveAuthData = (data) => {
    if (!data?.token || !data?.userId) {
      throw new Error("Backend không trả về token hoặc userId");
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

  const handleLoginSuccess = (data) => {
    saveAuthData(data);
    toast.success("Đăng nhập thành công");
    navigate("/select-club", { replace: true });
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.warning("Vui lòng nhập tài khoản và mật khẩu");
      return;
    }

    try {
      setLoading(true);

      const data = await login(email.trim(), password);

      handleLoginSuccess(data);
    } catch (error) {
      console.log("LOGIN ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Đăng nhập thất bại",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (response) => {
    try {
      setLoading(true);

      if (!response?.credential) {
        throw new Error("Google không trả về credential");
      }

      const googleProfile = decodeGoogleCredential(response.credential);

      console.log("GOOGLE PROFILE:", googleProfile);

      const data = await loginWithGoogle({
        googleId: googleProfile.sub,
        email: googleProfile.email,
        fullName: googleProfile.name || googleProfile.email,
        avatarUrl: googleProfile.picture || "",
      });

      handleLoginSuccess(data);
    } catch (error) {
      console.log("GOOGLE LOGIN ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Đăng nhập Google thất bại",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("Thiếu VITE_GOOGLE_CLIENT_ID");
      return;
    }

    let retryTimer;
    let cancelled = false;

    const initializeGoogleButton = () => {
      if (cancelled) return;

      if (!window.google?.accounts?.id) {
        retryTimer = window.setTimeout(initializeGoogleButton, 300);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleLogin,
        ux_mode: "popup",
        auto_select: false,
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
          locale: "vi",
        });
      }
    };

    initializeGoogleButton();

    return () => {
      cancelled = true;

      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, []);

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>
        <div className="big-logo">CS</div>

        <h1>S-Club</h1>
        <p>STUDENT CLUBS OS</p>

        <div className="auth-inner">
          <h2>Welcome to S-Club</h2>

          <span>Log in to manage your campus organizations.</span>

          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email or Username"
            disabled={loading}
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            disabled={loading}
          />

          <div className="auth-row">
            <label className="checkbox-label">
              <input type="checkbox" />
              Remember me
            </label>

            <button type="button" className="forgot-password-link">
              Forgot password?
            </button>
          </div>

          <button className="main-btn full" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Login"}
          </button>

          <div className="divider">OR</div>

          <div ref={googleButtonRef} className="google-login-container" />
        </div>

        <p className="auth-footer">
          New to the community? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

function decodeGoogleCredential(credential) {
  const payload = credential.split(".")[1];

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");

  const decoded = decodeURIComponent(
    window
      .atob(normalized)
      .split("")
      .map(
        (character) =>
          `%${("00" + character.charCodeAt(0).toString(16)).slice(-2)}`,
      )
      .join(""),
  );

  return JSON.parse(decoded);
}
