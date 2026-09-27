'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const API_BASE_URL = (process.env.NEXT_PUBLIC_FLUXGO_API_URL || '').replace(/\/+$/, '');
const PAGE_SIZE = 25;
const OVERVIEW_LIST_LIMIT = 8;

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'trips', label: 'Trips' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'support', label: 'Support' },
  { id: 'admins', label: 'Admin users' },
  { id: 'audit', label: 'Audit log' },
];

async function requestApi(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/v1${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  if (response.status === 204) return null;
  let body = null;
  try { body = await response.json(); } catch { body = null; }
  if (!response.ok) {
    const error = new Error(body?.error?.message || 'The admin service is not available. Try again.');
    error.status = response.status;
    throw error;
  }
  return body;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function display(value) {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

function errorText(error, fallback = 'The request failed. Try again.') {
  return error instanceof Error ? error.message : fallback;
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();
    setError(''); setMessage(''); setPending(true);
    try {
      const result = await requestApi('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      onLogin(result.admin);
    } catch (requestError) {
      setError(errorText(requestError, 'The admin service is not available. Try again.'));
    } finally { setPending(false); }
  };

  const requestReset = async (event) => {
    event.preventDefault();
    setError(''); setMessage(''); setPending(true);
    try {
      const result = await requestApi('/admin/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim() }),
      });
      setMessage(result?.message || 'A reset code was sent if the account exists.');
    } catch (requestError) {
      setError(errorText(requestError, 'The reset request failed. Try again.'));
    } finally { setPending(false); }
  };

  const confirmReset = async (event) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (newPassword !== confirmPassword) { setError('The new passwords do not match.'); return; }
    setPending(true);
    try {
      await requestApi('/admin/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), token: token.trim(), newPassword }),
      });
      setMessage('Password changed. Return to sign in.');
      setToken(''); setNewPassword(''); setConfirmPassword('');
    } catch (requestError) {
      setError(errorText(requestError, 'The reset code is invalid or expired.'));
    } finally { setPending(false); }
  };

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-auth-title">
        <p className="admin-console-kicker">Flux Go administration</p>
        <h1 id="admin-auth-title">{mode === 'login' ? 'Sign in' : 'Reset password'}</h1>
        <p className="admin-auth-copy">Use your server-managed admin account.</p>
        {mode === 'login' ? (
          <form className="admin-auth-form" onSubmit={submitLogin}>
            <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
            <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></label>
            {error ? <p className="admin-console-error" role="alert">{error}</p> : null}
            <button className="admin-console-primary" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
            <button className="admin-console-link" type="button" onClick={() => { setMode('reset'); setError(''); setMessage(''); }}>Forgot password?</button>
          </form>
        ) : (
          <>
            <form className="admin-auth-form" onSubmit={requestReset}>
              <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
              <button className="admin-console-primary" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send reset code'}</button>
            </form>
            <form className="admin-auth-form admin-reset-form" onSubmit={confirmReset}>
              <label>Reset code<input value={token} onChange={(event) => setToken(event.target.value)} autoComplete="one-time-code" required /></label>
              <label>New password<input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required /></label>
              <label>Confirm password<input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required /></label>
              <button className="admin-console-primary" type="submit" disabled={pending}>{pending ? 'Updating…' : 'Set new password'}</button>
            </form>
            <button className="admin-console-link" type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }}>Return to sign in</button>
          </>
        )}
        {message ? <p className="admin-console-success" role="status">{message}</p> : null}
        {mode === 'reset' && error ? <p className="admin-console-error" role="alert">{error}</p> : null}
        <p className="admin-auth-note">HttpOnly session cookie. No admin password is stored in the browser.</p>
      </section>
    </main>
  );
}

function FilterBar({ section, filters, setFilters }) {
  const update = (key, value) => setFilters({ ...filters, [key]: value });
  const statusOptions = {
    members: ['ACTIVE', 'SUSPENDED', 'DELETED'],
    trips: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    bookings: ['REQUESTED', 'PAYMENT_PENDING', 'CONFIRMED', 'REJECTED', 'IN_RIDE', 'COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
    support: ['OPEN', 'CLOSED'],
  }[section] || [];
  if (section === 'audit') {
    return <div className="admin-console-filters"><input value={filters.action || ''} onChange={(event) => update('action', event.target.value)} placeholder="Filter by action" /><input value={filters.resourceType || ''} onChange={(event) => update('resourceType', event.target.value)} placeholder="Resource type" /></div>;
  }
  return (
    <div className="admin-console-filters">
      {section !== 'admins' ? <input value={filters.query || ''} onChange={(event) => update('query', event.target.value)} placeholder={section === 'support' ? 'Subject or ticket reference' : 'Search by name or reference'} /> : null}
      {statusOptions.length ? <select value={filters.status || ''} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select> : null}
      {section === 'trips' ? <><input type="date" value={filters.departureFrom || ''} onChange={(event) => update('departureFrom', event.target.value)} /><input type="date" value={filters.departureTo || ''} onChange={(event) => update('departureTo', event.target.value)} /></> : null}
    </div>
  );
}

function Pagination({ page, total, onChange }) {
  const hasPrevious = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;
  return <div className="admin-console-pagination"><span>{total} result{total === 1 ? '' : 's'}</span><div><button className="admin-console-secondary" type="button" disabled={!hasPrevious} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page + 1}</span><button className="admin-console-secondary" type="button" disabled={!hasNext} onClick={() => onChange(page + 1)}>Next</button></div></div>;
}

function Table({ columns, rows, onSelect, expandedId, expandedContent, empty = 'No records found.' }) {
  return <div className="admin-console-table-wrap"><table className="admin-console-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => {
    const rowId = row.id || row.publicId;
    const isExpanded = expandedId !== null && expandedId !== undefined && String(expandedId) === String(rowId);
    return <Fragment key={rowId}>
      <tr className={onSelect ? 'admin-console-selectable-row' : undefined} onClick={onSelect ? () => onSelect(row) : undefined} aria-expanded={onSelect ? isExpanded : undefined}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : display(row[column.key])}</td>)}</tr>
      {isExpanded ? <tr className="admin-console-expanded-row"><td colSpan={columns.length}>{expandedContent?.(row)}</td></tr> : null}
    </Fragment>;
  }) : <tr><td colSpan={columns.length} className="admin-console-empty">{empty}</td></tr>}</tbody></table></div>;
}

function SummaryCard({ label, value, detail }) {
  return <article className="admin-summary-card"><span>{label}</span><strong>{display(value)}</strong><small>{detail}</small></article>;
}

function OverviewPanel({ title, description, columns, rows, onSelect, expandedId, expandedContent, empty, onRefresh, loading, wide = false }) {
  return <section className={`admin-console-panel admin-console-overview-panel${wide ? ' is-wide' : ''}`}><div className="admin-console-panel-heading"><div><h2>{title}</h2><p>{description}</p></div><button className="admin-console-secondary" type="button" onClick={onRefresh} disabled={loading}>Refresh</button></div><Table columns={columns} rows={rows} onSelect={onSelect} expandedId={expandedId} expandedContent={expandedContent} empty={empty} /></section>;
}

function DetailField({ label, value }) {
  return <div className="admin-detail-field"><dt>{label}</dt><dd>{display(value)}</dd></div>;
}

function Console({ admin, onLogout }) {
  const [section, setSection] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [overviewLists, setOverviewLists] = useState({ activeTrips: [], activeSupportTickets: [], recentAudit: [] });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [supportReply, setSupportReply] = useState('');
  const [supportReason, setSupportReason] = useState('');
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '' });
  const requestSequence = useRef(0);
  const detailSequence = useRef(0);

  const closeDetail = () => {
    detailSequence.current += 1;
    setSelected(null);
    setDetailLoading(false);
  };

  const loadData = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true); setError('');
    try {
      if (section === 'overview') {
        const [nextSummary, publishedTrips, inProgressTrips, openSupport, recentAudit] = await Promise.all([
          requestApi('/admin/dashboard/summary'),
          requestApi(`/admin/trips?limit=${OVERVIEW_LIST_LIMIT}&offset=0&status=PUBLISHED`),
          requestApi(`/admin/trips?limit=${OVERVIEW_LIST_LIMIT}&offset=0&status=IN_PROGRESS`),
          requestApi(`/admin/support/tickets?limit=${OVERVIEW_LIST_LIMIT}&offset=0&status=OPEN`),
          requestApi(`/admin/audit?limit=${OVERVIEW_LIST_LIMIT}&offset=0`),
        ]);
        const activeTrips = Array.from(new Map([...(publishedTrips?.items || []), ...(inProgressTrips?.items || [])].map((trip) => [trip.id || trip.publicId, trip])).values())
          .sort((left, right) => new Date(left.departureAt).getTime() - new Date(right.departureAt).getTime())
          .slice(0, OVERVIEW_LIST_LIMIT);
        if (requestId === requestSequence.current) {
          setSummary(nextSummary);
          setOverviewLists({ activeTrips, activeSupportTickets: openSupport?.items || [], recentAudit: recentAudit?.items || [] });
        }
        return;
      }
      if (section === 'admins') {
        const result = await requestApi('/admin/users');
        if (requestId === requestSequence.current) { setRows(result?.users || []); setTotal(result?.users?.length || 0); }
        return;
      }
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      Object.entries(appliedFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
      const endpoint = section === 'members' ? '/admin/members' : section === 'trips' ? '/admin/trips' : section === 'bookings' ? '/admin/bookings' : section === 'support' ? '/admin/support/tickets' : '/admin/audit';
      const result = await requestApi(`${endpoint}?${params.toString()}`);
      if (requestId === requestSequence.current) { setRows(result?.items || []); setTotal(result?.total || 0); }
    } catch (requestError) {
      if (requestId === requestSequence.current) setError(errorText(requestError));
    } finally { if (requestId === requestSequence.current) setLoading(false); }
  }, [appliedFilters, page, section]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    setPage(0); closeDetail(); setAppliedFilters({}); setFilters({}); setNotice('');
    if (section === 'overview') {
      setSummary(null);
      setOverviewLists({ activeTrips: [], activeSupportTickets: [], recentAudit: [] });
    }
  }, [section]);
  useEffect(() => {
    if (section === 'overview' || section === 'admins') return undefined;
    const timer = setTimeout(() => { setPage(0); setAppliedFilters({ ...filters }); }, 250);
    return () => clearTimeout(timer);
  }, [filters, section]);

  const openDetail = async (kind, row) => {
    const rowId = row?.id || row?.publicId;
    if (!rowId) return;
    const detailRequestId = ++detailSequence.current;
    setSelected({ kind, rowId, data: null });
    setDetailLoading(true); setError('');
    try {
      const endpoint = kind === 'member' ? `/admin/members/${rowId}` : kind === 'trip' ? `/admin/trips/${rowId}` : kind === 'booking' ? `/admin/bookings/${rowId}` : `/admin/support/tickets/${rowId}`;
      const result = await requestApi(endpoint);
      const data = result?.member || result?.trip || result?.booking || result?.ticket;
      if (!data) throw new Error('The selected record was not found.');
      if (detailRequestId === detailSequence.current) setSelected({ kind, rowId, data });
      setSupportReply(''); setSupportReason('');
    } catch (requestError) {
      if (detailRequestId === detailSequence.current) {
        setSelected(null);
        setError(errorText(requestError));
      }
    } finally { if (detailRequestId === detailSequence.current) setDetailLoading(false); }
  };

  const toggleDetail = (kind, row) => {
    const rowId = row?.id || row?.publicId;
    if (!rowId) return;
    if (selected?.kind === kind && String(selected.rowId) === String(rowId)) {
      closeDetail();
      return;
    }
    void openDetail(kind, row);
  };

  const reloadSelectedSupport = async () => {
    if (selected?.kind === 'support' && selected.data?.id) await openDetail('support', selected.data);
    await loadData();
  };

  const createAdmin = async (event) => {
    event.preventDefault(); setError(''); setNotice('');
    try {
      await requestApi('/admin/users', { method: 'POST', body: JSON.stringify({ username: newAdmin.username.trim(), email: newAdmin.email.trim() || undefined, password: newAdmin.password }) });
      setNewAdmin({ username: '', email: '', password: '' }); setNotice('Admin user created.'); await loadData();
    } catch (requestError) { setError(errorText(requestError)); }
  };

  const updateAdmin = async (row, status) => {
    setError(''); setNotice('');
    try {
      await requestApi(`/admin/users/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setNotice(`Admin user ${status === 'ACTIVE' ? 'enabled' : 'disabled'}.`); await loadData();
    } catch (requestError) { setError(errorText(requestError)); }
  };

  const updateSupport = async (status) => {
    if (!selected?.data?.id) return;
    setError(''); setNotice('');
    try {
      await requestApi(`/admin/support/tickets/${selected.data.id}`, { method: 'PATCH', body: JSON.stringify({ status, reason: supportReason.trim() || undefined }) });
      setNotice(`Support ticket ${status === 'OPEN' ? 'reopened' : 'closed'}.`); await reloadSelectedSupport();
    } catch (requestError) { setError(errorText(requestError)); }
  };

  const sendSupportReply = async (event) => {
    event.preventDefault();
    if (!selected?.data?.id || !supportReply.trim()) return;
    setError(''); setNotice('');
    try {
      await requestApi(`/admin/support/tickets/${selected.data.id}/messages`, { method: 'POST', body: JSON.stringify({ text: supportReply.trim() }) });
      setSupportReply(''); setNotice('Reply sent.'); await reloadSelectedSupport();
    } catch (requestError) { setError(errorText(requestError)); }
  };

  const logout = async () => {
    try { await requestApi('/admin/auth/logout', { method: 'POST' }); } finally { onLogout(); }
  };

  const renderDetail = () => {
    if (!selected) return null;
    if (!selected.data) return <div className="admin-console-detail admin-console-detail-loading">{detailLoading ? 'Loading details…' : 'Details unavailable.'}</div>;
    const data = selected.data;
    if (selected.kind === 'member') return <aside className="admin-console-detail"><DetailHeader title="Member detail" onClose={closeDetail} /><dl className="admin-detail-grid"><DetailField label="Name" value={data.name} /><DetailField label="Member ID" value={data.id} /><DetailField label="Mobile" value={data.mobile} /><DetailField label="Personal email" value={data.personalEmail} /><DetailField label="Personal email status" value={data.personalEmailStatus} /><DetailField label="Work email" value={data.workEmail} /><DetailField label="Work email status" value={data.workEmailStatus} /><DetailField label="Account status" value={data.status} /><DetailField label="Created" value={formatDate(data.createdAt)} /></dl><h3>Vehicles</h3><Table columns={[{ key: 'registrationNumber', label: 'Registration' }, { key: 'make', label: 'Vehicle', render: (row) => `${row.make} ${row.model}` }, { key: 'verificationStatus', label: 'Verification' }, { key: 'status', label: 'Status' }]} rows={data.vehicles || []} empty="No vehicles recorded." /></aside>;
    if (selected.kind === 'trip') return <aside className="admin-console-detail"><DetailHeader title={`Trip ${display(data.publicId)}`} onClose={closeDetail} /><dl className="admin-detail-grid"><DetailField label="Route" value={`${data.origin} → ${data.destination}`} /><DetailField label="Driver" value={data.driverName} /><DetailField label="Departure" value={formatDate(data.departureAt)} /><DetailField label="Status" value={data.status} /><DetailField label="Seats" value={`${data.seatsTotal - data.seatsAvailable}/${data.seatsTotal} booked`} /><DetailField label="Booking mode" value={data.bookingMode} /><DetailField label="Fare" value={`${data.pricePerSeat} ${data.currency || 'INR'}`} /><DetailField label="Cancellation" value={data.cancellationReason} /></dl><h3>Bookings</h3><Table columns={[{ key: 'publicId', label: 'Reference' }, { key: 'status', label: 'Status' }, { key: 'passengerCount', label: 'Passengers' }, { key: 'totalPrice', label: 'Total' }]} rows={data.bookings || []} empty="No bookings recorded." /></aside>;
    if (selected.kind === 'booking') return <aside className="admin-console-detail"><DetailHeader title={`Booking ${display(data.publicId)}`} onClose={closeDetail} /><dl className="admin-detail-grid"><DetailField label="Trip" value={data.tripPublicId} /><DetailField label="Route" value={data.route} /><DetailField label="Booker" value={data.bookedByName} /><DetailField label="Status" value={data.status} /><DetailField label="Passengers" value={data.passengerCount} /><DetailField label="Total" value={`${data.totalPrice} ${data.currency}`} /><DetailField label="Payment" value={data.paymentStatus} /><DetailField label="Pickup" value={data.pickup?.label} /><DetailField label="Drop" value={data.drop?.label} /><DetailField label="Created" value={formatDate(data.createdAt)} /></dl><h3>Traveller snapshot</h3><Table columns={[{ key: 'name', label: 'Name' }, { key: 'ageBucket', label: 'Age' }, { key: 'gender', label: 'Gender' }]} rows={data.passengers || []} empty="No traveller rows." /><h3>Booking events</h3><Table columns={[{ key: 'occurredAt', label: 'Time', render: (row) => formatDate(row.occurredAt) }, { key: 'fromStatus', label: 'From' }, { key: 'toStatus', label: 'To' }, { key: 'actorRole', label: 'Actor' }]} rows={data.events || []} empty="No events recorded." /></aside>;
    if (selected.kind === 'support') return <aside className="admin-console-detail"><DetailHeader title={`${display(data.publicId)} · ${display(data.subject)}`} onClose={closeDetail} /><dl className="admin-detail-grid"><DetailField label="Requester" value={data.requesterName} /><DetailField label="Requester email" value={data.requesterEmail} /><DetailField label="Category" value={data.category} /><DetailField label="Status" value={data.status} /><DetailField label="Updated" value={formatDate(data.updatedAt)} /></dl><div className="admin-support-messages">{(data.messages || []).map((message) => <div className={`admin-support-message ${message.senderRole === 'SUPPORT' || message.senderAdminUserId ? 'is-admin' : ''}`} key={message.id}><strong>{message.senderRole}</strong><time>{formatDate(message.createdAt)}</time><p>{message.text}</p></div>)}</div><p className="admin-support-auto-close-note">Open tickets close automatically after 24 hours without activity.</p><form className="admin-console-form" onSubmit={sendSupportReply}><label>Reply<textarea value={supportReply} onChange={(event) => setSupportReply(event.target.value)} maxLength={2000} rows={4} required /></label><button className="admin-console-primary" type="submit">Send reply</button></form><div className="admin-support-actions"><input value={supportReason} onChange={(event) => setSupportReason(event.target.value)} placeholder="Reason for status change" maxLength={500} />{data.status === 'OPEN' ? <button className="admin-console-danger" type="button" onClick={() => updateSupport('CLOSED')}>Close ticket</button> : <button className="admin-console-secondary" type="button" onClick={() => updateSupport('OPEN')}>Reopen ticket</button>}</div></aside>;
    return null;
  };

  const columns = section === 'members'
    ? [{ key: 'name', label: 'Name' }, { key: 'mobile', label: 'Mobile' }, { key: 'status', label: 'Status' }, { key: 'workEmailStatus', label: 'Work email' }, { key: 'vehicleCount', label: 'Vehicles' }, { key: 'createdAt', label: 'Created', render: (row) => formatDate(row.createdAt) }]
    : section === 'trips'
      ? [{ key: 'publicId', label: 'Reference' }, { key: 'origin', label: 'Route', render: (row) => `${row.origin} → ${row.destination}` }, { key: 'driverName', label: 'Driver' }, { key: 'departureAt', label: 'Departure', render: (row) => formatDate(row.departureAt) }, { key: 'status', label: 'Status' }, { key: 'bookingCount', label: 'Bookings' }]
      : section === 'bookings'
        ? [{ key: 'publicId', label: 'Reference' }, { key: 'tripPublicId', label: 'Trip' }, { key: 'route', label: 'Route' }, { key: 'bookedByName', label: 'Booker' }, { key: 'status', label: 'Status' }, { key: 'totalPrice', label: 'Total' }]
        : section === 'support'
          ? [{ key: 'publicId', label: 'Reference' }, { key: 'subject', label: 'Subject' }, { key: 'requesterName', label: 'Requester' }, { key: 'category', label: 'Category' }, { key: 'status', label: 'Status' }, { key: 'updatedAt', label: 'Updated', render: (row) => formatDate(row.updatedAt) }]
          : section === 'audit'
            ? [{ key: 'createdAt', label: 'Time', render: (row) => formatDate(row.createdAt) }, { key: 'action', label: 'Action' }, { key: 'resourceType', label: 'Resource' }, { key: 'resourceId', label: 'Resource ID' }, { key: 'reason', label: 'Reason' }]
            : [{ key: 'username', label: 'Username' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }, { key: 'createdAt', label: 'Created', render: (row) => formatDate(row.createdAt) }, { key: 'actions', label: 'Actions', render: (row) => <span className="admin-table-actions"><button className="admin-console-link" type="button" onClick={(event) => { event.stopPropagation(); updateAdmin(row, row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'); }}>{row.status === 'ACTIVE' ? 'Disable' : 'Enable'}</button></span> }];

  const detailKind = section === 'members' ? 'member' : section === 'trips' ? 'trip' : section === 'bookings' ? 'booking' : section === 'support' ? 'support' : null;
  const selectRow = detailKind ? (row) => toggleDetail(detailKind, row) : undefined;
  const expandedId = detailKind && selected?.kind === detailKind ? selected.rowId : null;

  return (
    <main className="admin-console-page">
      <div className="admin-console-shell">
        <aside className="admin-console-sidebar">
          <div className="admin-console-title"><strong>Flux Go</strong><span>Admin console</span></div>
          <nav aria-label="Admin sections">{SECTIONS.map((item) => <button key={item.id} className={section === item.id ? 'is-active' : ''} type="button" onClick={() => setSection(item.id)}>{item.label}</button>)}</nav>
          <button className="admin-console-sidebar-logout" type="button" onClick={logout}>Sign out</button>
        </aside>
        <section className="admin-console-main">
          <header className="admin-console-header"><div><p className="admin-console-kicker">Operations</p><h1>{SECTIONS.find((item) => item.id === section)?.label}</h1></div><div className="admin-console-identity">{display(admin?.username)} · {display(admin?.role)}</div></header>
          {error ? <div className="admin-console-banner admin-console-error" role="alert">{error}</div> : null}
          {notice ? <div className="admin-console-banner admin-console-success" role="status">{notice}</div> : null}
          {section === 'overview' && summary ? <>
            <div className="admin-summary-grid"><SummaryCard label="Members" value={summary.members?.total} detail={`${display(summary.members?.active)} active`} /><SummaryCard label="Active trips" value={(summary.trips?.published || 0) + (summary.trips?.inProgress || 0)} detail="Published or in progress" /><SummaryCard label="Bookings" value={summary.bookings?.total} detail={`${display(summary.bookings?.confirmed)} confirmed`} /><SummaryCard label="Active support" value={summary.support?.open} detail="Open tickets" /><SummaryCard label="Admin users" value={summary.admins?.active} detail="Active accounts" /></div>
            <div className="admin-console-overview-grid">
              <OverviewPanel title="Active trips" description="Published and in-progress trips." columns={[{ key: 'publicId', label: 'Reference' }, { key: 'origin', label: 'Route', render: (row) => `${row.origin} → ${row.destination}` }, { key: 'driverName', label: 'Driver' }, { key: 'departureAt', label: 'Departure', render: (row) => formatDate(row.departureAt) }, { key: 'status', label: 'Status' }]} rows={overviewLists.activeTrips} onSelect={(row) => toggleDetail('trip', row)} expandedId={selected?.kind === 'trip' ? selected.rowId : null} expandedContent={renderDetail} empty="No active trips." onRefresh={loadData} loading={loading} />
              <OverviewPanel title="Active support tickets" description="Open tickets that need a response." columns={[{ key: 'publicId', label: 'Reference' }, { key: 'subject', label: 'Subject' }, { key: 'requesterName', label: 'Requester' }, { key: 'category', label: 'Category' }, { key: 'updatedAt', label: 'Updated', render: (row) => formatDate(row.updatedAt) }]} rows={overviewLists.activeSupportTickets} onSelect={(row) => toggleDetail('support', row)} expandedId={selected?.kind === 'support' ? selected.rowId : null} expandedContent={renderDetail} empty="No active support tickets." onRefresh={loadData} loading={loading} />
              <OverviewPanel title="Recent audit log" description="The latest administrator actions." columns={[{ key: 'createdAt', label: 'Time', render: (row) => formatDate(row.createdAt) }, { key: 'action', label: 'Action' }, { key: 'resourceType', label: 'Resource' }, { key: 'resourceId', label: 'Resource ID' }, { key: 'reason', label: 'Reason' }]} rows={overviewLists.recentAudit} empty="No audit entries." onRefresh={loadData} loading={loading} wide />
            </div>
          </> : null}
          {section === 'overview' && !summary && loading ? <p className="admin-console-loading-inline">Loading overview…</p> : null}
          {section !== 'overview' && section !== 'admins' ? <FilterBar section={section} filters={filters} setFilters={setFilters} /> : null}
          {section === 'admins' ? <form className="admin-console-create-form" onSubmit={createAdmin}><strong>Create admin user</strong><input placeholder="Username" value={newAdmin.username} onChange={(event) => setNewAdmin({ ...newAdmin, username: event.target.value })} required /><input placeholder="Email" type="email" value={newAdmin.email} onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })} /><input placeholder="Temporary password" type="password" minLength={12} value={newAdmin.password} onChange={(event) => setNewAdmin({ ...newAdmin, password: event.target.value })} required /><button className="admin-console-primary" type="submit">Create</button></form> : null}
          {section === 'overview' ? <section className="admin-console-panel"><h2>Operational queues</h2><p>Use the sections on the left to inspect members, trips, bookings, support tickets, admin users, and audit records.</p></section> : null}
          {section !== 'overview' ? <section className="admin-console-panel"><div className="admin-console-panel-heading"><div><h2>{SECTIONS.find((item) => item.id === section)?.label}</h2><p>{loading ? 'Loading…' : detailKind ? 'Select a row to expand details.' : 'Review the latest records.'}</p></div><button className="admin-console-secondary" type="button" onClick={loadData} disabled={loading}>Refresh</button></div><Table columns={columns} rows={rows} onSelect={selectRow} expandedId={expandedId} expandedContent={renderDetail} />{section !== 'admins' ? <Pagination page={page} total={total} onChange={(nextPage) => { setPage(nextPage); closeDetail(); }} /> : null}</section> : null}
        </section>
      </div>
    </main>
  );
}

function DetailHeader({ title, onClose }) {
  return <div className="admin-console-detail-header"><h2>{title}</h2><button className="admin-console-link" type="button" onClick={onClose}>Close</button></div>;
}

export default function AdminPortal() {
  const [sessionState, setSessionState] = useState('checking');
  const [admin, setAdmin] = useState(null);
  useEffect(() => {
    requestApi('/admin/me').then((result) => { setAdmin(result?.admin || null); setSessionState('authenticated'); }).catch(() => setSessionState('signed-out'));
  }, []);
  if (sessionState === 'checking') return <main className="admin-console-loading">Checking admin session…</main>;
  if (sessionState === 'signed-out') return <LoginScreen onLogin={(nextAdmin) => { setAdmin(nextAdmin); setSessionState('authenticated'); }} />;
  return <Console admin={admin} onLogout={() => { setAdmin(null); setSessionState('signed-out'); }} />;
}
