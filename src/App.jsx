import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";
import HomePage from "./pages/HomePage";
import SelectClubPage from "./pages/SelectClubPage";
import CreateClubPage from "./pages/CreateClubPage";
import ProfilePage from "./pages/ProfilePage";
import SettingPage from "./pages/SettingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ClubRoute from "./components/ClubRoute";
import GoogleDocsPage from "./pages/GoogleDocsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/select-club"
        element={
          <ProtectedRoute>
            <SelectClubPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-club"
        element={
          <ProtectedRoute>
            <CreateClubPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <HomePage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/google-docs"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <GoogleDocsPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documents/:id"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <DocumentDetailPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <DashboardPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <CalendarPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <ProfilePage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/setting"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <SettingPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
