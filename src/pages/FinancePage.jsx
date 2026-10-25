import GlideSelectField from "../components/reactbits/GlideSelectField";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { getClubMembers } from "../api/clubApi";
import { getFinanceSummary, getFinanceOverview, getFinanceCategories, getFinanceTransactions, createFinanceTransaction, getFinanceTransaction, updateFinanceTransaction, updateFinanceTransactionStatus, exportFinance } from "../api/financeApi";
import { getApiError } from "../utils/getApiError";
import "./FinancePage.api.css";
import FundCampaignPanel from "../components/FundCampaignPanel";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Download,
  Edit3,
  Filter,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles.css";

const EMPTY_FORM = {
  title: "",
  category: "OTHER",
  type: "EXPENSE",
  amount: "",
  status: "PENDING",
};

export default function FinancePage() {
  const [context, setContext] = useState(() => ({ clubId: localStorage.getItem('selectedClubId'), userId: localStorage.getItem('userId') }));
  const { clubId, userId } = context;
  const [transactions, setTransactions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [pagination, setPagination] = useState({ totalPages: 0, totalElements: 0 });
  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [loadedContext, setLoadedContext] = useState('');
  const [revision, setRevision] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [exporting, setExporting] = useState(false);
  const editRead = useRef(null);
  const [editLoading, setEditLoading] = useState(false);
  const lock = useRef(false);
  const exportLock = useRef(false);
  const identity = `${clubId}:${userId}`;
  const isCurrent = () => localStorage.getItem('selectedClubId') === clubId && localStorage.getItem('userId') === userId;
  useEffect(() => {
    const sync = () => setContext(previous => {
      const next = { clubId: localStorage.getItem('selectedClubId'), userId: localStorage.getItem('userId') };
      return previous.clubId === next.clubId && previous.userId === next.userId ? previous : next;
    });
    const timer = setInterval(sync, 500);
    window.addEventListener('storage', sync);
    return () => { clearInterval(timer); window.removeEventListener('storage', sync); };
  }, []);
  useEffect(() => { const timer = setTimeout(() => { setSearch(searchText.trim()); setPage(0); }, 350); return () => clearTimeout(timer); }, [searchText]);
  useEffect(() => { setPage(0); setShowModal(false); setConfirmation(null); setEditingTransaction(null); setEditLoading(false); setForm(EMPTY_FORM); }, [identity]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true); setRole(null); setErrors({}); setSummary(null); setOverview([]); setCategories([]); setTransactions([]);
    const apply = async (key, request, update) => {
      try { const data = await request(); if (active && localStorage.getItem('selectedClubId') === clubId && localStorage.getItem('userId') === userId) update(data); }
      catch (err) { if (active) setErrors(previous => ({ ...previous, [key]: getApiError(err, err.message || 'Cannot load finance data.') })); }
    };
    Promise.all([
      apply('summary', () => getFinanceSummary(clubId, controller.signal), data => {
        if (!data || !['currentBalance', 'totalIncome', 'totalExpense', 'incomeGrowthPercentage', 'expenseGrowthPercentage', 'pendingTransactionsCount'].every(key => Number.isFinite(data[key]))) throw new Error('Invalid finance summary response.');
        setSummary(data);
      }),
      apply('chart', () => getFinanceOverview(clubId, 6, controller.signal), data => {
        if (!Array.isArray(data?.labels) || !Array.isArray(data.incomeData) || !Array.isArray(data.expenseData) || data.labels.length !== data.incomeData.length || data.labels.length !== data.expenseData.length || ![...data.incomeData, ...data.expenseData].every(Number.isFinite)) throw new Error('Invalid overview chart response.');
        setOverview(data.labels.map((label, i) => ({ label, income: data.incomeData[i], expense: data.expenseData[i] })));
      }),
      apply('categories', () => getFinanceCategories(clubId, controller.signal), data => {
        if (!Array.isArray(data) || !data.every(row => typeof row.category === 'string' && Number.isFinite(row.totalAmount) && Number.isFinite(row.percentage))) throw new Error('Invalid category response.');
        setCategories(data);
      }),
      apply('transactions', () => getFinanceTransactions(clubId, { search, type: typeFilter === 'ALL' ? undefined : typeFilter, category: categoryFilter === 'ALL' ? undefined : categoryFilter, status: statusFilter === 'ALL' ? undefined : statusFilter, page, size: 10 }, controller.signal), data => {
        if (!Array.isArray(data?.content) || !Number.isInteger(data.totalPages) || !Number.isFinite(data.totalElements)) throw new Error('Invalid transaction page response.');
        setTransactions(data.content.map(row => ({ ...row, title: row.description, categoryLabel: row.category, date: row.createdAt ? new Date(row.createdAt).toLocaleString('en-US') : '—', createdBy: row.createdByName })));
        setPagination(data);
        if (data.totalPages > 0 && page >= data.totalPages) setPage(data.totalPages - 1);
      }),
      apply('permissions', () => getClubMembers(clubId), data => {
        const list = Array.isArray(data) ? data : data?.content || data?.members || data?.data;
        if (!Array.isArray(list)) throw new Error('Cannot verify finance permissions.');
        const actor = list.find(member => String(member.userId ?? member.user?.id) === userId);
        setRole(String(actor?.role ?? actor?.memberRole ?? '').toUpperCase());
      }),
    ]).finally(() => { if (active) { setLoading(false); setLoadedContext(identity); } });
    return () => { active = false; controller.abort(); };
  }, [clubId, userId, identity, search, typeFilter, categoryFilter, statusFilter, page, revision]);
  const visible = loadedContext === identity && isCurrent();
  const canManage = visible && !loading && ['PRESIDENT', 'TREASURER'].includes(role);
  const filteredTransactions = visible ? transactions : [];
  const totalIncome = visible ? summary?.totalIncome : null;
  const totalExpense = visible ? summary?.totalExpense : null;
  const balance = visible ? summary?.currentBalance : null;
  const retry = () => setRevision(value => value + 1);
  const openCreateModal = () => { if (!canManage) return; setEditingTransaction(null); setForm(EMPTY_FORM); setShowModal(true); };
  useEffect(() => () => { editRead.current?.abort(); }, [identity]);
  const openEditModal = async transaction => {
    if (!canManage || busy) return;
    setEditingTransaction(transaction);
    setForm({ title: transaction.description, type: transaction.type, amount: transaction.amount, category: transaction.category, status: transaction.status });
    setShowModal(true); setEditLoading(true);
    editRead.current?.abort();
    const controller = new AbortController(); editRead.current = controller;
    try {
      const data = await getFinanceTransaction(clubId, transaction.id, controller.signal);
      if (controller.signal.aborted || !isCurrent()) return;
      if (!data || String(data.id) !== String(transaction.id) || String(data.clubId) !== String(clubId) || !['PENDING','COMPLETED','CANCELLED'].includes(data.status) || typeof data.description !== 'string' || !Number.isFinite(data.amount)) throw new Error('Invalid transaction detail response.');
      setEditingTransaction(data); setForm({ title: data.description, type: data.type, amount: data.amount, category: data.category, status: data.status });
    } catch (err) { if (!controller.signal.aborted && isCurrent()) { toast.error(getApiError(err, err.message || 'Cannot load transaction details.')); setShowModal(false); if (err.response?.status === 403) retry(); } }
    finally { if (!controller.signal.aborted && isCurrent()) setEditLoading(false); }
  };
  const closeModal = () => { if (!lock.current) { editRead.current?.abort(); setEditLoading(false); setShowModal(false); setEditingTransaction(null); setForm(EMPTY_FORM); } };
  const mutate = async (action) => {
    if (lock.current || !canManage || !isCurrent()) return;
    lock.current = true; setBusy(true);
    try {
      const data = await getClubMembers(clubId);
      const list = Array.isArray(data) ? data : data?.content || data?.members || data?.data;
      const actor = list?.find(member => String(member.userId ?? member.user?.id) === userId);
      const currentRole = String(actor?.role ?? actor?.memberRole ?? '').toUpperCase();
      if (!isCurrent()) return;
      setRole(currentRole);
      if (!['PRESIDENT', 'TREASURER'].includes(currentRole)) { setShowModal(false); setConfirmation(null); throw new Error('Only PRESIDENT/TREASURER can manage transactions.'); }
      await action();
      if (!isCurrent()) return;
      setShowModal(false); setConfirmation(null); setForm(EMPTY_FORM);
      toast.success('Transaction updated successfully.'); retry();
    } catch (err) {
      if (isCurrent()) { toast.error(getApiError(err, err.message || 'Finance operation failed.')); if (err.response?.status === 403) { setRole(null); setShowModal(false); setConfirmation(null); retry(); } }
    } finally { lock.current = false; setBusy(false); }
  };
  const handleSave = () => {
    if (editLoading) return;
    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !['INCOME','EXPENSE'].includes(form.type) || !['EVENTS','MEDIA','OFFICE','MEMBERSHIP_FEE','OTHER'].includes(form.category) || !['PENDING','COMPLETED','CANCELLED'].includes(form.status)) { toast.error('Enter a description, a positive amount and valid transaction values.'); return; }
    const body = { description: form.title.trim(), type: form.type, amount, category: form.category, status: editingTransaction ? editingTransaction.status : form.status };
    mutate(async () => {
      if (!editingTransaction) return createFinanceTransaction(clubId, body);
      const latest = await getFinanceTransaction(clubId, editingTransaction.id);
      if (!isCurrent()) return;
      if (String(latest?.id) !== String(editingTransaction.id) || String(latest?.clubId) !== String(clubId) || latest.status !== editingTransaction.status) throw new Error('Transaction status has changed. Close and reopen Edit before saving.');
      return updateFinanceTransaction(clubId, editingTransaction.id, body);
    });
  };
  const handleExport = async () => {
    if (exportLock.current) return;
    exportLock.current = true; setExporting(true);
    try {
      const { blob, filename } = await exportFinance(clubId);
      if (!isCurrent()) return;
      const url = URL.createObjectURL(blob);
      try { const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); }
      finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
    } catch (err) { toast.error(getApiError(err, err.message || 'Cannot export finance data.')); }
    finally { exportLock.current = false; setExporting(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar title="Home Page / Finance" />

        <section className="finance-page">
          <header className="finance-header">
            <div>
              <h1>Finance Management</h1>

              <p>Track income, expenses, and financial balance of the club.</p>
            </div>

            <div className="finance-header-actions">
              <button
                type="button"
                className="finance-export-button"
                onClick={handleExport}
                disabled={exporting || !clubId}
              >
                <Download size={17} />
                {exporting ? "Exporting..." : "Export Excel"}
              </button>

              {canManage && <button
                type="button"
                className="finance-create-button"
                onClick={openCreateModal}
              >
                <Plus size={18} />
                Add Transaction
              </button>}
            </div>
          </header>

          {Object.entries(errors).map(([key, message]) => <p role="alert" key={key}>{key}: {message} <button onClick={retry}>Retry</button></p>)}
          <div className={`finance-stat-grid ${loading ? "finance-api-skeleton" : ""}`} aria-busy={loading}>
            <FinanceStatCard
              label="Current Balance"
              value={formatMoney(balance)}
              description="Total remaining amount"
              icon={<WalletCards />}
              className="balance"
            />

            <FinanceStatCard
              label="Total Income"
              value={formatMoney(totalIncome)}
              description={summary ? `${summary.incomeGrowthPercentage}% compared to last month` : "—"}
              icon={<TrendingUp />}
              className="income"
            />

            <FinanceStatCard
              label="Total Expense"
              value={formatMoney(totalExpense)}
              description={summary ? `${summary.expenseGrowthPercentage}% compared to last month` : "—"}
              icon={<TrendingDown />}
              className="expense"
            />

            <FinanceStatCard
              label="Pending Transactions"
              value={visible && summary ? String(summary.pendingTransactionsCount) : "—"}
              description="Income/Expense transactions pending approval"
              icon={<ReceiptText />}
              className="pending"
            />
          </div>

          <div className="finance-content-grid">
            <article className="finance-panel finance-chart-panel">
              <div className="finance-panel-header">
                <div>
                  <h2>Expense Overview</h2>
                  <p>Summary of expenses over the last 6 months</p>
                </div>

                <CalendarDays size={21} />
              </div>

              {loading ? <p className="finance-api-skeleton">Loading chart...</p> : visible && overview.length ? <div className="finance-api-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={overview}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label"/><YAxis/><Tooltip formatter={value => formatMoney(value)}/><Legend/><Line type="monotone" dataKey="income" stroke="#7c3aed" name="Income"/><Line type="monotone" dataKey="expense" stroke="#ef4444" name="Expense"/></LineChart></ResponsiveContainer></div> : <p>No overview data available.</p>}
            </article>

            <article className="finance-panel finance-breakdown-panel">
              <div className="finance-panel-header">
                <div>
                  <h2>Expense Breakdown</h2>
                  <p>Allocation by category</p>
                </div>

                <CircleDollarSign size={21} />
              </div>

              {loading ? <p className="finance-api-skeleton">Loading categories...</p> : visible && categories.length ? <><div className="finance-api-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="totalAmount" nameKey="category" innerRadius="55%" outerRadius="80%">{categories.map((row, i) => <Cell key={row.category} fill={['#7c3aed','#a78bfa','#f59e0b','#94a3b8','#ec4899'][i % 5]}/>)}</Pie><Tooltip formatter={value => formatMoney(value)}/></PieChart></ResponsiveContainer></div><div className="finance-breakdown-list">{categories.map(row => <BreakdownRow key={row.category} label={row.category} value={`${formatMoney(row.totalAmount)} · ${row.percentage}%`} className="event"/>)}</div></> : <p>No category data available.</p>}
            </article>
          </div>

          <article className="finance-panel finance-table-panel">
            <div className="finance-table-header">
              <div>
                <h2>Recent Transactions</h2>
                <p>{visible ? pagination.totalElements : 0} transactions</p>
              </div>

              <div className="finance-table-filters">
                <div className="finance-search">
                  <Search size={16} />

                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search transactions..."
                  />
                </div>

                <div className="finance-type-filter">
                  <Filter size={16} />

                  <GlideSelectField
                    value={typeFilter}
                    onChange={(event) => (setTypeFilter(event.target.value), setPage(0))}
                  >
                    <option value="ALL">All</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </GlideSelectField>
                </div>
                <GlideSelectField aria-label="Category filter" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}><option value="ALL">All categories</option>{['EVENTS','MEDIA','OFFICE','MEMBERSHIP_FEE','OTHER'].map(value => <option key={value}>{value}</option>)}</GlideSelectField>
                <GlideSelectField aria-label="Status filter" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}><option value="ALL">All statuses</option>{['PENDING','COMPLETED','CANCELLED'].map(value => <option key={value}>{value}</option>)}</GlideSelectField>
              </div>
            </div>

            <div className="finance-table-wrapper">
              <table className="finance-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Created By</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {loading ? <tr><td colSpan="8" className="finance-api-skeleton">Loading transactions...</td></tr> : !filteredTransactions.length && <tr><td colSpan="8">No transactions found.</td></tr>}
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <strong>{transaction.title}</strong>
                      </td>

                      <td>{transaction.categoryLabel}</td>

                      <td>
                        <span
                          className={`finance-transaction-type ${String(transaction.type).toLowerCase()}`}
                        >
                          {transaction.type === "INCOME" ? (
                            <ArrowDownLeft size={14} />
                          ) : (
                            <ArrowUpRight size={14} />
                          )}

                          {transaction.type === "INCOME" ? "Income" : "Expense"}
                        </span>
                      </td>

                      <td
                        className={
                          transaction.type === "INCOME"
                            ? "finance-amount income"
                            : "finance-amount expense"
                        }
                      >
                        {transaction.type === "INCOME" ? "+" : "-"}
                        {formatMoney(transaction.amount)}
                      </td>

                      <td>{transaction.date}</td>
                      <td>{transaction.createdBy}</td>

                      <td>
                        <span
                          className={`finance-status ${String(transaction.status).toLowerCase()}`}
                        >
                          {transaction.status}
                        </span>
                      </td>

                      <td>
                        <div className="finance-row-actions">
                          <button type="button" aria-label={`Edit transaction ${transaction.id}`} title="Edit Transaction" disabled={!canManage || busy} onClick={() => openEditModal(transaction)}><Edit3 size={15}/></button>
                          {canManage && transaction.status === 'PENDING' && <><button disabled={busy} onClick={() => setConfirmation({ id: transaction.id, status: 'COMPLETED', title: transaction.title })}>Approve</button><button disabled={busy} onClick={() => setConfirmation({ id: transaction.id, status: 'CANCELLED', title: transaction.title })}>Cancel</button></>}
                          {canManage && <button type="button" disabled title="Delete authorization is awaiting backend confirmation"><Trash2 size={15}/></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="finance-api-pagination"><button disabled={loading || page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {pagination.totalPages ? page + 1 : 0} / {pagination.totalPages}</span><button disabled={loading || page + 1 >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>Next</button></div>
          </article>
          <FundCampaignPanel key={identity} clubId={clubId} userId={userId}/>
        </section>

        {confirmation && canManage && <div className="finance-modal-backdrop"><div className="finance-modal" role="dialog" aria-modal="true" aria-label="Confirm transaction status"><header><h2>Confirm {confirmation.status === "COMPLETED" ? "approval" : "cancellation"}</h2></header><div className="finance-modal-body"><p>{confirmation.title}</p></div><footer><button disabled={busy} onClick={() => setConfirmation(null)}>Back</button><button disabled={busy} onClick={() => mutate(() => updateFinanceTransactionStatus(clubId, confirmation.id, confirmation.status))}>{busy ? "Processing..." : "Confirm"}</button></footer></div></div>}
        {showModal && canManage && (
          <FinanceModal
            form={form}
            setForm={setForm}
            editing={Boolean(editingTransaction)}
            busy={busy || editLoading}
            onClose={closeModal}
            onSave={handleSave}
          />
        )}
      </main>
    </div>
  );
}

function FinanceStatCard({ label, value, description, icon, className }) {
  return (
    <article className={`finance-stat-card ${className}`}>
      <div className="finance-stat-icon">{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </article>
  );
}

function BreakdownRow({ label, value, className }) {
  return (
    <div className="finance-breakdown-row">
      <span>
        <i className={className} />
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  );
}

function FinanceModal({ form, setForm, editing, busy, onClose, onSave }) {
  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div
      className="finance-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="finance-modal" role="dialog" aria-modal="true" aria-label={editing ? "Edit Transaction" : "Add Transaction"}>
        <header>
          <div>
            <h2>{editing ? "Edit Transaction" : "Add Transaction"}</h2>
            <p>{editing ? "Status stays unchanged. Use Approve/Cancel to change transaction status." : "Transactions are saved by the backend. New transactions default to PENDING."}</p>
          </div>

          <button type="button" onClick={onClose} disabled={busy}>
            <X size={20} />
          </button>
        </header>

        <fieldset className="finance-modal-body" disabled={busy}>
          <label>Description</label>

          <input
            type="text"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Example: Venue rental cost"
          />

          <div className="finance-form-grid">
            <div>
              <label>Transaction Type</label>

              <GlideSelectField
                value={form.type}
                onChange={(event) => setField("type", event.target.value)}
              >
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </GlideSelectField>
            </div>

            <div>
              <label>Amount</label>

              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(event) => setField("amount", event.target.value)}
                placeholder="Enter amount in VND"
              />
            </div>

            <div>
              <label>Category</label>

              <GlideSelectField
                value={form.category}
                onChange={(event) => setField("category", event.target.value)}
              >
                <option value="MEMBERSHIP_FEE">Membership Fee</option>
                <option value="EVENTS">Event</option>
                <option value="MEDIA">Media</option>
                <option value="OFFICE">Office</option>
                <option value="OTHER">Other</option>
              </GlideSelectField>
            </div>

            <div>
              <label>Status</label>

              <GlideSelectField
                disabled={editing}
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
              >
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </GlideSelectField>
            </div>
          </div>
        </fieldset>

        <footer>
          <button type="button" className="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>

          <button type="button" className="primary" onClick={onSave} disabled={busy}>
            {editing ? "Save Changes" : "Add Transaction"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function formatMoney(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
