import { Fragment, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getAdminOrders } from '../../api/adminApi';
import { date, Filter, LoadState, money, number, Panel, Table, useAdminData } from './AdminDataViews';

const statuses = ['PAID', 'PENDING', 'CANCELLED', 'EXPIRED'];
const headings = ['Order Code', 'Customer', 'Club', 'Package', 'Amount', 'Payment Status', 'Payment Method', 'Transaction Reference', 'Reference Source', 'Created At', 'Paid At', 'Details'];
const referenceLabels = new Map([['GATEWAY', 'Gateway Reference'], ['MANUAL', 'Manual Reference']]);
const text = value => typeof value === 'string' && value ? value : 'N/A';
const identifier = value => typeof value === 'number' && Number.isSafeInteger(value) ? value : text(value);
const details = [
  ['Order ID', 'id'], ['Customer ID', 'userId'], ['Email', 'customerEmail'],
  ['Phone', 'customerPhone'], ['Club ID', 'clubId'], ['Package ID', 'packageId'],
  ['Package Code', 'packageCode'], ['Cancelled At', 'cancelledAt'],
];

function validatePage(data) {
  const valid = data && Array.isArray(data.content) &&
    ['page', 'size', 'totalElements', 'totalPages'].every(key => Number.isSafeInteger(data[key]) && data[key] >= 0) &&
    data.size >= 1 && data.size <= 100 && data.content.every(row =>
      row && Number.isSafeInteger(row.id) && row.id > 0 && statuses.includes(row.status));
  if (!valid) throw new Error('The server returned an unsupported order page.');
  return data;
}

export default function AdminOrders({ revision }) {
  const [query, setQuery] = useState({ search: '', status: '', from: '', to: '', page: 0, size: 20 });
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const invalidDates = query.from && query.to && query.from > query.to;
  const orderCode = search.trim();
  const invalidSearch = orderCode !== '' && !/^\d{1,20}$/.test(orderCode);

  const state = useAdminData(async signal => {
    if (invalidDates) return null;
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== ''));
    try {
      return validatePage(await getAdminOrders(params, signal));
    } catch (error) {
      if (error.response?.status === 404) throw new Error('The order ledger endpoint is unavailable.');
      if (error.response?.status === 400) throw new Error('The server rejected these order filters.');
      if (error.response?.status >= 500) throw new Error('The server could not load orders.');
      if (!error.response && error.request) throw new Error('Could not reach the server. Check your connection and retry.');
      throw error;
    }
  }, [query, revision]);

  const data = state.data;
  useEffect(() => {
    if (!data) return;
    const last = Math.max(0, data.totalPages - 1);
    if (query.page > last) setQuery(current => ({ ...current, page: last }));
  }, [data, query.page]);

  function update(field, value) {
    setExpanded(null);
    setQuery(current => ({ ...current, [field]: value, page: field === 'page' ? value : 0 }));
  }

  function submitSearch(event) {
    event.preventDefault();
    if (invalidSearch) return;
    setExpanded(null);
    setQuery(current => current.search === orderCode && current.page === 0
      ? current
      : { ...current, search: orderCode, page: 0 });
  }

  return <Panel title="Orders Ledger" description="Gateway references help reconcile records against a statement. Manual references represent manual confirmation.">
    <form className="admin-orders-search" onSubmit={submitSearch}>
      <label className="admin-data-filter">Order code
        <input type="search" inputMode="numeric" maxLength={20} value={search}
          onChange={event => setSearch(event.target.value)} placeholder="Enter an order code" autoComplete="off"/>
      </label>
      <button type="submit" disabled={invalidSearch}><Search size={16} aria-hidden="true"/>Search orders</button>
    </form>
    {invalidSearch && <p role="alert">Enter a numeric order code. Personal information is not accepted in search.</p>}
    <div className="admin-data-filters">
      <Filter label="Payment status" value={query.status} onChange={value => update('status', value)} options={statuses}/>
      <label className="admin-data-filter">Created from
        <input type="date" value={query.from} onChange={event => update('from', event.target.value)}/>
      </label>
      <label className="admin-data-filter">Created through
        <input type="date" value={query.to} onChange={event => update('to', event.target.value)}/>
      </label>
      <label className="admin-data-filter">Orders per page
        <select value={query.size} onChange={event => update('size', Number(event.target.value))}>
          {[20, 50, 100].map(size => <option key={size}>{size}</option>)}
        </select>
      </label>
    </div>
    {invalidDates ? <p role="alert">The start date must be on or before the end date.</p> :
      <LoadState state={state}>{data && <>
        <Table headings={headings} empty={!data.content.length}>
          {data.content.map(row => <Fragment key={row.id}>
            <tr>
              <td>{identifier(row.orderCode)}</td><td>{text(row.customerName)}</td>
              <td>{text(row.clubName)}</td><td>{text(row.packageName || row.packageCode)}</td>
              <td>{money(row.amount)}</td><td>{row.status}</td><td>{text(row.paymentMethod)}</td>
              <td>{text(row.transactionNo)}</td><td>{referenceLabels.get(row.referenceSource) || 'N/A'}</td>
              <td>{date(row.createdAt)}</td><td>{date(row.paidAt)}</td>
              <td><button type="button" aria-expanded={expanded === row.id}
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
                {expanded === row.id ? 'Hide details' : 'View details'}
              </button></td>
            </tr>
            {expanded === row.id && <tr><td colSpan={headings.length}>
              <dl className="admin-order-details">
                {details.map(([label, key]) => <div key={key}><dt>{label}</dt>
                  <dd>{key === 'cancelledAt' ? date(row[key]) : identifier(row[key])}</dd>
                </div>)}
              </dl>
            </td></tr>}
          </Fragment>)}
        </Table>
        <div className="admin-data-pagination">
          <span>{number(data.totalElements)} orders · Page {data.totalPages ? data.page + 1 : 0} / {data.totalPages}</span>
          <button disabled={query.page === 0} onClick={() => update('page', query.page - 1)}>Previous</button>
          <button disabled={query.page + 1 >= data.totalPages} onClick={() => update('page', query.page + 1)}>Next</button>
          <button onClick={() => { setExpanded(null); state.refresh(); }}>Refresh orders</button>
        </div>
      </>}</LoadState>}
  </Panel>;
}
