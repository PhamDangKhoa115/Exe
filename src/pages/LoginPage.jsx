import { trackEvent } from "../utils/analytics";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { login, loginWithGoogle } from "../api/authApi";

export default function LoginPage() {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const googleContainerRef = useRef(null);
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem("rememberMe") === "true",
  );
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState(
    localStorage.getItem("rememberedEmail") || "",
  );
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

  const handleLoginSuccess = (data, method) => {
    saveAuthData(data);
    trackEvent("user_login", { method });
    toast.success("Login successful! Redirecting to club selection...");
    navigate("/select-club", { replace: true });
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      toast.warning("Please enter your account and password");
      return;
    }

    try {
      setLoading(true);

      const data = await login(normalizedEmail, password);

      // Lưu Remember Me trước khi chuyển trang
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberedEmail", normalizedEmail);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberedEmail");
      }

      handleLoginSuccess(data, "email");
    } catch (error) {
      console.log("LOGIN ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message || error.response?.data || "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (response) => {
    try {
      setLoading(true);

      if (!response?.credential) {
        throw new Error("Google does not return credential");
      }

      const googleProfile = decodeGoogleCredential(response.credential);

      console.log("GOOGLE PROFILE:", googleProfile);

      const data = await loginWithGoogle({
        googleId: googleProfile.sub,
        email: googleProfile.email,
        fullName: googleProfile.name || googleProfile.email,
        avatarUrl: googleProfile.picture || "",
      });

      handleLoginSuccess(data, "google");
    } catch (error) {
      console.log("GOOGLE LOGIN ERROR:", error.response?.data || error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          error.message ||
          "Google login failed",
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

      if (
        !window.google?.accounts?.id ||
        !googleButtonRef.current ||
        !googleContainerRef.current
      ) {
        retryTimer = window.setTimeout(initializeGoogleButton, 300);
        return;
      }

      const containerWidth =
        googleContainerRef.current.getBoundingClientRect().width;

      if (containerWidth <= 0) {
        retryTimer = window.setTimeout(initializeGoogleButton, 300);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleLogin,
        ux_mode: "popup",
        auto_select: false,
      });

      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.floor(containerWidth),
        locale: "vi",
      });
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
        <img src="/logo.png" alt="S-Club Logo" className="auth-logo" />

        <h1>S-Club</h1>
        <div className="auth-inner">
          <h2>Welcome to S-Club</h2>

          <span>Log in to manage your campus organizations.</span>

          <div className="auth-fields">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email or Username"
              disabled={loading}
            />
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={19} /> : <FaEye size={19} />}
              </button>
            </div>
          </div>

          <div className="auth-row">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>

            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          <button className="main-btn full" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="divider">OR</div>
          <div ref={googleContainerRef} className="google-login-container">
            <div ref={googleButtonRef} />
          </div>
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
