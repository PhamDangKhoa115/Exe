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
      toast.error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
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
        "Không thể kiểm tra trạng thái kết nối Google.",
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
      const message = getApiError(error, "Không thể kết nối tài khoản Google.");

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
                <h3>Đang kiểm tra kết nối Google</h3>

                <p>Vui lòng chờ trong giây lát.</p>
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
        <span className="google-connect-label">Thiết lập Google Workspace</span>

        <h2>Kết nối tài khoản Google để tiếp tục</h2>

        <p>
          Liên kết tài khoản Google để sử dụng Google Calendar, Google Docs,
          Google Sheets và Google Forms trong câu lạc bộ.
        </p>

        <div className="google-feature-list">
          <GoogleFeature
            icon={CalendarDays}
            text="Đồng bộ sự kiện với Google Calendar"
          />

          <GoogleFeature icon={FileText} text="Tạo và quản lý Google Docs" />

          <GoogleFeature
            icon={FileSpreadsheet}
            text="Đọc và cập nhật Google Sheets"
          />

          <GoogleFeature
            icon={CheckCircle2}
            text="Tạo và quản lý Google Forms"
          />
        </div>

        <div className="google-connect-actions">
          <button
            type="button"
            className="google-connect-button"
            onClick={onConnect}
            disabled={connecting}
          >
            {connecting ? "Đang chuyển hướng..." : "Kết nối tài khoản Google"}
          </button>

          <button
            type="button"
            className="google-status-refresh"
            onClick={onRefresh}
            disabled={connecting}
          >
            <RefreshCw size={17} />
            Kiểm tra lại
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

        <h3>Tài khoản Google đã được kết nối</h3>

        <p>Bạn có thể sử dụng Calendar, Docs, Sheets và Forms trong CLB.</p>

        <div className="google-account-details">
          <div>
            <span>Tài khoản</span>

            <strong>{status.googleEmail || "Không rõ email"}</strong>
          </div>

          <div>
            <span>Refresh token</span>

            <strong>{status.hasRefreshToken ? "Đã cấp" : "Chưa có"}</strong>
          </div>

          <div>
            <span>Cập nhật gần nhất</span>

            <strong>{formatGoogleUpdatedAt(status.updatedAt)}</strong>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="google-status-refresh icon-only"
        onClick={onRefresh}
        disabled={refreshing}
        title="Kiểm tra lại trạng thái"
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
  if (!value) return "Không rõ";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Không rõ";
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
