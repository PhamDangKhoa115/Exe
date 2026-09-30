import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword } from "../api/authApi";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      toast.warning("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const data = await forgotPassword(normalizedEmail);

      console.log("FORGOT PASSWORD RESPONSE:", data);

      toast.success(
        data?.message || "Account verified. Please reset your password.",
      );

      // API 200 -> sang trang Reset Password
      navigate("/reset-password", {
        state: {
          email: normalizedEmail,
        },
      });
    } catch (error) {
      console.error("FORGOT PASSWORD ERROR:", error?.response?.data || error);

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Unable to process forgot password request.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-inner">
          <h2>Forgot Password?</h2>

          <span>
            Enter your email address and we'll send you instructions to reset
            your password.
          </span>

          <div className="auth-fields">
            <label htmlFor="forgot-email">Email Address</label>

            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <button className="main-btn full" type="submit" disabled={loading}>
            {loading ? "Checking..." : "Send Reset Link"}
          </button>

          <p className="auth-footer">
            <Link to="/login">← Back to Login</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
