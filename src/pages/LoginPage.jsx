import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { useState } from "react";
import { toast } from "react-toastify";
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const data = await login(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);
      localStorage.setItem("fullName", data.fullName);
      localStorage.setItem("email", data.email);
      navigate("/select-club");
    } catch (err) {
      console.log(err);

      toast.error(err.response?.data?.message || "Login failed");
    }
  };
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email or Username"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          <div className="auth-row">
            <label className="checkbox-label">
              <input type="checkbox" />
              Remember me
            </label>
            <a>Forgot password?</a>
          </div>

          <button className="main-btn full">Login</button>

          <div className="divider">OR</div>

          <button type="button" className="google-btn">
            Continue with Google
          </button>
        </div>

        <p className="auth-footer">
          New to the community? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
