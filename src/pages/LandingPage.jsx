import { Link } from "react-router-dom";
import Footer from "../components/Footer";
export default function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="brand">
          <img src="/logo.png" alt="S-Club Logo" className="brand-logo" />
          <h2>S-Club</h2>
        </div>
        {/* 
        <div className="landing-menu">
          <a>Home</a>
          <a>Features</a>
          <a>Pricing</a>
          <a>Contact</a>
        </div> */}

        <div>
          <Link to="/login" className="text-btn">
            Login
          </Link>
          <Link to="/register" className="small-primary-btn">
            Sign Up
          </Link>
        </div>
      </nav>

      <section className="hero-section">
        <span className="badge">New: Global Feed for every CLUB in school</span>

        <h1>
          Welcome to <span>S-Club</span>: All-in-one <br />
          Management Platform
        </h1>

        <p>
          Manage members, events, tasks, finance, reports and announcements in
          one modern platform for student clubs.
        </p>

        <Link to="/login" className="main-btn">
          Get Started →
        </Link>

        <div className="hero-preview">
          <div className="preview-sidebar"></div>
          <div className="preview-main">
            <div className="preview-line"></div>
            <div className="preview-grid">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <div className="preview-chart"></div>
          </div>
        </div>
      </section>

      <section className="problem-section">
        <div>
          <h4>Problem</h4>
          <h2>Your club is using too many disjointed tools</h2>
          <p>
            Messages, Excel sheets, reports, event planning and attendance are
            scattered across different platforms.
          </p>
        </div>

        <div className="problem-card">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </section>

      <section className="solution-section">
        <h4>Solution</h4>
        <h2>A centralized dashboard for all activities</h2>

        <div className="feature-grid">
          <div>Member Management</div>
          <div>Event Calendar</div>
          <div>Finance Tracking</div>
          <div>Task Board</div>
          <div>Reports</div>
          <div>Announcements</div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
