import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, trackClubVisit } from "../utils/analytics";
export default function AnalyticsTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
    const publicPage = ['/', '/login', '/register', '/privacy', '/terms', '/forgot-password', '/reset-password', '/select-club', '/create-club', '/admin'].includes(pathname);
    trackClubVisit(!publicPage);
  }, [pathname]);
  return null;
}
