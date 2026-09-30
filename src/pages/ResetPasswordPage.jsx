import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import { resetPassword } from "../api/authApi";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error("Email information is missing.");
      navigate("/forgot-password");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.warning("Please enter your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const data = await resetPassword({
        email,
        token: "",
        newPassword,
        confirmPassword,
      });

      toast.success(data?.message || "Password reset successfully!");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error?.response?.data || error);

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Password reset failed.",
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

          <span>Create a new password for your S-Club account.</span>

          <div className="auth-fields">
            <label>Email Address</label>

            <input type="email" value={email} disabled />

            <label>New Password</label>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <FaEyeSlash size={19} /> : <FaEye size={19} />}
              </button>
            </div>

            <label>Confirm Password</label>

            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash size={19} />
                ) : (
                  <FaEye size={19} />
                )}
              </button>
            </div>
          </div>

          <button className="main-btn full" type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <p className="auth-footer">
            <Link to="/login">← Back to Login</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
