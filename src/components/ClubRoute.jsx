import { Navigate } from "react-router-dom";

export default function ClubRoute({ children }) {
  const selectedClubId = localStorage.getItem("selectedClubId");

  if (!selectedClubId) {
    return <Navigate to="/select-club" replace />;
  }

  return children;
}
