import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { X, Plus, Bell } from 'lucide-react';
import { getClubMembers } from '../api/clubApi';
import { getFundCampaigns, getFundCampaignDetail, getFundContributions, createFundCampaign, quickTickContribution, submitFundProof, remindFundCampaign } from '../api/fundCampaignApi';
import { getApiError } from '../utils/getApiError';
import './FundCampaignPanel.css';

const EMPTY = { title: '', amountPerMember: '', deadline: '', bankAccountInfo: '', description: '' };
const idValid = id => Number.isSafeInteger(Number(id)) && Number(id) > 0;
const money = value => Number.isFinite(value) ? value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : '—';
const date = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleString('vi-VN') : '—';
function safeUrl(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; } }
function campaignValid(data, clubId) {
  return data && idValid(data.id) && String(data.clubId) === String(clubId) && typeof data.title === 'string' && ['amountPerMember','totalMembers','paidMembers','totalCollected','targetAmount'].every(key => Number.isFinite(data[key]));
}
function normalizeMembers(data) {
  const list = Array.isArray(data) ? data : data?.content || data?.members || data?.data;
  if (!Array.isArray(list)) throw new Error('Cannot verify club permissions.');
  return list;
}

export default function FundCampaignPanel({ clubId, userId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [role, setRole] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [campaignId, setCampaignId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [scopeWarning, setScopeWarning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [proof, setProof] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const mounted = useRef(false), lock = useRef(false), mutationController = useRef(null);
  const matches = useCallback(() => mounted.current && String(clubId) === localStorage.getItem('selectedClubId') && String(userId) === localStorage.getItem('userId'), [clubId, userId]);
  const manager = ['PRESIDENT','TREASURER'].includes(role);
  const member = ['PRESIDENT','TREASURER','MEMBER'].includes(role);
  const visibleContributions = manager ? contributions : role === 'MEMBER' ? contributions.filter(row => String(row.userId) === String(userId)) : [];
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; mutationController.current?.abort(); };
  }, []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setListLoading(true); setListError('');
    Promise.all([getFundCampaigns(clubId, controller.signal), getClubMembers(clubId)]).then(([data, members]) => {
      if (!active || !matches()) return;
      if (!Array.isArray(data) || !data.every(row => campaignValid(row, clubId))) throw new Error('Invalid fund campaign list response.');
      const actor = normalizeMembers(members).find(row => String(row.userId ?? row.user?.id) === String(userId));
      const nextRole = String(actor?.role ?? actor?.memberRole ?? '').toUpperCase();
      setRole(nextRole);
      setCampaigns(data);
      if (!['PRESIDENT','TREASURER','MEMBER'].includes(nextRole)) { setCreating(false); setProof(null); setConfirmation(null); }
    }).catch(err => { if (active && matches()) { setRole(null); setListError(getApiError(err, err.message || 'Cannot load fund campaigns.')); } })
      .finally(() => { if (active && matches()) setListLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [clubId, userId, revision, matches]);
  useEffect(() => {
    setDetail(null); setContributions([]); setDetailError(''); setScopeWarning(false); setProof(null);
    if (!campaignId || !role) return;
    let active = true;
    const controller = new AbortController();
    setDetailLoading(true);
    Promise.all([getFundCampaignDetail(clubId, campaignId, controller.signal), getFundContributions(clubId, campaignId, controller.signal)]).then(([data, rows]) => {
      if (!active || !matches()) return;
      if (!campaignValid(data, clubId) || String(data.id) !== String(campaignId) || !Array.isArray(rows) || !rows.every(row => idValid(row.id) && idValid(row.userId) && String(row.campaignId) === String(campaignId) && typeof row.status === 'string')) throw new Error('Invalid campaign detail or contributions response.');
      setDetail(data);
      const scoped = role === 'MEMBER' ? rows.filter(row => String(row.userId) === String(userId)) : ['PRESIDENT','TREASURER'].includes(role) ? rows : [];
      setContributions(scoped);
      setScopeWarning(role === 'MEMBER' && scoped.length !== rows.length);
    }).catch(err => { if (active && matches()) setDetailError(getApiError(err, err.message || 'Cannot load campaign details.')); })
      .finally(() => { if (active && matches()) setDetailLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [campaignId, clubId, userId, role, revision, matches]);
  const refresh = () => setRevision(value => value + 1);
  const closeDetail = () => { if (!lock.current) { setCampaignId(null); setProof(null); setConfirmation(null); } };
  const prepareCreate = () => {
    if (!manager || lock.current) return;
    const amount = Number(form.amountPerMember), deadline = new Date(form.deadline);
    if (!form.title.trim() || !form.bankAccountInfo.trim() || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(deadline.getTime()) || deadline.getTime() <= Date.now()) { toast.error('Enter a title, positive amount, future deadline and bank account information.'); return; }
    setConfirmation({ type: 'create', body: { title: form.title.trim(), amountPerMember: amount, deadline: deadline.toISOString(), bankAccountInfo: form.bankAccountInfo.trim(), description: form.description.trim() } });
  };
  const run = async action => {
    if (lock.current || !matches() || !member) return;
    if (action.type !== 'proof' && !manager) return;
    if (action.type === 'proof' && (!safeUrl(action.url) || !contributions.some(row => String(row.id) === String(action.contribId) && String(row.userId) === String(userId)))) { toast.error('Only your own contribution can receive a valid HTTP/HTTPS proof URL.'); return; }
    lock.current = true; setBusy(true);
    const controller = new AbortController(); mutationController.current = controller;
    try {
      const members = normalizeMembers(await getClubMembers(clubId));
      if (!matches()) return;
      const actor = members.find(row => String(row.userId ?? row.user?.id) === String(userId));
      const currentRole = String(actor?.role ?? actor?.memberRole ?? '').toUpperCase();
      setRole(currentRole);
      const allowed = action.type === 'proof' ? ['PRESIDENT','TREASURER','MEMBER'].includes(currentRole) : ['PRESIDENT','TREASURER'].includes(currentRole);
      if (!allowed) { setCreating(false); setProof(null); setConfirmation(null); throw new Error('Your current club role cannot perform this action.'); }
      if (action.type === 'create') await createFundCampaign(clubId, action.body, controller.signal);
      else if (action.type === 'tick') await quickTickContribution(clubId, action.contribId, action.isPaid, controller.signal);
      else if (action.type === 'proof') await submitFundProof(clubId, campaignId, action.url.trim(), controller.signal);
      else if (action.type === 'remind') await remindFundCampaign(clubId, campaignId, controller.signal);
      if (!matches()) return;
      setConfirmation(null); setProof(null);
      if (action.type === 'create') { setCreating(false); setForm(EMPTY); }
      toast.success(action.type === 'remind' ? 'Reminder request completed.' : 'Fund campaign updated successfully.');
      refresh();
    } catch (err) {
      if (matches()) {
        toast.error(getApiError(err, err.message || 'Fund campaign operation failed.'));
        if (err.response?.status === 403) { setConfirmation(null); setProof(null); setCreating(false); setRole(null); refresh(); }
      }
    } finally { lock.current = false; if (matches()) setBusy(false); }
  };
  return <article className="finance-panel fund-campaign-panel">
    <div className="finance-panel-header"><div><h2>Fund Campaigns</h2><p>Club fund collection and member contributions</p></div>{manager && <button className="finance-create-button" disabled={busy || listLoading} onClick={() => { setForm(EMPTY); setCreating(true); }}><Plus size={16}/>Create Campaign</button>}</div>
    {listLoading ? <p className="finance-api-skeleton">Loading fund campaigns...</p> : listError ? <p role="alert">{listError} <button onClick={refresh}>Retry campaigns</button></p> : campaigns.length ? <div className="fund-campaign-grid">{campaigns.map(row => <section className="fund-campaign-card" key={row.id}><h3>{row.title}</h3><CampaignInfo campaign={row}/><button disabled={busy} onClick={() => { setConfirmation(null); setCampaignId(row.id); }}>View Details</button></section>)}</div> : <p>No fund campaigns yet.</p>}
    {campaignId && <FundDialog title="Campaign Details" busy={busy} onClose={closeDetail} wide>
      {detailLoading ? <p className="finance-api-skeleton">Loading campaign details...</p> : detailError ? <p role="alert">{detailError} <button onClick={refresh}>Retry details</button></p> : detail && <>
        <h3>{detail.title}</h3><CampaignInfo campaign={detail}/><p>{detail.description}</p><h4>Bank transfer information</h4><p className="fund-bank-info">{detail.bankAccountInfo || 'Not provided'}</p>
        {manager && <button disabled={busy} onClick={() => setConfirmation({ type: 'remind' })}><Bell size={16}/>Remind Unpaid Members</button>}
        {scopeWarning && <p role="status">Only your contribution is shown. The API returned additional records; server-side member filtering needs verification.</p>}
        <h4>Contributions</h4>{!visibleContributions.length ? <p>No contributions available.</p> : <div className="fund-contributions">{visibleContributions.map(row => <section className="fund-contribution" key={row.id}>
          <div className="fund-member">{safeUrl(row.avatarUrl) ? <img src={safeUrl(row.avatarUrl)} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }}/> : <span className="fund-avatar">{row.fullName?.slice(0,1) || '?'}</span>}<div><strong>{row.fullName || 'Member'}</strong><p>{row.email || '—'}</p></div></div>
          <div><span className="fund-status">{row.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL · Pending verification' : row.status}</span><p>Paid: {date(row.paidAt)}</p></div>
          <div>{safeUrl(row.proofImageUrl) ? <a href={safeUrl(row.proofImageUrl)} target="_blank" rel="noopener noreferrer"><img className="fund-proof" src={safeUrl(row.proofImageUrl)} alt={`Payment proof for ${row.fullName || 'member'}`} loading="lazy"/>View proof</a> : <span>No proof submitted</span>}</div>
          <div className="fund-row-actions">{manager && <><button disabled={busy} onClick={() => setConfirmation({ type: 'tick', contribId: row.id, isPaid: true, name: row.fullName })}>Mark paid</button><button disabled={busy} onClick={() => setConfirmation({ type: 'tick', contribId: row.id, isPaid: false, name: row.fullName })}>Mark unpaid</button></>}{member && String(row.userId) === String(userId) && <button disabled={busy} onClick={() => setProof({ contribId: row.id, url: '' })}>Submit Proof</button>}</div>
        </section>)}</div>}
      </>}
    </FundDialog>}
    {creating && manager && <FundDialog title="Create Fund Campaign" busy={busy} onClose={() => { setCreating(false); setConfirmation(null); }}>
      <fieldset disabled={busy} className="fund-form">{[['title','Campaign title','text'],['amountPerMember','Amount per member','number'],['deadline','Payment deadline','datetime-local'],['bankAccountInfo','Bank account information','text'],['description','Description','text']].map(([key,label,type]) => <label key={key}>{label}<input type={type} min={key === 'amountPerMember' ? '1' : undefined} value={form[key]} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))}/></label>)}</fieldset><button disabled={busy} onClick={prepareCreate}>Review Campaign</button>
    </FundDialog>}
    {proof && member && <FundDialog title="Submit Payment Proof" busy={busy} onClose={() => setProof(null)}><label className="fund-proof-label">Proof image URL<input type="url" value={proof.url} disabled={busy} onChange={event => setProof(previous => ({ ...previous, url: event.target.value }))}/></label><p>Use an HTTP/HTTPS image URL. Direct file upload is not available.</p><button disabled={busy} onClick={() => run({ type: 'proof', ...proof })}>{busy ? 'Submitting...' : 'Submit Proof URL'}</button></FundDialog>}
    {confirmation && manager && <FundDialog title="Confirm Fund Action" busy={busy} onClose={() => setConfirmation(null)}>
      <p>{confirmation.type === 'create' ? `Create “${confirmation.body.title}”? This may automatically send notifications or emails to club members.` : confirmation.type === 'remind' ? 'Send reminder emails to unpaid members of this campaign?' : `Mark ${confirmation.name || 'this member'} as ${confirmation.isPaid ? 'paid' : 'unpaid'}? This manually updates collection status; it is not a separate proof approval.`}</p><div className="fund-row-actions"><button disabled={busy} onClick={() => setConfirmation(null)}>Cancel</button><button disabled={busy} onClick={() => run(confirmation)}>{busy ? 'Processing...' : 'Confirm'}</button></div>
    </FundDialog>}
  </article>;
}

function CampaignInfo({ campaign }) {
  const percent = campaign.targetAmount > 0 ? Math.max(0, Math.min(100, campaign.totalCollected / campaign.targetAmount * 100)) : 0;
  return <div className="fund-campaign-info"><p>Deadline: {date(campaign.deadline)}</p><p>Per member: {money(campaign.amountPerMember)}</p><p>Created by: {campaign.createdByName || '—'}</p><p>Collected: {money(campaign.totalCollected)} / {money(campaign.targetAmount)}</p><p>Paid members: {campaign.paidMembers} / {campaign.totalMembers}</p><progress max="100" value={percent} aria-label="Collection progress"/><span>{percent.toFixed(1)}%</span></div>;
}
function FundDialog({ title, busy, onClose, wide, children }) {
  return <div className="fund-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }} onKeyDown={event => { if (event.key === 'Escape' && !busy) { event.stopPropagation(); onClose(); } }}><section className={`fund-modal ${wide ? 'fund-modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button disabled={busy} aria-label={`Close ${title}`} onClick={onClose}><X size={20}/></button></header>{children}</section></div>;
}
