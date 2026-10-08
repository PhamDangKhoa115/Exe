import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import GlideSelectField from './reactbits/GlideSelectField';
import { getClubDetail, getClubMembers, transferClubPresident } from '../api/clubApi';
import { ArrowRightLeft, TriangleAlert } from 'lucide-react';
import { getApiError } from '../utils/getApiError';
import './ClubGovernance.css';

export default function ClubGovernance() {
  const [context, setContext] = useState(() => ({ clubId: localStorage.getItem('selectedClubId'), userId: localStorage.getItem('userId'), role: localStorage.getItem('selectedClubRole') }));
  const { clubId, userId } = context;
  const currentContext = () => localStorage.getItem('selectedClubId') === clubId && localStorage.getItem('userId') === userId;
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const generation = useRef(0);
  const [verifiedContext, setVerifiedContext] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [members, setMembers] = useState([]);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  useEffect(() => {
    const sync = () => setContext(previous => {
      const next = { clubId: localStorage.getItem('selectedClubId'), userId: localStorage.getItem('userId'), role: localStorage.getItem('selectedClubRole') };
      return Object.keys(next).every(key => next[key] === previous[key]) ? previous : next;
    });
    const timer = window.setInterval(sync, 500);
    window.addEventListener('storage', sync);
    return () => { window.clearInterval(timer); window.removeEventListener('storage', sync); };
  }, []);
  const load = useCallback(async () => {
    if (!clubId || !userId) return;
    const request = generation.current;
    const [detail, data] = await Promise.all([getClubDetail(clubId), getClubMembers(clubId)]);
    const list = Array.isArray(data) ? data : data?.content || data?.members || data?.data;
    if (!Array.isArray(list)) throw new Error('Member response format is not supported.');
    if (request !== generation.current || localStorage.getItem('selectedClubId') !== clubId || localStorage.getItem('userId') !== userId) return;
    setClub(detail);
    if (detail?.name) localStorage.setItem("selectedClubName", detail.name);
    setMembers(list);
    const requester = list.find(member => String(member.userId ?? member.user?.id) === userId);
    const nextRole = String(requester?.role ?? requester?.memberRole ?? 'MEMBER').toUpperCase();
    setRole(nextRole);
    setVerifiedContext({ clubId, userId });
    if (nextRole !== 'PRESIDENT') setConfirmation(null);
    return list;
  }, [clubId, userId]);
  useEffect(() => {
    let active = true;
    let running = false;
    generation.current += 1;
    setVerifiedContext(null); setRole(''); setClub(null); setMembers([]); setTarget(''); setConfirmation(null); setDeleteName(''); setError('');
    const refresh = async () => {
      if (running || lock.current) return;
      running = true;
      try { await load(); }
      catch (err) {
        if (active) {
          setVerifiedContext(null); setConfirmation(null);
          toast.error(getApiError(err, 'Cannot verify club management permissions.'));
        }
      } finally { running = false; }
    };
    refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => { active = false; generation.current += 1; window.clearInterval(timer); };
  }, [load, context.role]);
  const president = role === 'PRESIDENT' && verifiedContext?.clubId === clubId && verifiedContext?.userId === userId && currentContext();
  const memberId = m => m.memberId ?? m.membershipId ?? m.id;
  const memberUserId = m => m.userId ?? m.user?.id;
  const eligible = members.filter(m => ['ACTIVE', 'APPROVED'].includes(String(m.status ?? m.membershipStatus ?? 'ACTIVE').toUpperCase()) && !m.locked && !m.isLocked && String(memberUserId(m)) !== userId);
  const selected = eligible.find(m => String(memberId(m)) === target);
  const run = async () => {
    if (lock.current || !president || !selected || localStorage.getItem('selectedClubRole') !== context.role) return;
    const request = generation.current;
    lock.current = true; setBusy(true); setError('');
    let transferred = false;
    try {
      const list = await load();
      const requester = list?.find(member => String(memberUserId(member)) === userId);
      if (request !== generation.current || !currentContext() || localStorage.getItem('selectedClubRole') !== context.role) return;
      if (String(requester?.role ?? requester?.memberRole).toUpperCase() !== 'PRESIDENT') throw new Error('Only the current PRESIDENT can manage this club.');
      await transferClubPresident(memberId(selected), Number(clubId));
      transferred = true;
      // The confirmed backend rule demotes the requester; clear stale UI before reads.
      if (currentContext()) localStorage.setItem('selectedClubRole', 'MEMBER');
      if (request !== generation.current || !currentContext()) return;
      setRole('MEMBER');
      setConfirmation(null);
      toast.success('Presidency transferred successfully.');
      await load();
    } catch (err) {
      if (request === generation.current && currentContext()) {
        const message = getApiError(err, err.message || 'Club operation failed.'); setError(message); toast.error(message);
        if (err.response?.status === 403) await load().catch(() => { setVerifiedContext(null); setConfirmation(null); });
      }
    }
    finally {
      lock.current = false; setBusy(false);
      if (transferred && currentContext()) navigate('/home', { replace: true });
    }
  };
  if (!president) return null;
  return <section className="setting-card club-governance">
    <h2>Club Management</h2>
    {error && <p role="alert">{error}</p>}
    <article className="club-governance-transfer">
      <h3><ArrowRightLeft size={20} />Transfer Presidency</h3>
      <p>Transfer the president role to another club member.</p>
      <p>The current president will become a MEMBER. The backend handles the recipient's department role.</p>
      <label htmlFor="club-transfer-member">New president</label>
      <GlideSelectField id="club-transfer-member" value={target} disabled={busy} onChange={e => setTarget(e.target.value)}><option value="">Select a member</option>{eligible.map(m => <option key={memberId(m)} value={memberId(m)}>{m.fullName ?? m.user?.fullName ?? m.name} — {m.email ?? m.user?.email}</option>)}</GlideSelectField>
      <button disabled={busy || !selected} onClick={() => setConfirmation({ operation: 'transfer', message: `Transfer presidency to ${selected.fullName ?? selected.user?.fullName}? You will lose PRESIDENT permissions.` })}>Transfer Presidency</button>
    </article>
    <article className="club-governance-danger">
      <h3><TriangleAlert size={20} />Delete Club</h3>
      <p>Permanently delete this club and its associated data. This action cannot be undone.</p>
      <button className="club-delete-button" disabled={busy || !club?.name} onClick={() => { setDeleteName(''); setConfirmation({ operation: 'delete' }); }}>Delete Club</button>
    </article>
    {confirmation && <div className="club-confirm-backdrop" onClick={() => { if (!busy) setConfirmation(null); }} onKeyDown={e => { if (e.key === 'Escape' && !busy) setConfirmation(null); }}><div className="club-confirm-dialog" role="dialog" aria-modal="true" aria-label={confirmation.operation === 'delete' ? 'Delete Club confirmation' : 'Confirm club operation'} onClick={e => e.stopPropagation()}>
      {confirmation.operation === 'delete' ? <>
        <h2><TriangleAlert size={22} />Delete Club</h2>
        <p>Permanently delete <strong>{club.name}</strong> and its associated data. This action cannot be undone.</p>
        <label htmlFor="club-delete-name">Type the exact club name to confirm: <strong>{club.name}</strong></label>
        <input id="club-delete-name" autoFocus value={deleteName} onChange={e => setDeleteName(e.target.value)} autoComplete="off" disabled={busy} />
        <p role="alert">Club deletion is unavailable until the backend API contract is confirmed.</p>
      </> : <><h2>Confirm operation</h2><p>{confirmation.message}</p></>}
      <div className="club-confirm-actions"><button disabled={busy} onClick={() => setConfirmation(null)}>Cancel</button>{confirmation.operation === 'delete' ? <button className="club-delete-button" disabled title={deleteName === club.name ? 'Awaiting verified Delete Club API contract' : 'Enter the exact club name'}>Delete Club</button> : <button disabled={busy} onClick={run}>{busy ? 'Processing...' : 'Confirm'}</button>}</div>
    </div></div>}
  </section>;
}
