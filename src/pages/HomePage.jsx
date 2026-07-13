import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function HomePage() {
  const clubName = localStorage.getItem("selectedClubName") || "S-Club";

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page" />

        <div className="welcome">
          <h1>
            Welcome to <span>{clubName}</span>
          </h1>
          <h2>Enjoy your time!</h2>
        </div>
      </main>
    </div>
  );
}
