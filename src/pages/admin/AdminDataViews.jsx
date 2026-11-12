import { useContext, useEffect, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { AdminIdentityContext, AdminOverviewContext } from '../../components/AdminRoute';
import GlideSelectField from '../../components/reactbits/GlideSelectField';
import { getAdminDashboard, getAdminAnalytics, getAdminUsers, getAdminClubs, getAdminFeedbacks, getAdminFeedbackSummary, deleteAdminFeedback, deleteAdminUser } from '../../api/adminApi';
import { getApiError } from '../../utils/getApiError';

const finite = value => typeof value === 'number' && Number.isFinite(value);
const count = value => finite(value) && value >= 0;
export const number = value => finite(value) ? value.toLocaleString('en-US') : 'N/A';
export const money = value => finite(value) ? value.toLocaleString('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }) : 'N/A';
export function date(value) { const parsed = value && new Date(value); return parsed && Number.isFinite(parsed.getTime()) ? parsed.toLocaleString('en-US') : 'N/A'; }
const percent = value => finite(value) ? `${value}%` : 'N/A';
function safeImage(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; } }
export function Avatar({ url, name }) { return safeImage(url) ? <img className="admin-data-avatar" src={safeImage(url)} alt="" onError={event => { event.currentTarget.hidden = true; }}/> : <span className="admin-data-avatar admin-data-initial">{name?.slice(0, 1) || '?'}</span>; }
function array(data) { if (!Array.isArray(data) || !data.every(row => row && typeof row === 'object' && !Array.isArray(row))) throw new Error('The server returned an unsupported list response.'); return data; }
function requireFields(data, keys) { if (!data || !keys.every(key => count(data[key]))) throw new Error('The server returned incomplete or invalid statistics.'); return data; }
export function useAdminData(load, dependencies = []) {
  const latest = useRef(load); latest.current = load;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setState({ data: null, loading: true, error: '' });
    Promise.resolve().then(() => latest.current(controller.signal)).then(data => { if (active) setState({ data, loading: false, error: '' }); })
      .catch(error => { if (active && !controller.signal.aborted) setState({ data: null, loading: false, error: getApiError(error, error.message || 'Unable to load administration data.') }); });
    return () => { active = false; controller.abort(); };
  }, [...dependencies, revision]);
  return { ...state, refresh: () => setRevision(value => value + 1) };
}
export function LoadState({ state, children }) {
  return state.loading ? <div className="admin-loading" role="status">Loading administration data...</div> : state.error ? <div className="admin-data-error" role="alert">{state.error} <button onClick={state.refresh}>Retry</button></div> : children;
}
export function Panel({ title, description, children }) { return <article className="admin-panel"><header className="admin-panel-header"><div><h3>{title}</h3>{description && <p>{description}</p>}</div></header>{children}</article>; }
function Stats({ entries }) { return <div className="admin-stat-grid">{entries.map(([title, value]) => <article className="admin-stat-card" key={title}><strong>{value}</strong><h3>{title}</h3></article>)}</div>; }
export function Table({ headings, children, empty, colSpan = headings.length }) { return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{headings.map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{empty ? <tr><td colSpan={colSpan}><div className="admin-table-empty">No results found.</div></td></tr> : children}</tbody></table></div>; }
export function Filter({ label, value, onChange, options }) { return <label className="admin-data-filter">{label}<GlideSelectField aria-label={label} value={value} onChange={event => onChange(event.target.value)}><option value="">All</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</GlideSelectField></label>; }
function useSearch() { const [text, setText] = useState(''), [search, setSearch] = useState(''); useEffect(() => { const timer = setTimeout(() => setSearch(text.trim()), 350); return () => clearTimeout(timer); }, [text]); return { text, setText, search }; }
function Search({ model, label }) { return <label className="admin-data-filter">{label}<input aria-label={label} type="search" value={model.text} onChange={event => model.setText(event.target.value)} placeholder={label}/></label>; }
function Chart({ data, series, kind = 'bar', xKey = 'month', moneyValues = false }) {
  if (!data.length) return <p>No chart data available.</p>;
  const Component = kind === 'line' ? LineChart : BarChart;
  return <div className="admin-chart"><ResponsiveContainer width="100%" height={330}><Component data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey={xKey}/><YAxis/><Tooltip formatter={value => moneyValues ? money(value) : number(value)}/><Legend/>{series.map(([key, name, color]) => kind === 'line' ? <Line key={key} dataKey={key} name={name} stroke={color} type="monotone"/> : <Bar key={key} dataKey={key} name={name} fill={color} radius={[6, 6, 0, 0]}/>)}</Component></ResponsiveContainer></div>;
}
const STAT_LABELS = { totalUsers: 'Total Users', activeUsers: 'Active Users', bannedUsers: 'Banned Users', totalClubs: 'Total Clubs', activeClubs: 'Active Clubs', publicClubs: 'Public Clubs', privateClubs: 'Private Clubs', totalDocuments: 'Total Documents', totalEvents: 'Total Events', totalForms: 'Total Forms', totalSheets: 'Total Sheets' };
function validateOverview(data) {
  requireFields(data?.stats, Object.keys(STAT_LABELS));
  for (const key of ['monthlyResourceUsage', 'currentClubs', 'recentActivities']) array(data[key]);
  if (!data.monthlyResourceUsage.every(row => ['documents','events','forms','sheets'].every(key => count(row[key])))) throw new Error('Invalid resource usage response.');
  return data;
}
export function AdminOverview({ revision, activityOnly = false }) {
  const seed = useContext(AdminOverviewContext);
  const state = useAdminData(async signal => { const initial = seed?.current; if (seed) seed.current = null; return validateOverview(initial ?? await getAdminDashboard(signal)); }, [revision]);
  const data = state.data;
  return <LoadState state={state}>{data && <>
    {!activityOnly && <><Stats entries={Object.entries(STAT_LABELS).map(([key,label]) => [label,number(data.stats[key])])}/><Panel title="Monthly System Usage" description="Documents, events, forms and sheets from the overview API"><Chart data={data.monthlyResourceUsage.map(row=>({...row,month:Number.isInteger(row.monthValue)&&row.monthValue>=1&&row.monthValue<=12&&Number.isInteger(row.year)?new Date(Date.UTC(row.year,row.monthValue-1,1)).toLocaleDateString('en-US',{month:'short',year:'numeric',timeZone:'UTC'}):englishLabel(row.month,'Month unavailable')}))} series={[['documents','Documents','#6d28d9'],['events','Events','#2563eb'],['forms','Forms','#16a34a'],['sheets','Sheets','#f59e0b']]}/></Panel><Panel title="Current Clubs" description="Current clubs supplied by the overview API; this is not the full club directory."><ClubTable clubs={data.currentClubs}/></Panel></>}
    <Panel title="Recent System Activity" description="Dates use English formatting; backend relative-time labels are not used."><div className="admin-activity-list">{data.recentActivities.length ? data.recentActivities.map(row => <div className="admin-activity-item" key={row.id}><Avatar url={row.actorAvatar} name={row.actorName}/><div><p><strong>{row.actorName || 'Unknown actor'}</strong> {englishLabel(row.action,'System activity recorded')}</p><span>{row.targetName}</span><small>{date(row.timestamp)}</small></div></div>) : <p>No recent activities.</p>}</div></Panel>
  </>}</LoadState>;
}
function ClubTable({ clubs }) { return <Table headings={['Club','Visibility','Status','Manager','Members','Documents','Events','Created']} empty={!clubs.length}>{clubs.map(row => <tr key={row.id}><td><div className="admin-club-cell"><Avatar url={row.logoUrl} name={row.name}/><strong>{row.name}</strong></div><p>{row.description}</p></td><td>{row.visibility || 'N/A'}</td><td>{row.status || 'N/A'}</td><td>{row.managerName || 'N/A'}<br/>{row.managerEmail || 'N/A'}</td><td>{number(row.memberCount)}</td><td>{number(row.documentCount)}</td><td>{number(row.eventCount)}</td><td>{date(row.createdAt)}</td></tr>)}</Table>; }

export function AdminClubs({ revision }) {
  const search = useSearch(), [status,setStatus] = useState(''), [visibility,setVisibility] = useState('');
  const state = useAdminData(async signal => array(await getAdminClubs({ search:search.search || undefined,status:status || undefined,visibility:visibility || undefined },signal)),[search.search,status,visibility,revision]);
  return <><div className="admin-data-filters"><Search model={search} label="Search clubs"/><Filter label="Club status" value={status} onChange={setStatus} options={['ACTIVE','INACTIVE']}/><Filter label="Visibility" value={visibility} onChange={setVisibility} options={['PUBLIC','PRIVATE']}/></div><LoadState state={state}>{state.data && <Panel title="Club Management"><ClubTable clubs={state.data}/></Panel>}</LoadState></>;
}
function deleteUserError(error) {
  const status = error.response?.status;
  if ([400, 409].includes(status)) {
    const body = error.response?.data;
    const message = [body?.message, body?.error, typeof body === 'string' ? body : null]
      .filter(value => typeof value === 'string').join(' ');
    if (/cannot delete (yourself|your own account)|không thể tự xóa/i.test(message)) {
      return 'You cannot delete your own account.';
    }
    if (/(president of (an |any )?active club|chủ nhiệm.*(đang hoạt động|hoạt động))/i.test(message)) {
      return 'This user cannot be deleted while serving as president of an active club.';
    }
  }
  if (status === 401 || status === 403) return 'Your administrator access could not be verified.';
  if (status === 404) return 'This account was not found. Refresh the user list.';
  if (status === 400 || status === 409) return 'The server rejected this deletion. Refresh the user list and check the account.';
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'The request timed out. Refresh the user list to check the account before trying again.';
  if (!error.response) return 'The server could not be reached. Refresh the user list to check the account before trying again.';
  return 'The server could not confirm deletion. Refresh the user list to check the account before trying again.';
}

export function AdminUsers({ revision }) {
  const search = useSearch(), [status,setStatus] = useState(''), [provider,setProvider] = useState(''), [selected,setSelected] = useState(null);
  const admin = useContext(AdminIdentityContext);
  const overviewSeed = useContext(AdminOverviewContext);
  const [target, setTarget] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const dialog = useRef(null);
  const trigger = useRef(null);
  const usersRegion = useRef(null);
  const pending = useRef(false);
  const awaitingDeletedUserRefresh = useRef(false);
  const mounted = useRef(false);
  const state = useAdminData(async signal => array(await getAdminUsers({ search:search.search || undefined,status:status || undefined,authProvider:provider || undefined },signal)),[search.search,status,provider,revision]);
  useEffect(()=>setSelected(null),[search.search,status,provider,revision]);
  useEffect(() => {
    if (state.data) awaitingDeletedUserRefresh.current = false;
  }, [state.data]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!target) return;
    const modal = dialog.current;
    modal.showModal();
    modal.querySelector('[data-cancel-delete]').focus();
    return () => {
      modal.close();
      const focusTarget = trigger.current?.isConnected ? trigger.current : usersRegion.current;
      focusTarget?.focus();
    };
  }, [target]);

  function deletionRestriction(userId) {
    if (!admin?.userId || !admin.isCurrent()) return 'Administrator identity could not be verified.';
    if (userId === admin.userId) return 'You cannot delete your own account.';
    if (!Number.isInteger(userId) || userId < 1 || userId > 2147483647) return 'Invalid user ID.';
    return '';
  }

  function openDelete(row, button) {
    if (deletionRestriction(row.userId) || pending.current) return;
    trigger.current = button;
    setDeleteError('');
    setConfirmed(false);
    const fullName = typeof row.fullName === 'string' ? row.fullName.trim() : '';
    const username = typeof row.username === 'string' ? row.username.trim() : '';
    setTarget({
      userId: row.userId,
      name: fullName || username || 'Not available',
      email: typeof row.email === 'string' && row.email.trim() ? row.email.trim() : 'Not available',
    });
  }

  function closeDelete() {
    if (!pending.current) setTarget(null);
  }

  async function removeUser() {
    if (!target || !confirmed || pending.current || deletionRestriction(target.userId)) return;
    pending.current = true;
    setBusy(true);
    setDeleteError('');
    try {
      await deleteAdminUser(target.userId);
      if (!mounted.current || !admin.isCurrent()) return;
      if (overviewSeed) overviewSeed.current = null;
      trigger.current = null;
      setTarget(null);
      setSelected(previous => previous?.userId === target.userId ? null : previous);
      awaitingDeletedUserRefresh.current = true;
      toast.success('User account deleted.');
      state.refresh();
    } catch (error) {
      if (mounted.current && admin.isCurrent()) setDeleteError(deleteUserError(error));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return <section ref={usersRegion} tabIndex={-1} aria-label="User management"><div className="admin-data-filters"><Search model={search} label="Search users"/><Filter label="User status" value={status} onChange={setStatus} options={['ACTIVE','INACTIVE','BANNED']}/><Filter label="Auth provider" value={provider} onChange={setProvider} options={['LOCAL','GOOGLE']}/></div><LoadState state={{
    ...state,
    error: state.error && awaitingDeletedUserRefresh.current
      ? 'The account was deleted, but the user list could not be refreshed.'
      : state.error,
  }}>{state.data && <Panel title="User Management"><Table headings={['User','Email / Phone','Provider','Status','System Role','Joined Clubs','Managed Clubs','Actions']} empty={!state.data.length}>{state.data.map(row => <tr key={row.userId}><td><div className="admin-club-cell"><Avatar url={row.avatarUrl} name={row.fullName}/><strong>{row.fullName}</strong></div>{row.username}<br/>{date(row.createdAt)}</td><td>{row.email}<br/>{row.phoneNumber || 'N/A'}</td><td>{row.authProvider}</td><td>{row.userStatus}</td><td>{row.role}</td><td>{number(row.joinedClubsCount)}</td><td>{number(row.managedClubsCount)}</td><td><button onClick={()=>setSelected(row)}>Membership details</button><button disabled title="Role update payload and authorization require confirmation">Change role</button><button type="button" className="admin-delete-user-action"
      disabled={Boolean(deletionRestriction(row.userId))}
      onClick={event => openDelete(row, event.currentTarget)}><Trash2 size={15} aria-hidden="true"/> Delete User</button>
      {deletionRestriction(row.userId) && <p>{deletionRestriction(row.userId)}</p>}</td></tr>)}</Table></Panel>}</LoadState>{selected && <ConfirmDialog title="Club Memberships" onClose={()=>setSelected(null)}><h4>{selected.fullName}</h4>{Array.isArray(selected.clubs) ? <Table headings={['Club','Club Role','Membership Status','Department']} empty={!selected.clubs.length}>{selected.clubs.map(row=><tr key={row.clubId}><td>{row.clubName}</td><td>{row.role}</td><td>{row.status}</td><td>{row.departmentName || 'N/A'}</td></tr>)}</Table> : <p>Membership details are unavailable.</p>}</ConfirmDialog>}
    {target && <dialog ref={dialog} className="admin-data-modal admin-delete-user-dialog"
      aria-labelledby="admin-delete-user-title" aria-describedby="admin-delete-user-warning"
      onCancel={event => { event.preventDefault(); closeDelete(); }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = [...event.currentTarget.querySelectorAll('input:not(:disabled), button:not(:disabled)')];
        const first = controls[0], last = controls.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }}>
      <h3 id="admin-delete-user-title">Delete User Account</h3>
      <p><strong>Account:</strong> {target.name}<br/>
        <strong>Email:</strong> {target.email}<br/>
        <strong>User ID:</strong> {target.userId}
      </p>
      <p id="admin-delete-user-warning">This permanently deletes the account and removes the user from all clubs they belong to. This action cannot be undone.</p>
      <label className="admin-delete-confirmation">
        <input type="checkbox" checked={confirmed} disabled={busy}
          onChange={event => setConfirmed(event.target.checked)}/>
        <span>I confirm deletion of this account.</span>
      </label>
      {deleteError && <p role="alert">{deleteError}</p>}
      {busy && <p role="status">Deleting user account…</p>}
      <div className="admin-data-actions">
        <button type="button" data-cancel-delete disabled={busy} onClick={closeDelete}>Cancel</button>
        <button type="button" className="admin-delete-user-action" disabled={!confirmed || busy || Boolean(deletionRestriction(target.userId))}
          onClick={removeUser}>Delete Account</button>
      </div>
    </dialog>}
  </section>;
}

const FUNNEL_LABELS = { page_view:'Page Views', view_club:'Club Views', user_register:'Registrations', user_login:'Logins', initiate_transaction:'Checkouts', complete_payment:'Paid Orders', visitors:'Visitors', newUsers:'New Users', checkouts:'Checkouts', paidOrders:'Paid Orders' };
function englishLabel(value, fallback) { return typeof value === 'string' && !/[\u00c0-\u024f\u1e00-\u1eff]/.test(value) ? value : fallback; }
function validateAnalytics(data) {
  requireFields(data?.totals,['trackedEvents','visitors','newUsers','checkouts','paidOrders','revenue']);
  requireFields(data?.subscriptions,['activeMonthly','activeYearly','totalActive','expiringIn30Days','payingUsers']);
  ['funnel','channels','revenueTrend'].forEach(key=>array(data[key]));
  if (!data.revenue || !['weekly','monthly','yearly','period'].every(key=>data.revenue[key] && finite(data.revenue[key].amount))) throw new Error('Invalid revenue response.');
  return data;
}
function TransactionGoal({ goal }) {
  const available = goal && ['targetOrders', 'paidOrders', 'remainingOrders'].every(key => count(goal[key])) && finite(goal.progressPercent) &&
    typeof goal.achieved === 'boolean';
  return <Panel title="Transaction Goal" description="All-time qualifying paid orders reported by the server.">
    {available ? <>
      <Stats entries={[
        ['Transaction Target', number(goal.targetOrders)],
        ['Verified Paid Orders (All Time)', number(goal.paidOrders)],
        ['Remaining Orders', number(goal.remainingOrders)],
        ['Progress', percent(goal.progressPercent)],
      ]}/>
      <progress className="admin-goal-progress" max={100} value={Math.min(100, Math.max(0, goal.progressPercent))}
        aria-label="Transaction goal progress"/>
      <p className="admin-goal-status">Goal Status: {goal.achieved ? 'Achieved' : 'In Progress'}</p>
    </> : <p>Transaction goal data is unavailable.</p>}
  </Panel>;
}

function ReviewsAndRetention({ reviews }) {
  const coverage = reviews?.reviewCoveragePercent;
  return <Panel title="Customer Reviews & Retention"
    description="Repeat purchase rate is the percentage of paying customers who made at least two paid purchases.">
    {reviews && typeof reviews === 'object' && !Array.isArray(reviews) ? <>
      <Stats entries={[
        ['Total Reviews', number(reviews.totalReviews)],
        ['Verified Reviews', number(reviews.verifiedReviews)],
        ['Average Rating', number(reviews.averageRating)],
        ['Paying Customers', number(reviews.payingCustomers)],
        ['Review Coverage', percent(coverage)],
        ['Repeat Paying Customers', number(reviews.repeatPayingCustomers)],
        ['Repeat Purchase Rate', percent(reviews.repeatPurchaseRate)],
      ]}/>
      <p>Review coverage target: 50%. Reported coverage: {percent(coverage)}.</p>
      {count(coverage) && <progress className="admin-goal-progress" max={100} value={Math.min(100, coverage)}
        aria-label="Review coverage on a 0 to 100 percent scale, target 50 percent"/>}
    </> : <p>Review and retention data is unavailable.</p>}
  </Panel>;
}

const packageNames = new Map([['MONTHLY', 'Monthly Plan'], ['YEARLY', 'Yearly Plan']]);

function SubscriptionSales({ sales }) {
  const packages = Array.isArray(sales?.byPackage) && sales.byPackage.every(row =>
    row && typeof row === 'object' && !Array.isArray(row)) ? sales.byPackage : null;
  return <Panel title="Subscription Sales" description="Subscription sales reported for the selected period.">
    {sales && typeof sales === 'object' && !Array.isArray(sales) ? <>
      <Stats entries={[
        ['Paid Subscription Orders', number(sales.paidOrders)],
        ['Subscription Revenue', money(sales.revenue)],
        ['New Subscriptions', number(sales.newSubscriptions)],
        ['Renewals', number(sales.renewals)],
        ['Paying Clubs', number(sales.payingClubs)],
      ]}/>
      {packages ? <Table headings={['Package', 'Billing Cycle', 'Paid Orders', 'New Subscriptions', 'Renewals', 'Revenue']}
        empty={!packages.length}>
        {packages.map((row, index) => <tr key={row.packageId ?? index}>
          <td>{englishLabel(row.name, '') || packageNames.get(row.code) || englishLabel(row.code, 'N/A')}</td>
          <td>{englishLabel(row.cycle, 'N/A')}</td>
          <td>{number(row.paidOrders)}</td><td>{number(row.newSubscriptions)}</td>
          <td>{number(row.renewals)}</td><td>{money(row.revenue)}</td>
        </tr>)}
      </Table> : <p>Package breakdown is unavailable.</p>}
    </> : <p>Subscription sales data is unavailable.</p>}
  </Panel>;
}

function channelLabel(value) {
  return typeof value === 'string' && value.trim() ? value : 'Unspecified';
}

export function AdminAnalytics({ revision }) {
  const [days,setDays]=useState(30);
  const state=useAdminData(async signal=>validateAnalytics(await getAdminAnalytics(days,signal)),[days,revision]);const data=state.data;
  return <><label className="admin-data-filter">Reporting period<GlideSelectField aria-label="Reporting period" value={days} onChange={event=>setDays(Number(event.target.value))}>{[7,30,90,365].map(value=><option key={value} value={value}>{value} days</option>)}</GlideSelectField></label><LoadState state={state}>{data && <>
    <p>{data.days} days · {date(data.from)} – {date(data.to)}</p>
    <TransactionGoal goal={data.transactionGoal}/>
    <Panel title="Business KPIs" description="Paid orders and revenue reflect the selected reporting period.">
      <Stats entries={[
        ['Tracked Events', number(data.totals.trackedEvents)],
        ['Visitors', number(data.totals.visitors)],
        ['New Users', number(data.totals.newUsers)],
        ['Checkouts', number(data.totals.checkouts)],
        ['Paid Orders (Selected Period)', number(data.totals.paidOrders)],
        ['Total Revenue (Selected Period)', money(data.totals.revenue)],
        ['Total Users', number(data.totals.totalUsers)],
        ['Paying Customers', number(data.totals.payingCustomers)],
        ['Average Order Value', money(data.totals.averageOrderValue)],
      ]}/>
    </Panel>
    <Panel title="Conversion Funnel"><Table headings={['Step','Unit','Count','From Previous','From Start']} empty={!data.funnel.length}>{data.funnel.map(row=><tr key={row.step}><td>{FUNNEL_LABELS[row.step] || englishLabel(row.label,row.step)}</td><td>{({người:'People','lượt':'Events','đơn':'Orders'})[row.unit] || englishLabel(row.unit,'Unit unavailable')}</td><td>{number(row.count)}</td><td>{percent(row.conversionFromPrevious)}</td><td>{percent(row.conversionFromStart)}</td></tr>)}</Table></Panel>
    <Panel title="UTM Channels">
      <Table headings={['Source', 'Medium', 'Visitors', 'New Users', 'Checkouts', 'Paid Orders', 'Conversion Rate', 'Revenue', 'Average Order Value']}
        empty={!data.channels.length}>
        {data.channels.map((row, index) => <tr key={index}>
          <td>{channelLabel(row.source)}</td><td>{channelLabel(row.medium)}</td>
          <td>{number(row.visitors)}</td><td>{number(row.newUsers)}</td>
          <td>{number(row.checkouts)}</td><td>{number(row.paidOrders)}</td>
          <td>{percent(row.conversionRate)}</td><td>{money(row.revenue)}</td>
          <td>{money(row.averageOrderValue)}</td>
        </tr>)}
      </Table>
    </Panel>
    <Panel title="Revenue Overview"><div className="admin-stat-grid">{[['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly'],['period','Selected Period']].map(([key,label])=>{const row=data.revenue[key];return <article className="admin-stat-card" key={key}><h4>{label}</h4><strong>{money(row.amount)}</strong><p>{date(row.from)} – {date(row.to)}</p><p>Paid Orders: {number(row.paidOrders)}</p><p>Previous: {money(row.previousAmount)}</p><p>Growth: {percent(row.growthPercent)}</p></article>})}</div></Panel>
    <Panel title="Revenue Trend" description={`Granularity: ${englishLabel(data.trendGranularity,'Unavailable')}`}><Chart data={data.revenueTrend.map(row=>({...row,label:englishLabel(row.label,row.bucket)}))} xKey="label" kind="line" moneyValues series={[["amount","Revenue","#6d28d9"]]}/><Table headings={['Period','Revenue','Paid Orders']} empty={!data.revenueTrend.length}>{data.revenueTrend.map(row=><tr key={row.bucket}><td>{englishLabel(row.label,row.bucket)}</td><td>{money(row.amount)}</td><td>{number(row.paidOrders)}</td></tr>)}</Table></Panel>
    <Panel title="Subscriptions"><Stats entries={Object.entries({activeMonthly:'Active Monthly',activeYearly:'Active Yearly',totalActive:'Total Active',expiringIn30Days:'Expiring in 30 Days',payingUsers:'Paying Users'}).map(([key,label])=>[label,number(data.subscriptions[key])])}/></Panel>
    <ReviewsAndRetention reviews={data.reviews}/>
    <SubscriptionSales sales={data.subscriptionSales}/>
  </>}</LoadState></>;
}

export const RATING_LABELS={1:'Very Poor',2:'Poor',3:'Average',4:'Good',5:'Excellent'};
export function ConfirmDialog({ title, busy=false, onClose, children }) { return <div className="admin-data-modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}} onKeyDown={event=>{if(event.key==='Escape'&&!busy)onClose()}}><section className="admin-data-modal" role="dialog" aria-modal="true" aria-label={title}><header><h3>{title}</h3><button disabled={busy} aria-label="Close dialog" onClick={onClose}>Close</button></header>{children}</section></div>; }
export function AdminFeedback({ revision }) {
  const [rating,setRating]=useState(''),[page,setPage]=useState(0),[refreshKey,setRefreshKey]=useState(0),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false);const lock=useRef(false),active=useRef(false);
  useEffect(()=>{active.current=true;return()=>{active.current=false}},[]);
  const list=useAdminData(async signal=>{const data=await getAdminFeedbacks({rating:rating?Number(rating):undefined,page,size:20},signal);if(!data||!Number.isInteger(data.totalPages)||data.totalPages<0||!count(data.totalElements)||!Number.isInteger(data.page)||data.page<0||!Number.isInteger(data.size)||data.size<1||data.size>100)throw new Error('Invalid feedback page response.');array(data.content);if(!data.content.every(row=>Number.isSafeInteger(row.id)&&row.id>0&&Number.isInteger(row.rating)&&row.rating>=1&&row.rating<=5))throw new Error('Invalid feedback records.');return data},[rating,page,refreshKey,revision]);
  const summary=useAdminData(async signal=>{const data=await getAdminFeedbackSummary(signal);requireFields(data,['totalFeedbacks','averageRating']);requireFields(data.ratingCounts,['1','2','3','4','5']);return data},[refreshKey,revision]);
  useEffect(()=>{if(list.data?.totalPages>0&&page>=list.data.totalPages)setPage(list.data.totalPages-1);else if(list.data?.totalPages===0&&page>0)setPage(0);else if(list.data&&list.data.page!==page&&list.data.page<list.data.totalPages)setPage(list.data.page)},[list.data]);
  const remove=async()=>{if(lock.current||!selected)return;lock.current=true;setBusy(true);try{await deleteAdminFeedback(selected.id);if(!active.current)return;setSelected(null);setRefreshKey(value=>value+1);toast.success('Feedback deleted successfully.');}catch(error){if(active.current)toast.error(getApiError(error,'Unable to delete feedback.'));}finally{lock.current=false;if(active.current)setBusy(false)}};
  return <><LoadState state={summary}>{summary.data && <Panel title="Feedback Summary"><Stats entries={[["Total Feedbacks",number(summary.data.totalFeedbacks)],["Average Rating",number(summary.data.averageRating)]]}/><Chart data={[1,2,3,4,5].map(value=>({rating:`${value} stars`,count:summary.data.ratingCounts[String(value)]}))} xKey="rating" series={[["count","Feedbacks","#6d28d9"]]}/><div className="admin-data-distribution">{[1,2,3,4,5].map(value=><p key={value}>{value} stars — {RATING_LABELS[value]}: <strong>{number(summary.data.ratingCounts[String(value)])}</strong></p>)}</div></Panel>}</LoadState>
    <Filter label="Rating" value={rating} onChange={value=>{setRating(value);setPage(0)}} options={['1','2','3','4','5']}/><LoadState state={list}>{list.data && <Panel title="Feedback Management"><Table headings={['User','Rating','Comment','Created','Purchase Verification','Order Code','Actions']} empty={!list.data.content.length}>{list.data.content.map(row=><tr key={row.id}><td><div className="admin-club-cell"><Avatar url={row.avatarUrl} name={row.fullName}/>{row.fullName}</div>{row.email}</td><td><span aria-label={`${row.rating} out of 5 stars`}>{Number.isInteger(row.rating)&&row.rating>=1&&row.rating<=5?'★'.repeat(row.rating):'N/A'}</span><br/>{RATING_LABELS[row.rating]||'Unknown rating'}</td><td className="admin-data-comment">{row.comment || 'No comment'}</td><td>{date(row.createdAt)}</td><td>{row.verified === true ? <strong className="admin-goal-status">Verified Purchase</strong> : '—'}</td><td>{/^\d+$/.test(String(row.orderCode ?? '')) ? row.orderCode : '—'}</td><td><button disabled={busy} onClick={()=>setSelected(row)}>Delete feedback</button></td></tr>)}</Table><div className="admin-data-pagination"><span>{list.data.totalElements} feedbacks · Page {list.data.totalPages?list.data.page+1:0} / {list.data.totalPages}</span><button disabled={busy||page===0} onClick={()=>setPage(value=>value-1)}>Previous</button><button disabled={busy||page+1>=list.data.totalPages} onClick={()=>setPage(value=>value+1)}>Next</button></div></Panel>}</LoadState>
    {selected && <ConfirmDialog title="Delete Feedback" busy={busy} onClose={()=>setSelected(null)}><p>Permanently delete this feedback from {selected.fullName}? This destructive action cannot be undone.</p><p className="admin-data-comment">{selected.comment}</p><div className="admin-data-actions"><button disabled={busy} onClick={()=>setSelected(null)}>Cancel</button><button disabled={busy} onClick={remove}>{busy?'Deleting...':'Confirm Delete'}</button></div></ConfirmDialog>}
  </>;
}
