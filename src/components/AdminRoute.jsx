import { createContext, useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getAdminDashboard } from '../api/adminApi';
import { getUserProfile } from '../api/userApi';
import { getApiError } from '../utils/getApiError';

export const AdminOverviewContext = createContext(null);

export default function AdminRoute({ children }) {
  const [access, setAccess] = useState({ state: 'loading' });
  const [revision, setRevision] = useState(0);
  const overviewSeed = useRef(null);
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const systemRole = localStorage.getItem('systemRole');
  const identity = `${token}:${userId}`;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let expiryTimer;
    const invalidate = status => {
      if (status === 401) { localStorage.removeItem('token'); localStorage.removeItem('systemRole'); }
      setAccess({ state: status === 401 ? 'login' : 'denied', identity });
    };
    const onAccess = event => { if (active) invalidate(event.detail.status); };
    const onStorage = () => setRevision(value => value + 1);
    window.addEventListener('sclub-admin-access', onAccess);
    window.addEventListener('storage', onStorage);
    setAccess({ state: 'loading', identity });
    async function verify() {
      if (!token || !userId) { setAccess({ state: 'login', identity }); return; }
      if (systemRole === 'USER') { setAccess({ state: 'denied', identity }); return; }
      // Expiry is a client-side hint only. The Admin endpoint still verifies the token.
      try {
        const payload = JSON.parse(atob(token.replace(/^Bearer /, '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (Number.isFinite(payload.exp)) {
          const remaining = payload.exp * 1000 - Date.now();
          if (remaining <= 0) { invalidate(401); return; }
          expiryTimer = setTimeout(() => invalidate(401), Math.min(remaining, 2147483647));
        }
      } catch { /* Opaque/malformed tokens must be accepted or rejected by the backend. */ }
      try {
        const profile = await getUserProfile(userId, controller.signal);
        if (!active) return;
        if (profile?.role && profile.role !== 'ADMIN') { invalidate(403); return; }
        const overview = await getAdminDashboard(controller.signal);
        if (!active || localStorage.getItem('token') !== token || localStorage.getItem('userId') !== userId) return;
        overviewSeed.current = overview;
        setAccess({ state: 'allowed', identity, overview });
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        if ([401, 403].includes(error.response?.status)) invalidate(error.response.status);
        else setAccess({ state: 'error', identity, message: getApiError(error, 'Unable to verify administrator access.') });
      }
    }
    verify();
    return () => { active = false; controller.abort(); clearTimeout(expiryTimer); window.removeEventListener('sclub-admin-access', onAccess); window.removeEventListener('storage', onStorage); };
  }, [token, userId, systemRole, identity, revision]);
  if (!token || access.state === 'login') return <Navigate to="/login" replace/>;
  if (systemRole === 'USER' || access.state === 'denied') return <Navigate to="/select-club" replace state={{ adminAccessDenied: true }}/>;
  if (access.state === 'error') return <main className="admin-loading"><p role="alert">{access.message}</p><button onClick={() => setRevision(value => value + 1)}>Retry access check</button><Link to="/select-club">Return to club selection</Link></main>;
  if (access.state !== 'allowed' || access.identity !== identity) return <main className="admin-loading" role="status">Verifying administrator access...</main>;
  return <AdminOverviewContext.Provider value={overviewSeed}>{children}</AdminOverviewContext.Provider>;
}
