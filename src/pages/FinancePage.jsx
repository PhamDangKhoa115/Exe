import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
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

const INITIAL_TRANSACTIONS = [
  {
    id: 1,
    title: "Membership Fee - July",
    category: "MEMBERSHIP",
    categoryLabel: "Membership Fee",
    type: "INCOME",
    amount: 12500000,
    date: "20/07/2026",
    createdBy: "Nguyễn Văn An",
    status: "COMPLETED",
  },
  {
    id: 2,
    title: "Sponsorship Income - Event",
    category: "SPONSOR",
    categoryLabel: "Sponsorship",
    type: "INCOME",
    amount: 30000000,
    date: "18/07/2026",
    createdBy: "Trần Minh Khoa",
    status: "COMPLETED",
  },
  {
    id: 3,
    title: "Rental Fee - Conference Room",
    category: "EVENT",
    categoryLabel: "Event",
    type: "EXPENSE",
    amount: 8500000,
    date: "17/07/2026",
    createdBy: "Lê Thị Mai",
    status: "COMPLETED",
  },
  {
    id: 4,
    title: "Printing Banners and Documents",
    category: "MEDIA",
    categoryLabel: "Media",
    type: "EXPENSE",
    amount: 3200000,
    date: "15/07/2026",
    createdBy: "Nguyễn Văn An",
    status: "PENDING",
  },
  {
    id: 5,
    title: "Office Supplies Purchase",
    category: "OFFICE",
    categoryLabel: "Office",
    type: "EXPENSE",
    amount: 1800000,
    date: "12/07/2026",
    createdBy: "Trần Minh Khoa",
    status: "COMPLETED",
  },
];

const EMPTY_FORM = {
  title: "",
  category: "OTHER",
  type: "EXPENSE",
  amount: "",
  status: "COMPLETED",
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filteredTransactions = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === "ALL" || transaction.type === typeFilter;

      const matchesSearch =
        !keyword ||
        [
          transaction.title,
          transaction.categoryLabel,
          transaction.createdBy,
          transaction.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesType && matchesSearch;
    });
  }, [searchText, transactions, typeFilter]);

  const totalIncome = transactions
    .filter((item) => item.type === "INCOME")
    .reduce((total, item) => total + item.amount, 0);

  const totalExpense = transactions
    .filter((item) => item.type === "EXPENSE")
    .reduce((total, item) => total + item.amount, 0);

  const balance = totalIncome - totalExpense;

  const openCreateModal = () => {
    setEditingTransaction(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);

    setForm({
      title: transaction.title,
      category: transaction.category,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      alert("Please enter the transaction description.");
      return;
    }

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      alert("The amount must be a positive number.");
      return;
    }

    const labels = {
      MEMBERSHIP: "Membership Fee",
      SPONSOR: "Sponsorship",
      EVENT: "Event",
      MEDIA: "Media",
      OFFICE: "Office",
      OTHER: "Other",
    };

    if (editingTransaction) {
      setTransactions((current) =>
        current.map((item) =>
          item.id === editingTransaction.id
            ? {
                ...item,
                ...form,
                amount,
                categoryLabel: labels[form.category],
              }
            : item,
        ),
      );
    } else {
      setTransactions((current) => [
        {
          id: Date.now(),
          ...form,
          amount,
          categoryLabel: labels[form.category],
          date: new Date().toLocaleDateString("vi-VN"),
          createdBy: localStorage.getItem("fullName") || "User",
        },
        ...current,
      ]);
    }

    closeModal();
  };

  const handleDelete = (transaction) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the transaction "${transaction.title}"?`,
    );

    if (!confirmed) return;

    setTransactions((current) =>
      current.filter((item) => item.id !== transaction.id),
    );
  };

  const handleExport = () => {
    const headers = [
      "No",
      "Description",
      "Type",
      "Category",
      "Amount",
      "Date",
      "Created By",
      "Status",
    ];

    const rows = filteredTransactions.map((transaction, index) => [
      index + 1,
      transaction.title,
      transaction.type,
      transaction.categoryLabel,
      transaction.amount,
      transaction.date,
      transaction.createdBy,
      transaction.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `finance-${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
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
              >
                <Download size={17} />
                Export
              </button>

              <button
                type="button"
                className="finance-create-button"
                onClick={openCreateModal}
              >
                <Plus size={18} />
                Add Transaction
              </button>
            </div>
          </header>

          <div className="finance-stat-grid">
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
              description="+12.5%  compare to last Month "
              icon={<TrendingUp />}
              className="income"
            />

            <FinanceStatCard
              label="Total Expense"
              value={formatMoney(totalExpense)}
              description="-4.2% compare to last Month"
              icon={<TrendingDown />}
              className="expense"
            />

            <FinanceStatCard
              label="Pending Transactions"
              value="1"
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

              <div className="finance-line-chart">
                <div className="finance-chart-lines">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <svg viewBox="0 0 600 240" preserveAspectRatio="none">
                  <polyline
                    className="finance-income-line"
                    points="0,180 100,130 200,150 300,70 400,95 500,40 600,65"
                  />

                  <polyline
                    className="finance-expense-line"
                    points="0,205 100,170 200,185 300,140 400,155 500,115 600,130"
                  />
                </svg>

                <div className="finance-chart-months">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>

              <div className="finance-chart-legend">
                <span>
                  <i className="income" />
                  Income
                </span>

                <span>
                  <i className="expense" />
                  Expense
                </span>
              </div>
            </article>

            <article className="finance-panel finance-breakdown-panel">
              <div className="finance-panel-header">
                <div>
                  <h2>Expense Breakdown</h2>
                  <p>Allocation by category</p>
                </div>

                <CircleDollarSign size={21} />
              </div>

              <div className="finance-donut-wrap">
                <div className="finance-donut">
                  <div>
                    <strong>{formatCompactMoney(totalExpense)}</strong>
                    <span>Total Expenses</span>
                  </div>
                </div>
              </div>

              <div className="finance-breakdown-list">
                <BreakdownRow label="Events" value="42%" className="event" />

                <BreakdownRow label="Media" value="28%" className="media" />

                <BreakdownRow label="Office" value="18%" className="office" />

                <BreakdownRow label="Other" value="12%" className="other" />
              </div>
            </article>
          </div>

          <article className="finance-panel finance-table-panel">
            <div className="finance-table-header">
              <div>
                <h2>Recent Transactions</h2>
                <p>{filteredTransactions.length} transactions</p>
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

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
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
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <strong>{transaction.title}</strong>
                      </td>

                      <td>{transaction.categoryLabel}</td>

                      <td>
                        <span
                          className={`finance-transaction-type ${transaction.type.toLowerCase()}`}
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
                          className={`finance-status ${transaction.status.toLowerCase()}`}
                        >
                          {transaction.status === "COMPLETED"
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </td>

                      <td>
                        <div className="finance-row-actions">
                          <button
                            type="button"
                            onClick={() => openEditModal(transaction)}
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(transaction)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        {showModal && (
          <FinanceModal
            form={form}
            setForm={setForm}
            editing={Boolean(editingTransaction)}
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

function FinanceModal({ form, setForm, editing, onClose, onSave }) {
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
      <div className="finance-modal">
        <header>
          <div>
            <h2>{editing ? "Edit Transaction" : "Add Transaction"}</h2>
            <p>Data is saved temporarily in the frontend state.</p>
          </div>

          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="finance-modal-body">
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

              <select
                value={form.type}
                onChange={(event) => setField("type", event.target.value)}
              >
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
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

              <select
                value={form.category}
                onChange={(event) => setField("category", event.target.value)}
              >
                <option value="MEMBERSHIP">Membership Fee</option>
                <option value="SPONSOR">Sponsorship</option>
                <option value="EVENT">Event</option>
                <option value="MEDIA">Media</option>
                <option value="OFFICE">Office</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label>Status</label>

              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
              >
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <footer>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>

          <button type="button" className="primary" onClick={onSave}>
            {editing ? "Save Changes" : "Add Transaction"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactMoney(value) {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  return formatMoney(value);
}
