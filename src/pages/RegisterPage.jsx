import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/authApi";
import { toast } from "react-toastify";
export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
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

      setLoading(true);

      await register({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      toast.success("Register successfully. Please login.");
      navigate("/login");
    } catch (err) {
      console.log(err.response?.data || err);

      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Register failed",
      );
    } finally {
      setLoading(false);
    }
  };

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
        />

        <label>Username</label>
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="tranvana"
        />

        <label>University Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="tranvana@fpt.edu.vn"
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
            />
          </div>
        </div>

        <div className="role-box">Default role: New User</div>

        <button className="main-btn full" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <div className="divider">OR</div>

        <button type="button" className="google-btn">
          Register with Google
        </button>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
