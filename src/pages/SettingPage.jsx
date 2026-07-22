import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Mail,
  MonitorCog,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

import Topbar from "../components/Topbar";

import "../styles.css";

const STORAGE_KEY = "clubSyncSettings";

const DEFAULT_SETTINGS = {
  emailNotification: true,
  systemNotification: true,
  eventReminder: true,
  taskReminder: true,
};

export default function SettingPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);

      if (!savedSettings) return;

      setSettings({
        ...DEFAULT_SETTINGS,
        ...JSON.parse(savedSettings),
      });
    } catch (error) {
      console.error("LOAD SETTINGS ERROR:", error);
    }
  }, []);

  const setField = (field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSave = () => {
    try {
      setSaving(true);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      toast.success("Đã lưu cài đặt thông báo.");
    } catch (error) {
      console.error("SAVE SETTINGS ERROR:", error);

      toast.error("Không thể lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-layout">
      <main className="main-content">
        <Topbar title="Home Page / Setting" />

        <section className="setting-page">
          <header className="setting-header">
            <div className="setting-heading">
              <div className="setting-heading-icon">
                <MonitorCog size={27} />
              </div>

              <div>
                <h1>Settings</h1>

                <p>
                  Quản lý cách ClubSync gửi thông báo và nhắc nhở đến tài khoản
                  của bạn.
                </p>
              </div>
            </div>
          </header>

          <div className="setting-layout">
            <section className="setting-card">
              <div className="setting-card-header">
                <div>
                  <h2>Notification Settings</h2>

                  <p>Chọn loại thông báo bạn muốn nhận.</p>
                </div>

                <Bell size={23} />
              </div>

              <div className="setting-option-list">
                <SettingOption
                  icon={<Mail size={21} />}
                  title="Email Notification"
                  description="Nhận thông báo sự kiện, công việc và cập nhật qua email."
                  checked={settings.emailNotification}
                  onChange={(checked) => setField("emailNotification", checked)}
                />

                <SettingOption
                  icon={<Bell size={21} />}
                  title="System Notification"
                  description="Hiển thị thông báo trực tiếp trong hệ thống ClubSync."
                  checked={settings.systemNotification}
                  onChange={(checked) =>
                    setField("systemNotification", checked)
                  }
                />

                <SettingOption
                  icon={<CheckCircle2 size={21} />}
                  title="Event Reminder"
                  description="Nhắc bạn trước khi sự kiện của câu lạc bộ bắt đầu."
                  checked={settings.eventReminder}
                  onChange={(checked) => setField("eventReminder", checked)}
                />

                <SettingOption
                  icon={<ShieldCheck size={21} />}
                  title="Task Reminder"
                  description="Thông báo công việc sắp đến hạn hoặc đã quá hạn."
                  checked={settings.taskReminder}
                  onChange={(checked) => setField("taskReminder", checked)}
                />
              </div>

              <div className="setting-card-footer">
                <button
                  type="button"
                  className="setting-save-button"
                  disabled={saving}
                  onClick={handleSave}
                >
                  <Save size={18} />

                  {saving ? "Đang lưu..." : "Lưu cài đặt"}
                </button>
              </div>
            </section>

            <aside className="setting-info-card">
              <div className="setting-info-icon">
                <ShieldCheck size={27} />
              </div>

              <h2>Thông tin quyền riêng tư</h2>

              <p>
                Bạn có thể thay đổi tùy chọn thông báo bất kỳ lúc nào. Những
                thông báo quan trọng liên quan đến bảo mật tài khoản vẫn có thể
                được gửi.
              </p>

              <div className="setting-info-status">
                <CheckCircle2 size={17} />
                Cài đặt được lưu trên trình duyệt
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

function SettingOption({ icon, title, description, checked, onChange }) {
  return (
    <article className="setting-option">
      <div className="setting-option-icon">{icon}</div>

      <div className="setting-option-content">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <label className="setting-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />

        <span />
      </label>
    </article>
  );
}
