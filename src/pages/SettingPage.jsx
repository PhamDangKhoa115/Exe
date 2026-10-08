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

import ClubGovernance from "../components/ClubGovernance";
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

      toast.success("Settings saved.");
    } catch (error) {
      console.error("SAVE SETTINGS ERROR:", error);

      toast.error("Cannot save settings.");
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
                  Manage how ClubSync sends notifications and reminders to your
                  account.
                </p>
              </div>
            </div>
          </header>

          <div className="setting-layout">
            <section className="setting-card">
              <div className="setting-card-header">
                <div>
                  <h2>Notification Settings</h2>

                  <p>Choose the types of notifications you want to receive.</p>
                </div>

                <Bell size={23} />
              </div>

              <div className="setting-option-list">
                <SettingOption
                  icon={<Mail size={21} />}
                  title="Email Notification"
                  description="Receive event, task, and update notifications via email."
                  checked={settings.emailNotification}
                  onChange={(checked) => setField("emailNotification", checked)}
                />

                <SettingOption
                  icon={<Bell size={21} />}
                  title="System Notification"
                  description="Display notifications directly in the ClubSync system."
                  checked={settings.systemNotification}
                  onChange={(checked) =>
                    setField("systemNotification", checked)
                  }
                />

                <SettingOption
                  icon={<CheckCircle2 size={21} />}
                  title="Event Reminder"
                  description="Remind you before your club's events begin."
                  checked={settings.eventReminder}
                  onChange={(checked) => setField("eventReminder", checked)}
                />

                <SettingOption
                  icon={<ShieldCheck size={21} />}
                  title="Task Reminder"
                  description="Remind you about upcoming or overdue tasks."
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

                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </section>

            <aside className="setting-info-card">
              <div className="setting-info-icon">
                <ShieldCheck size={27} />
              </div>

              <h2>Privacy Information</h2>

              <p>
                You can change your notification preferences at any time.
                Important security-related notifications will still be sent.
              </p>

              <div className="setting-info-status">
                <CheckCircle2 size={17} />
                Settings are saved in your browser
              </div>
            </aside>
          </div>
          <ClubGovernance />
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
