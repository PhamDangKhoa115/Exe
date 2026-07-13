import Topbar from "../components/Topbar";

export default function SettingPage() {
  return (
    <div className="app-layout">
      <main className="main-content">
        <Topbar title="Home Page / Setting" />

        <div className="profile-form">
          <h1>Setting</h1>
          <label>
            <input type="checkbox" /> Receive Email Notification
          </label>
          <label>
            <input type="checkbox" /> Receive System Notification
          </label>
          <button>Done</button>
        </div>
      </main>
    </div>
  );
}
