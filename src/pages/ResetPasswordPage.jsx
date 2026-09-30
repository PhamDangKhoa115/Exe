import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import { resetPassword } from "../api/authApi";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Email được truyền từ ForgotPasswordPage
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error("Email information is missing. Please request a new OTP.");

      navigate("/forgot-password", {
        replace: true,
      });

      return;
    }

    const normalizedOtp = otp.trim();

    if (!normalizedOtp) {
      toast.warning("Please enter the OTP sent to your email.");
      return;
    }

    if (!/^\d{6}$/.test(normalizedOtp)) {
      toast.warning("OTP must contain 6 digits.");
      return;
    }

    if (!newPassword) {
      toast.warning("Please enter your new password.");
      return;
    }

    if (!confirmPassword) {
      toast.warning("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("New password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);

      const data = await resetPassword({
        email,
        otp: normalizedOtp,
        newPassword,
        confirmPassword,
      });

      console.log("RESET PASSWORD RESPONSE:", data);

      toast.success(data?.message || "Password reset successfully!");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error?.response?.data || error);

      toast.error(
        error?.response?.data?.message ||
          "Unable to reset password. Please check your OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-inner">
          <h2>Reset Password</h2>

          <span>
            Enter the OTP sent to your email and create a new password.
          </span>

          <div className="auth-fields">
            {/* EMAIL */}
            <label>Email Address</label>

            <input type="email" value={email} disabled />

            {/* OTP */}
            <label htmlFor="reset-otp">OTP Code</label>

            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => {
                // Chỉ cho nhập số
                const value = event.target.value.replace(/\D/g, "");

                setOtp(value);
              }}
              placeholder="Enter 6-digit OTP"
              autoComplete="one-time-code"
              disabled={loading}
            />

            {/* NEW PASSWORD */}
            <label htmlFor="new-password">New Password</label>

            <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword((current) => !current)}
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? (
                  <FaEyeSlash size={19} />
                ) : (
                  <FaEye size={19} />
                )}
              </button>
            </div>

            {/* CONFIRM PASSWORD */}
            <label htmlFor="confirm-password">Confirm Password</label>

            <div className="password-input-wrapper">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <FaEyeSlash size={19} />
                ) : (
                  <FaEye size={19} />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="main-btn full" disabled={loading}>
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>

          <p className="auth-footer">
            <Link to="/forgot-password">← Request a new OTP</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
