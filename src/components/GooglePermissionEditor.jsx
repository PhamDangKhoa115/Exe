import { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, ClipboardList, LoaderCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getGoogleMemberPermissions, updateGooglePermissions } from '../api/googlePermissionApi';
import { getClubMembers } from '../api/clubApi';
import { getApiError } from '../utils/getApiError';
import './GooglePermissionEditor.css';

const GROUPS = {
  sheets: [['canCreateSheet', 'canCreate', 'Create Sheet'], ['canDeleteSheet', 'canDelete', 'Delete Sheet'], ['canEditSheetTitle', 'canEditTitle', 'Edit Sheet Title'], ['canEditSheetData', 'canEditData', 'Edit Sheet Data'], ['canEditSheetType', 'canEditType', 'Edit Sheet Type']],
  forms: [['canCreateForm', 'canCreate', 'Create Form'], ['canDeleteForm', 'canDelete', 'Delete Form'], ['canEditFormTitle', 'canEditTitle', 'Edit Form Title'], ['canEditFormData', 'canEditData', 'Edit Form Data / Questions'], ['canEditFormType', 'canEditType', 'Edit Form Type']],
};
const valid = data => data && !Array.isArray(data) && Object.values(GROUPS).flat().every(([key]) => typeof data[key] === 'boolean');

export default function GooglePermissionEditor({ member, president, clubId, userId, onBusy = () => {}, onUnavailable }) {
  const targetUserId = member?.userId ?? member?.user?.id;
  const [permissions, setPermissions] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(null);
  const request = useRef(0);
  const lock = useRef(false);
  const latest = useRef(null);
  latest.current = { president, clubId, userId, targetUserId };
  const contextMatches = context => {
    const current = latest.current;
    return current.president && String(current.clubId) === String(context.clubId) && String(current.userId) === String(context.userId) && String(current.targetUserId) === String(context.targetUserId) && localStorage.getItem('selectedClubId') === String(context.clubId) && localStorage.getItem('userId') === String(context.userId) && localStorage.getItem('selectedClubRole') === 'PRESIDENT';
  };
  useEffect(() => {
    const version = ++request.current;
    setPermissions(null); setConfirmation(null); setError('');
    if (targetUserId == null || !president || !clubId || !userId) { setLoading(false); return; }
    setLoading(true);
    getGoogleMemberPermissions(targetUserId, { clubId, userId }).then(data => {
      if (version !== request.current) return;
      if (!valid(data) || String(data.clubId) !== String(clubId) || String(data.userId) !== String(targetUserId)) throw new Error('Invalid permissions response.');
      setPermissions(data);
    }).catch(err => { if (version === request.current) setError(getApiError(err, 'Cannot load member permissions.')); })
      .finally(() => { if (version === request.current) setLoading(false); });
    return () => { request.current += 1; };
  }, [targetUserId, president, clubId, userId, reload]);
  const mutate = async (scope, operation, row) => {
    if (!permissions || loading || error || lock.current || !president) return;
    const context = { clubId, userId, targetUserId };
    if (!contextMatches(context)) { onUnavailable?.(); return; }
    const version = request.current;
    const [key, requestKey] = row;
    if ((permissions[key] === true) === (operation === 'grant')) return;
    const body = operation === 'grant' ? { [requestKey]: true } : Object.fromEntries(GROUPS[scope].map(([otherKey, otherRequestKey]) => [otherRequestKey, otherKey === key]));
    lock.current = true; setSaving(key); onBusy(true);
    try {
      // Verify the current actor and recipient against the same club before mutation.
      const data = await getClubMembers(clubId);
      const members = Array.isArray(data) ? data : data?.content ?? data?.members ?? data?.data;
      if (!Array.isArray(members)) throw new Error('Cannot verify club membership.');
      const actor = members.find(m => String(m.userId ?? m.user?.id) === String(userId));
      const recipient = members.find(m => String(m.userId ?? m.user?.id) === String(targetUserId));
      if ((actor?.role ?? actor?.memberRole) !== 'PRESIDENT' || !recipient) {
        onUnavailable?.(); throw new Error('Presidency or member availability has changed.');
      }
      if (version !== request.current || !contextMatches(context)) return;
      await updateGooglePermissions(scope, operation, targetUserId, body, context);
      if (version !== request.current || !contextMatches(context)) return;
      setConfirmation(null);
      const refreshed = await getGoogleMemberPermissions(targetUserId, context);
      if (version !== request.current || !contextMatches(context)) return;
      if (!valid(refreshed) || String(refreshed.clubId) !== String(clubId) || String(refreshed.userId) !== String(targetUserId)) throw new Error('Invalid permissions response.');
      setPermissions(refreshed);
      toast.success(operation === 'grant' ? 'Google permission granted.' : 'Google permission revoked.');
    } catch (err) {
      const message = getApiError(err, err.message || 'Cannot update Google permissions.');
      toast.error(message); if (version === request.current) setError(message);
    } finally { lock.current = false; setSaving(null); onBusy(false); }
  };
  const toggle = (scope, row) => {
    if (!president || loading || saving || error || lock.current || !permissions) return;
    if (permissions[row[0]] === true) setConfirmation({ scope, row });
    else mutate(scope, 'grant', row);
  };
  if (!president) return null;
  const name = permissions?.userFullName ?? member?.fullName ?? member?.user?.fullName ?? member?.name ?? 'Member';
  const email = permissions?.userEmail ?? member?.email ?? member?.user?.email;
  const avatar = member?.avatarUrl ?? member?.user?.avatarUrl;
  return <div className="google-permission-editor">
    <header className="gp-member">{avatar ? <img src={avatar} alt="" /> : <span className="gp-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}<div><strong>{name}</strong>{email && <p>{email}</p>}</div></header>
    {targetUserId == null ? <p className="gp-empty">No valid member selected.</p> : <>
      {loading && <div className="gp-skeleton" role="status" aria-label="Loading permissions">{Array.from({ length: 5 }, (_, i) => <span key={i} />)}</div>}
      {error && <div className="gp-error" role="alert"><AlertCircle size={18} /><p>{error}</p><button type="button" disabled={loading || Boolean(saving)} onClick={() => { setConfirmation(null); setReload(n => n + 1); }}>Retry</button></div>}
      {permissions && <div className="gp-groups">{Object.entries(GROUPS).map(([scope, rows]) => <section key={scope} className="gp-group"><h3>{scope === 'sheets' ? <FileSpreadsheet size={19} /> : <ClipboardList size={19} />}{scope === 'sheets' ? 'Google Sheets' : 'Google Forms'}</h3>{rows.map(row => <div key={row[0]} className="gp-row"><span>{row[2]}</span><div className="gp-control"><small>{permissions[row[0]] ? 'Granted' : 'Not granted'}</small><button type="button" role="switch" aria-label={row[2]} aria-checked={permissions[row[0]] === true} aria-busy={saving === row[0]} disabled={loading || Boolean(saving) || Boolean(error)} onClick={() => toggle(scope, row)} className="gp-switch">{saving === row[0] ? <LoaderCircle size={14} className="gp-spinner" /> : <span />}</button></div></div>)}</section>)}</div>}
    </>}
    {confirmation && <div className="gp-confirm-backdrop" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); if (!saving) setConfirmation(null); } }}><section className="gp-confirm" role="dialog" aria-modal="true" aria-label="Confirm Google permission revocation"><h3>Revoke permission</h3><p>Revoke <strong>{confirmation.row[2]}</strong> from <strong>{name}</strong>?</p><p>Other permissions will remain unchanged.</p>{error && <p role="alert">{error}</p>}<div className="gp-confirm-actions"><button type="button" disabled={Boolean(saving)} onClick={() => setConfirmation(null)}>Cancel</button><button type="button" disabled={Boolean(saving) || Boolean(error)} onClick={() => mutate(confirmation.scope, 'revoke', confirmation.row)}>{saving ? 'Revoking...' : 'Confirm Revoke'}</button></div></section></div>}
  </div>;
}
