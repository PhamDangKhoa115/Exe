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
    title: "Phí thành viên tháng 7",
    category: "MEMBERSHIP",
    categoryLabel: "Phí thành viên",
    type: "INCOME",
    amount: 12500000,
    date: "20/07/2026",
    createdBy: "Nguyễn Văn An",
    status: "COMPLETED",
  },
  {
    id: 2,
    title: "Thu tài trợ sự kiện",
    category: "SPONSOR",
    categoryLabel: "Tài trợ",
    type: "INCOME",
    amount: 30000000,
    date: "18/07/2026",
    createdBy: "Trần Minh Khoa",
    status: "COMPLETED",
  },
  {
    id: 3,
    title: "Chi phí thuê hội trường",
    category: "EVENT",
    categoryLabel: "Sự kiện",
    type: "EXPENSE",
    amount: 8500000,
    date: "17/07/2026",
    createdBy: "Lê Thị Mai",
    status: "COMPLETED",
  },
  {
    id: 4,
    title: "In banner và tài liệu",
    category: "MEDIA",
    categoryLabel: "Truyền thông",
    type: "EXPENSE",
    amount: 3200000,
    date: "15/07/2026",
    createdBy: "Nguyễn Văn An",
    status: "PENDING",
  },
  {
    id: 5,
    title: "Mua vật dụng văn phòng",
    category: "OFFICE",
    categoryLabel: "Văn phòng",
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
      alert("Vui lòng nhập nội dung giao dịch.");
      return;
    }

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      alert("Số tiền phải lớn hơn 0.");
      return;
    }

    const labels = {
      MEMBERSHIP: "Phí thành viên",
      SPONSOR: "Tài trợ",
      EVENT: "Sự kiện",
      MEDIA: "Truyền thông",
      OFFICE: "Văn phòng",
      OTHER: "Khác",
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
          createdBy: localStorage.getItem("fullName") || "Người dùng",
        },
        ...current,
      ]);
    }

    closeModal();
  };

  const handleDelete = (transaction) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa giao dịch "${transaction.title}" không?`,
    );

    if (!confirmed) return;

    setTransactions((current) =>
      current.filter((item) => item.id !== transaction.id),
    );
  };

  const handleExport = () => {
    const headers = [
      "No",
      "Nội dung",
      "Loại",
      "Danh mục",
      "Số tiền",
      "Ngày",
      "Người tạo",
      "Trạng thái",
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

              <p>Theo dõi thu, chi và số dư tài chính của câu lạc bộ.</p>
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
              label="Số dư hiện tại"
              value={formatMoney(balance)}
              description="Tổng số tiền còn lại"
              icon={<WalletCards />}
              className="balance"
            />

            <FinanceStatCard
              label="Tổng thu"
              value={formatMoney(totalIncome)}
              description="+12.5% so với tháng trước"
              icon={<TrendingUp />}
              className="income"
            />

            <FinanceStatCard
              label="Tổng chi"
              value={formatMoney(totalExpense)}
              description="-4.2% so với tháng trước"
              icon={<TrendingDown />}
              className="expense"
            />

            <FinanceStatCard
              label="Chờ duyệt"
              value="1"
              description="Giao dịch chưa hoàn tất"
              icon={<ReceiptText />}
              className="pending"
            />
          </div>

          <div className="finance-content-grid">
            <article className="finance-panel finance-chart-panel">
              <div className="finance-panel-header">
                <div>
                  <h2>Biểu đồ thu chi</h2>
                  <p>Tổng quan 6 tháng gần nhất</p>
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
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                </div>
              </div>

              <div className="finance-chart-legend">
                <span>
                  <i className="income" />
                  Thu
                </span>

                <span>
                  <i className="expense" />
                  Chi
                </span>
              </div>
            </article>

            <article className="finance-panel finance-breakdown-panel">
              <div className="finance-panel-header">
                <div>
                  <h2>Cơ cấu chi phí</h2>
                  <p>Phân bổ theo danh mục</p>
                </div>

                <CircleDollarSign size={21} />
              </div>

              <div className="finance-donut-wrap">
                <div className="finance-donut">
                  <div>
                    <strong>{formatCompactMoney(totalExpense)}</strong>
                    <span>Tổng chi</span>
                  </div>
                </div>
              </div>

              <div className="finance-breakdown-list">
                <BreakdownRow label="Sự kiện" value="42%" className="event" />

                <BreakdownRow
                  label="Truyền thông"
                  value="28%"
                  className="media"
                />

                <BreakdownRow
                  label="Văn phòng"
                  value="18%"
                  className="office"
                />

                <BreakdownRow label="Khác" value="12%" className="other" />
              </div>
            </article>
          </div>

          <article className="finance-panel finance-table-panel">
            <div className="finance-table-header">
              <div>
                <h2>Giao dịch gần đây</h2>
                <p>{filteredTransactions.length} giao dịch</p>
              </div>

              <div className="finance-table-filters">
                <div className="finance-search">
                  <Search size={16} />

                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Tìm kiếm giao dịch..."
                  />
                </div>

                <div className="finance-type-filter">
                  <Filter size={16} />

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="INCOME">Thu</option>
                    <option value="EXPENSE">Chi</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="finance-table-wrapper">
              <table className="finance-table">
                <thead>
                  <tr>
                    <th>Nội dung</th>
                    <th>Danh mục</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Người tạo</th>
                    <th>Trạng thái</th>
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

                          {transaction.type === "INCOME" ? "Thu" : "Chi"}
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
                            ? "Hoàn tất"
                            : "Chờ duyệt"}
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
            <h2>{editing ? "Chỉnh sửa giao dịch" : "Thêm giao dịch"}</h2>
            <p>Dữ liệu được lưu tạm trong state frontend.</p>
          </div>

          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="finance-modal-body">
          <label>Nội dung giao dịch</label>

          <input
            type="text"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            placeholder="Ví dụ: Chi phí thuê hội trường"
          />

          <div className="finance-form-grid">
            <div>
              <label>Loại giao dịch</label>

              <select
                value={form.type}
                onChange={(event) => setField("type", event.target.value)}
              >
                <option value="INCOME">Thu</option>
                <option value="EXPENSE">Chi</option>
              </select>
            </div>

            <div>
              <label>Số tiền</label>

              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(event) => setField("amount", event.target.value)}
                placeholder="Nhập số tiền"
              />
            </div>

            <div>
              <label>Danh mục</label>

              <select
                value={form.category}
                onChange={(event) => setField("category", event.target.value)}
              >
                <option value="MEMBERSHIP">Phí thành viên</option>
                <option value="SPONSOR">Tài trợ</option>
                <option value="EVENT">Sự kiện</option>
                <option value="MEDIA">Truyền thông</option>
                <option value="OFFICE">Văn phòng</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label>Trạng thái</label>

              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
              >
                <option value="COMPLETED">Hoàn tất</option>
                <option value="PENDING">Chờ duyệt</option>
              </select>
            </div>
          </div>
        </div>

        <footer>
          <button type="button" className="secondary" onClick={onClose}>
            Hủy
          </button>

          <button type="button" className="primary" onClick={onSave}>
            {editing ? "Lưu thay đổi" : "Thêm giao dịch"}
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
