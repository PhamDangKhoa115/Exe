import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GlobalNotificationsPage from "./pages/GlobalNotificationsPage";
import DashboardPage from "./pages/DashboardPage";
import FinancePage from "./pages/FinancePage";
import CalendarPage from "./pages/CalendarPage";
import HomePage from "./pages/HomePage";
import SelectClubPage from "./pages/SelectClubPage";
import CreateClubPage from "./pages/CreateClubPage";
import ProfilePage from "./pages/ProfilePage";
import SettingPage from "./pages/SettingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ClubRoute from "./components/ClubRoute";
import GoogleDocsPage from "./pages/GoogleDocsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import GoogleSheetsPage from "./pages/GoogleSheetsPage";
import GoogleFormsPage from "./pages/GoogleFormsPage";
import DocumentPreviewPage from "./pages/DocumentPreviewPage";
import TrelloPage from "./pages/TrelloPage";
import DepartmentPage from "./pages/DepartmentPage";
import MemberManagementPage from "./pages/MemberManagementPage";
import DepartmentChatPage from "./pages/DepartmentChatPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPage from "./pages/privacy/PrivacyPage";
import TermsPage from "./pages/privacy/TermsPage";
import PaymentCallbackRoute from "./components/PaymentCallbackRoute";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      {["/payment/cancel", "/payment/success", "/payment/return"].map((path) => (
        <Route key={path} path={path} element={
          <ProtectedRoute>
            <ClubRoute><PaymentCallbackRoute /></ClubRoute>
          </ProtectedRoute>
        } />
      ))}
      <Route
        path="/select-club"
        element={
          <ProtectedRoute>
            <SelectClubPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <DepartmentPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments/:departmentId/chat"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <DepartmentChatPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trello"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <TrelloPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <MemberManagementPage />
            </ClubRoute>
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
        path="/documents/:id/preview"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <DocumentPreviewPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/google-sheets"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <GoogleSheetsPage />
            </ClubRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/google-forms"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <GoogleFormsPage />
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
        path="/global-notifications"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <GlobalNotificationsPage />
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
        path="/finance"
        element={
          <ProtectedRoute>
            <ClubRoute>
              <FinancePage />
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
