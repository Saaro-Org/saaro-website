'use client';

import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = (process.env.NEXT_PUBLIC_FLUXGO_API_URL || '').replace(/\/+$/, '');
const PAGE_SIZE = 25;

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

function FilterBar({ section, filters, setFilters, onSubmit }) {
  const statusOptions = {
    members: ['ACTIVE', 'SUSPENDED', 'DELETED'],
    trips: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    bookings: ['REQUESTED', 'PAYMENT_PENDING', 'CONFIRMED', 'REJECTED', 'IN_RIDE', 'COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
    support: ['OPEN', 'CLOSED'],
  }[section] || [];
  if (section === 'audit') {
    return <form className="admin-console-filters" onSubmit={onSubmit}><input value={filters.action || ''} onChange={(event) => setFilters({ ...filters, action: event.target.value })} placeholder="Filter by action" /><input value={filters.resourceType || ''} onChange={(event) => setFilters({ ...filters, resourceType: event.target.value })} placeholder="Resource type" /><button className="admin-console-secondary" type="submit">Apply</button></form>;
  }
  return (
    <form className="admin-console-filters" onSubmit={onSubmit}>
      {section !== 'admins' ? <input value={filters.query || ''} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder={section === 'support' ? 'Subject or ticket reference' : 'Search by name or reference'} /> : null}
      {statusOptions.length ? <select value={filters.status || ''} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select> : null}
      {section === 'trips' ? <><input type="date" value={filters.departureFrom || ''} onChange={(event) => setFilters({ ...filters, departureFrom: event.target.value })} /><input type="date" value={filters.departureTo || ''} onChange={(event) => setFilters({ ...filters, departureTo: event.target.value })} /></> : null}
      <button className="admin-console-secondary" type="submit">Apply</button>
    </form>
  );
}

function Pagination({ page, total, onChange }) {
  const hasPrevious = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;
  return <div className="admin-console-pagination"><span>{total} result{total === 1 ? '' : 's'}</span><div><button className="admin-console-secondary" type="button" disabled={!hasPrevious} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page + 1}</span><button className="admin-console-secondary" type="button" disabled={!hasNext} onClick={() => onChange(page + 1)}>Next</button></div></div>;
}

function Table({ columns, rows, onSelect, empty = 'No records found.' }) {
  return <div className="admin-console-table-wrap"><table className="admin-console-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id || row.publicId} onClick={() => onSelect?.(row)}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : display(row[column.key])}</td>)}</tr>) : <tr><td colSpan={columns.length} className="admin-console-empty">{empty}</td></tr>}</tbody></table></div>;
}

function SummaryCard({ label, value, detail }) {
  return <article className="admin-summary-card"><span>{label}</span><strong>{display(value)}</strong><small>{detail}</small></article>;
}

function DetailField({ label, value }) {
  return <div className="admin-detail-field"><dt>{label}</dt><dd>{display(value)}</dd></div>;
}

function Console({ admin, onLogout }) {
  const [section, setSection] = useState('overview');
  const [summary, setSummary] = useState(null);
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

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (section === 'overview') {
        setSummary(await requestApi('/admin/dashboard/summary'));
        return;
      }
      if (section === 'admins') {
        const result = await requestApi('/admin/users');
        setRows(result?.users || []); setTotal(result?.users?.length || 0);
        return;
      }
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      Object.entries(appliedFilters).forEach(([key, value]) => { if (value) params.set(key, value); });
      const endpoint = section === 'members' ? '/admin/members' : section === 'trips' ? '/admin/trips' : section === 'bookings' ? '/admin/bookings' : section === 'support' ? '/admin/support/tickets' : '/admin/audit';
      const result = await requestApi(`${endpoint}?${params.toString()}`);
      setRows(result?.items || []); setTotal(result?.total || 0);
    } catch (requestError) {
      setError(errorText(requestError));
    } finally { setLoading(false); }
  }, [appliedFilters, page, section]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(0); setSelected(null); setAppliedFilters({}); setFilters({}); setNotice(''); }, [section]);

  const openDetail = async (kind, row) => {
    if (!row?.id) return;
    setDetailLoading(true); setError('');
    try {
      const endpoint = kind === 'member' ? `/admin/members/${row.id}` : kind === 'trip' ? `/admin/trips/${row.id}` : kind === 'booking' ? `/admin/bookings/${row.id}` : `/admin/support/tickets/${row.id}`;
      const result = await requestApi(endpoint);
      setSelected({ kind, data: result?.member || result?.trip || result?.booking || result?.ticket });
      setSupportReply(''); setSupportReason('');
    } catch (requestError) { setError(errorText(requestError)); }
    finally { setDetailLoading(false); }
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
    const data = selected.data;
    if (selected.kind === 'member') return <aside className="admin-console-detail"><DetailHeader title="Member detail" onClose={() => setSelected(null)} /><dl className="admin-detail-grid"><DetailField label="Name" value={data.name} /><DetailField label="Member ID" value={data.id} /><DetailField label="Mobile" value={data.mobile} /><DetailField label="Personal email" value={data.personalEmail} /><DetailField label="Personal email status" value={data.personalEmailStatus} /><DetailField label="Work email" value={data.workEmail} /><DetailField label="Work email status" value={data.workEmailStatus} /><DetailField label="Account status" value={data.status} /><DetailField label="Created" value={formatDate(data.createdAt)} /></dl><h3>Vehicles</h3><Table columns={[{ key: 'registrationNumber', label: 'Registration' }, { key: 'make', label: 'Vehicle', render: (row) => `${row.make} ${row.model}` }, { key: 'verificationStatus', label: 'Verification' }, { key: 'status', label: 'Status' }]} rows={data.vehicles || []} empty="No vehicles recorded." /></aside>;
    if (selected.kind === 'trip') return <aside className="admin-console-detail"><DetailHeader title={`Trip ${display(data.publicId)}`} onClose={() => setSelected(null)} /><dl className="admin-detail-grid"><DetailField label="Route" value={`${data.origin} → ${data.destination}`} /><DetailField label="Driver" value={data.driverName} /><DetailField label="Departure" value={formatDate(data.departureAt)} /><DetailField label="Status" value={data.status} /><DetailField label="Seats" value={`${data.seatsTotal - data.seatsAvailable}/${data.seatsTotal} booked`} /><DetailField label="Booking mode" value={data.bookingMode} /><DetailField label="Fare" value={`${data.pricePerSeat} ${data.currency || 'INR'}`} /><DetailField label="Cancellation" value={data.cancellationReason} /></dl><h3>Bookings</h3><Table columns={[{ key: 'publicId', label: 'Reference' }, { key: 'status', label: 'Status' }, { key: 'passengerCount', label: 'Passengers' }, { key: 'totalPrice', label: 'Total' }]} rows={data.bookings || []} empty="No bookings recorded." /></aside>;
    if (selected.kind === 'booking') return <aside className="admin-console-detail"><DetailHeader title={`Booking ${display(data.publicId)}`} onClose={() => setSelected(null)} /><dl className="admin-detail-grid"><DetailField label="Trip" value={data.tripPublicId} /><DetailField label="Route" value={data.route} /><DetailField label="Booker" value={data.bookedByName} /><DetailField label="Status" value={data.status} /><DetailField label="Passengers" value={data.passengerCount} /><DetailField label="Total" value={`${data.totalPrice} ${data.currency}`} /><DetailField label="Payment" value={data.paymentStatus} /><DetailField label="Pickup" value={data.pickup?.label} /><DetailField label="Drop" value={data.drop?.label} /><DetailField label="Created" value={formatDate(data.createdAt)} /></dl><h3>Traveller snapshot</h3><Table columns={[{ key: 'name', label: 'Name' }, { key: 'ageBucket', label: 'Age' }, { key: 'gender', label: 'Gender' }]} rows={data.passengers || []} empty="No traveller rows." /><h3>Booking events</h3><Table columns={[{ key: 'occurredAt', label: 'Time', render: (row) => formatDate(row.occurredAt) }, { key: 'fromStatus', label: 'From' }, { key: 'toStatus', label: 'To' }, { key: 'actorRole', label: 'Actor' }]} rows={data.events || []} empty="No events recorded." /></aside>;
    if (selected.kind === 'support') return <aside className="admin-console-detail"><DetailHeader title={`${display(data.publicId)} · ${display(data.subject)}`} onClose={() => setSelected(null)} /><dl className="admin-detail-grid"><DetailField label="Requester" value={data.requesterName} /><DetailField label="Requester email" value={data.requesterEmail} /><DetailField label="Category" value={data.category} /><DetailField label="Status" value={data.status} /><DetailField label="Updated" value={formatDate(data.updatedAt)} /></dl><div className="admin-support-messages">{(data.messages || []).map((message) => <div className={`admin-support-message ${message.senderRole === 'SUPPORT' || message.senderAdminUserId ? 'is-admin' : ''}`} key={message.id}><strong>{message.senderRole}</strong><time>{formatDate(message.createdAt)}</time><p>{message.text}</p></div>)}</div><form className="admin-console-form" onSubmit={sendSupportReply}><label>Reply<textarea value={supportReply} onChange={(event) => setSupportReply(event.target.value)} maxLength={2000} rows={4} required /></label><button className="admin-console-primary" type="submit">Send reply</button></form><div className="admin-support-actions"><input value={supportReason} onChange={(event) => setSupportReason(event.target.value)} placeholder="Reason for status change" maxLength={500} />{data.status === 'OPEN' ? <button className="admin-console-danger" type="button" onClick={() => updateSupport('CLOSED')}>Close ticket</button> : <button className="admin-console-secondary" type="button" onClick={() => updateSupport('OPEN')}>Reopen ticket</button>}</div></aside>;
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

  const selectRow = section === 'members' ? (row) => openDetail('member', row) : section === 'trips' ? (row) => openDetail('trip', row) : section === 'bookings' ? (row) => openDetail('booking', row) : section === 'support' ? (row) => openDetail('support', row) : undefined;

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
          {section === 'overview' && summary ? <div className="admin-summary-grid"><SummaryCard label="Members" value={summary.members?.total} detail={`${display(summary.members?.active)} active`} /><SummaryCard label="Trips" value={summary.trips?.total} detail={`${display(summary.trips?.published)} published`} /><SummaryCard label="Bookings" value={summary.bookings?.total} detail={`${display(summary.bookings?.confirmed)} confirmed`} /><SummaryCard label="Support" value={summary.support?.open} detail="Open tickets" /><SummaryCard label="Admin users" value={summary.admins?.active} detail="Active accounts" /></div> : null}
          {section !== 'overview' && section !== 'admins' ? <FilterBar section={section} filters={filters} setFilters={setFilters} onSubmit={(event) => { event.preventDefault(); setPage(0); setAppliedFilters({ ...filters }); }} /> : null}
          {section === 'admins' ? <form className="admin-console-create-form" onSubmit={createAdmin}><strong>Create admin user</strong><input placeholder="Username" value={newAdmin.username} onChange={(event) => setNewAdmin({ ...newAdmin, username: event.target.value })} required /><input placeholder="Email" type="email" value={newAdmin.email} onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })} /><input placeholder="Temporary password" type="password" minLength={12} value={newAdmin.password} onChange={(event) => setNewAdmin({ ...newAdmin, password: event.target.value })} required /><button className="admin-console-primary" type="submit">Create</button></form> : null}
          {section === 'overview' ? <section className="admin-console-panel"><h2>Operational queues</h2><p>Use the sections on the left to inspect members, trips, bookings, support tickets, admin users, and audit records.</p></section> : null}
          {section !== 'overview' ? <section className="admin-console-panel"><div className="admin-console-panel-heading"><div><h2>{SECTIONS.find((item) => item.id === section)?.label}</h2><p>{loading ? 'Loading…' : 'Select a row to inspect details.'}</p></div><button className="admin-console-secondary" type="button" onClick={loadData} disabled={loading}>Refresh</button></div><Table columns={columns} rows={rows} onSelect={selectRow} />{section !== 'admins' ? <Pagination page={page} total={total} onChange={(nextPage) => { setPage(nextPage); setSelected(null); }} /> : null}</section> : null}
          {detailLoading ? <p className="admin-console-loading">Loading details…</p> : null}
          {renderDetail()}
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
