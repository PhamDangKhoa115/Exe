import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Cloud,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import { connectGoogle, getGoogleConnectionStatus } from "../api/googleApi";

import { getApiError } from "../utils/getApiError";

export default function HomePage() {
  const clubName = localStorage.getItem("selectedClubName") || "S-Club";

  const [googleStatus, setGoogleStatus] = useState({
    isConnected: false,
    googleEmail: "",
    hasRefreshToken: false,
    updatedAt: null,
  });

  const [checkingGoogle, setCheckingGoogle] = useState(true);

  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const loadGoogleStatus = useCallback(async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      setCheckingGoogle(false);
      toast.error("Please log in again.");
      return;
    }

    try {
      setCheckingGoogle(true);

      const data = await getGoogleConnectionStatus();

      setGoogleStatus({
        isConnected: data?.isConnected === true,
        googleEmail: data?.googleEmail || "",
        hasRefreshToken: data?.hasRefreshToken === true,
        updatedAt: data?.updatedAt || null,
      });
    } catch (error) {
      const message = getApiError(
        error,
        "Cannot check Google connection status.",
      );

      console.log("GOOGLE STATUS ERROR:", error.response?.data || error);

      toast.error(message);

      setGoogleStatus({
        isConnected: false,
        googleEmail: "",
        hasRefreshToken: false,
        updatedAt: null,
      });
    } finally {
      setCheckingGoogle(false);
    }
  }, []);

  useEffect(() => {
    loadGoogleStatus();
  }, [loadGoogleStatus]);

  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true);

      await connectGoogle();
    } catch (error) {
      const message = getApiError(error, "Cannot connect to Google account.");

      console.log("CONNECT GOOGLE ERROR:", error.response?.data || error);

      toast.error(message);
      setConnectingGoogle(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page" />

        <div className="home-page-content">
          <section className="welcome">
            <h1>
              Welcome to <span>{clubName}</span>
            </h1>

            <h2>Enjoy your time!</h2>
          </section>

          {checkingGoogle ? (
            <section className="google-status-card loading">
              <LoaderCircle size={32} className="google-status-spinner" />

              <div>
                <h3>Checking Google connection</h3>

                <p>Please wait a moment.</p>
              </div>
            </section>
          ) : googleStatus.isConnected ? (
            <GoogleConnectedCard
              status={googleStatus}
              onRefresh={loadGoogleStatus}
              refreshing={checkingGoogle}
            />
          ) : (
            <GoogleConnectionRequired
              onConnect={handleConnectGoogle}
              connecting={connectingGoogle}
              onRefresh={loadGoogleStatus}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function GoogleConnectionRequired({ onConnect, connecting, onRefresh }) {
  return (
    <section className="google-connect-required">
      <div className="google-connect-icon">
        <Cloud size={38} />
      </div>

      <div className="google-connect-content">
        <span className="google-connect-label">Set up Google Workspace</span>

        <h2>Connect your Google account to continue</h2>

        <p>
          Link your Google account to use Google Calendar, Google Docs, Google
          Sheets and Google Forms in the club.
        </p>

        <div className="google-feature-list">
          <GoogleFeature
            icon={CalendarDays}
            text="Sync events with Google Calendar"
          />

          <GoogleFeature icon={FileText} text="Create and manage Google Docs" />

          <GoogleFeature
            icon={FileSpreadsheet}
            text="Read and update Google Sheets"
          />

          <GoogleFeature
            icon={CheckCircle2}
            text="Create and manage Google Forms"
          />
        </div>

        <div className="google-connect-actions">
          <button
            type="button"
            className="google-connect-button"
            onClick={onConnect}
            disabled={connecting}
          >
            {connecting ? "Redirecting..." : "Connect Google Account"}
          </button>

          <button
            type="button"
            className="google-status-refresh"
            onClick={onRefresh}
            disabled={connecting}
          >
            <RefreshCw size={17} />
            Refresh Status
          </button>
        </div>
      </div>
    </section>
  );
}

function GoogleConnectedCard({ status, onRefresh, refreshing }) {
  return (
    <section className="google-status-card connected">
      <div className="google-status-icon">
        <CheckCircle2 size={34} />
      </div>

      <div className="google-status-content">
        <span className="google-status-label">Google Workspace</span>

        <h3>Google account is connected</h3>

        <p>You can use Calendar, Docs, Sheets and Forms in the club.</p>

        <div className="google-account-details">
          <div>
            <span>Account</span>

            <strong>{status.googleEmail || "Unknown email"}</strong>
          </div>

          <div>
            <span>Refresh token</span>

            <strong>{status.hasRefreshToken ? "Issued" : "Not issued"}</strong>
          </div>

          <div>
            <span>Last updated</span>

            <strong>{formatGoogleUpdatedAt(status.updatedAt)}</strong>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="google-status-refresh icon-only"
        onClick={onRefresh}
        disabled={refreshing}
        title="Refresh Status"
      >
        <RefreshCw size={19} className={refreshing ? "rotating" : ""} />
      </button>
    </section>
  );
}

function GoogleFeature({ icon: Icon, text }) {
  return (
    <div className="google-feature-item">
      <Icon size={19} />
      <span>{text}</span>
    </div>
  );
}

function formatGoogleUpdatedAt(value) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
