import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import LandingProductDemo from "../components/LandingProductDemo";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import StarBorder from "../components/reactbits/StarBorder";
import StrokeText from "../components/reactbits/StrokeText";
import GradientText from "../components/reactbits/GradientText";
import ShinyText from "../components/reactbits/ShinyText";
import FallingText from "../components/reactbits/FallingText";
import { MessageSquare, Sheet, FileChartColumn, CalendarDays, ClipboardCheck } from "lucide-react";
import "./LandingPage.effects.css";

const scatteredTools = [
  { label: "Messages", Icon: MessageSquare },
  { label: "Excel sheets", Icon: Sheet },
  { label: "Reports", Icon: FileChartColumn },
  { label: "Event planning", Icon: CalendarDays },
  { label: "Attendance", Icon: ClipboardCheck },
];

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
        <span className="badge">
          <GradientText
            className="landing-gradient-text"
            colors={["#5271ff", "#6d28d9", "#5271ff"]}
            animationSpeed={5}
          >
            New: Global Feed for every CLUB in school
          </GradientText>
        </span>

        <h1>
          Welcome to{" "}
          <GradientText
            className="landing-gradient-text"
            colors={["#5271ff", "#6d28d9", "#5271ff"]}
            animationSpeed={5}
          >
            S-Club
          </GradientText>
          : All-in-one <br />
          <StrokeText
            className="landing-stroke-text"
            text="Management Platform"
            strokeColor="#111827"
            fillColor="#111827"
            fontSize={54}
            fontWeight={700}
            letterSpacing={0}
            drawDuration={1.2}
            stagger={0.025}
            fillDelay={0.1}
          />
        </h1>

        <p>
          Manage members, events, tasks, finance, reports and announcements in
          one modern platform for student clubs.
        </p>

        <StarBorder
          as={Link}
          to="/login"
          className="main-btn hero-cta"
          color="#c4b5fd"
          backgroundColor="#6d28d9"
          borderColor="#6d28d9"
        >
          Get Started →
        </StarBorder>

        <LandingProductDemo />
      </section>

      <section className="problem-section">
        <div>
          <h4>Problem</h4>
          <h2><ShinyText text="Your club is using too many disjointed tools" color="#111827" shineColor="#8b5cf6" speed={3} delay={1} /></h2>
          <p>
            Messages, Excel sheets, reports, event planning and attendance are
            scattered across different platforms.
          </p>
        </div>

        <div className="problem-card problem-tools-card">
          <FallingText trigger="scroll" gravity={0.56}>
            {scatteredTools.map(({ label, Icon }) => (
              <span className="problem-tool" key={label}>
                <Icon size={22} aria-hidden="true" />
                <span>{label}</span>
              </span>
            ))}
          </FallingText>
        </div>
      </section>

      <section className="solution-section">
        <h4>Solution</h4>
        <h2><ShinyText text="A centralized dashboard for all activities" color="#111827" shineColor="#8b5cf6" speed={3} delay={1} /></h2>

        <div className="feature-grid">
          <SpotlightCard>Member Management</SpotlightCard>
          <SpotlightCard>Event Calendar</SpotlightCard>
          <SpotlightCard>Finance Tracking</SpotlightCard>
          <SpotlightCard>Task Board</SpotlightCard>
          <SpotlightCard>Reports</SpotlightCard>
          <SpotlightCard>Announcements</SpotlightCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}
