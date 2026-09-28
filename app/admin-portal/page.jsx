'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const API_BASE_URL = (process.env.NEXT_PUBLIC_FLUXGO_API_URL || '').replace(/\/+$/, '');
const PAGE_SIZE = 25;
const OVERVIEW_LIST_LIMIT = 8;
const CONSOLE_REFRESH_INTERVAL_MS = 10000;
const SUPPORT_DETAIL_REFRESH_INTERVAL_MS = 4000;

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
    error.code = body?.error?.code;
    error.sessionExpired = response.status === 401;
    if (error.sessionExpired && typeof window !== 'undefined' && !path.includes('/auth/login') && !path.includes('/auth/request-password-reset') && !path.includes('/auth/reset-password')) {
      window.dispatchEvent(new CustomEvent('fluxgo-admin-session-expired'));
    }
    throw error;
  }
  return body;
}

const STATUS_LABELS = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DELETED: 'Deleted',
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REQUESTED: 'Requested',
  PAYMENT_PENDING: 'Payment pending',
  CONFIRMED: 'Confirmed',
  REJECTED: 'Rejected',
  IN_RIDE: 'In ride',
  CANCELLED_BY_PASSENGER: 'Cancelled by passenger',
  CANCELLED_BY_DRIVER: 'Cancelled by driver',
  OPEN: 'Open',
  CLOSED: 'Closed',
  ENABLED: 'Enabled',
  DISABLED: 'Disabled',
  VERIFIED: 'Verified',
  PENDING: 'Pending',
  FAILED: 'Failed',
};

function statusLabel(value) {
  if (!value) return '—';
  return STATUS_LABELS[value] || String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value) {
  return String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function statusTone(value) {
  const normalized = String(value || '').toUpperCase();
  if (['ACTIVE', 'PUBLISHED', 'COMPLETED', 'CONFIRMED', 'IN_RIDE', 'OPEN', 'ENABLED', 'VERIFIED'].includes(normalized)) return 'success';
  if (['PENDING', 'PAYMENT_PENDING', 'REQUESTED', 'DRAFT', 'IN_PROGRESS'].includes(normalized)) return 'warning';
  if (['SUSPENDED', 'DELETED', 'CANCELLED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'REJECTED', 'CLOSED', 'DISABLED', 'FAILED'].includes(normalized)) return 'danger';
  return 'neutral';
}

function StatusBadge({ value }) {
  if (!value) return <span>—</span>;
  return <span className={`admin-status-badge admin-status-${statusClass(value)} is-${statusTone(value)}`} aria-label={`Status: ${statusLabel(value)}`}>{statusLabel(value)}</span>;
}

function isSessionExpired(error) {
  return Boolean(error?.sessionExpired || error?.status === 401);
}

const FILTER_QUERY_KEYS = ['query', 'status', 'departureFrom', 'departureTo', 'action', 'resourceType'];

function readConsoleUrlState() {
  if (typeof window === 'undefined') return { section: 'overview', page: 0, filters: {} };
  const params = new URLSearchParams(window.location.search);
  const requestedSection = params.get('section');
  const section = SECTIONS.some((item) => item.id === requestedSection) ? requestedSection : 'overview';
  const requestedPage = Number.parseInt(params.get('page') || '1', 10);
  const page = Number.isFinite(requestedPage) ? Math.max(0, requestedPage - 1) : 0;
  const filters = {};
  FILTER_QUERY_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) filters[key] = value;
  });
  return { section, page, filters };
}

function sectionLabel(section) {
  return SECTIONS.find((item) => item.id === section)?.label || 'Admin records';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function display(value) {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

const ADMIN_ERROR_MESSAGES = {
  ADMIN_INVALID_CREDENTIALS: 'The username or password is not correct.',
  ADMIN_RESET_TOKEN_INVALID: 'The password reset code is invalid or expired.',
  EMAIL_PROVIDER_UNAVAILABLE: 'The reset email could not be sent. Try again later.',
  ADMIN_USERNAME_EXISTS: 'That admin username is already in use.',
  ADMIN_EMAIL_EXISTS: 'That admin email is already in use.',
  SUPPORT_TICKET_CLOSED: 'Reopen the support ticket before sending a reply.',
  UNAUTHENTICATED: 'Your admin session expired. Sign in again.',
  FORBIDDEN: 'This admin account cannot use that action.',
  NOT_FOUND: 'The requested record was not found.',
  INVALID_REQUEST: 'Check the entered values and try again.',
};

function errorText(error, fallback = 'The request failed. Try again.') {
  if (error?.code && ADMIN_ERROR_MESSAGES[error.code]) return ADMIN_ERROR_MESSAGES[error.code];
  return error instanceof Error ? error.message : fallback;
}

function LoginScreen({ onLogin, initialResetToken = '', initialNotice = '' }) {
  const [mode, setMode] = useState(initialResetToken ? 'reset' : 'login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(initialResetToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!initialResetToken) return;
    setToken(initialResetToken);
    setMode('reset');
  }, [initialResetToken]);

  useEffect(() => {
    if (initialNotice) setError(initialNotice);
  }, [initialNotice]);

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
        {mode === 'login' ? (
          <form className="admin-auth-form" onSubmit={submitLogin}>
            <div className="admin-form-field"><label htmlFor="admin-username">Username</label><input id="admin-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></div>
            <div className="admin-form-field"><label htmlFor="admin-password">Password</label><input id="admin-password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required /></div>
            {error ? <p className="admin-console-error" role="alert">{error}</p> : null}
            <button className="admin-console-primary" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
            <button className="admin-console-link" type="button" onClick={() => { setMode('reset'); setError(''); setMessage(''); }}>Forgot password?</button>
          </form>
        ) : (
          <>
            <form className="admin-auth-form" onSubmit={requestReset}>
              <div className="admin-form-field"><label htmlFor="admin-reset-username">Username</label><input id="admin-reset-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></div>
              <button className="admin-console-primary" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send reset code'}</button>
            </form>
            <form className="admin-auth-form admin-reset-form" onSubmit={confirmReset}>
              <div className="admin-form-field"><label htmlFor="admin-reset-token">Reset code</label><input id="admin-reset-token" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="one-time-code" required /></div>
              <div className="admin-form-field"><label htmlFor="admin-new-password">New password</label><input id="admin-new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required /></div>
              <div className="admin-form-field"><label htmlFor="admin-confirm-password">Confirm password</label><input id="admin-confirm-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} required /></div>
              <button className="admin-console-primary" type="submit" disabled={pending}>{pending ? 'Updating…' : 'Set new password'}</button>
            </form>
            <button className="admin-console-link" type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }}>Return to sign in</button>
          </>
        )}
        {message ? <p className="admin-console-success" role="status">{message}</p> : null}
        {mode === 'reset' && error ? <p className="admin-console-error" role="alert">{error}</p> : null}
      </section>
    </main>
  );
}

function FilterBar({ section, filters, setFilters }) {
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const statusOptions = {
    members: ['ACTIVE', 'SUSPENDED', 'DELETED'],
    trips: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    bookings: ['REQUESTED', 'PAYMENT_PENDING', 'CONFIRMED', 'REJECTED', 'IN_RIDE', 'COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
    support: ['OPEN', 'CLOSED'],
  }[section] || [];
  if (section === 'audit') {
    return <div className="admin-console-filters" role="search" aria-label="Audit filters"><label className="admin-console-filter-field" htmlFor="audit-action"><span>Action</span><input id="audit-action" value={filters.action || ''} onChange={(event) => update('action', event.target.value)} placeholder="Filter by action" /></label><label className="admin-console-filter-field" htmlFor="audit-resource"><span>Resource type</span><input id="audit-resource" value={filters.resourceType || ''} onChange={(event) => update('resourceType', event.target.value)} placeholder="Resource type" /></label></div>;
  }
  return (
    <div className="admin-console-filters" role="search" aria-label={`${sectionLabel(section)} filters`}>
      {section !== 'admins' ? <label className="admin-console-filter-field" htmlFor={`${section}-query`}><span>Search</span><input id={`${section}-query`} value={filters.query || ''} onChange={(event) => update('query', event.target.value)} placeholder={section === 'support' ? 'Subject or ticket reference' : 'Search by name or reference'} /></label> : null}
      {statusOptions.length ? <label className="admin-console-filter-field" htmlFor={`${section}-status`}><span>Status</span><select id={`${section}-status`} value={filters.status || ''} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option>{statusOptions.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label> : null}
      {section === 'trips' ? <><label className="admin-console-filter-field" htmlFor="trips-departure-from"><span>Departure from</span><input id="trips-departure-from" type="date" value={filters.departureFrom || ''} onChange={(event) => update('departureFrom', event.target.value)} /></label><label className="admin-console-filter-field" htmlFor="trips-departure-to"><span>Departure to</span><input id="trips-departure-to" type="date" value={filters.departureTo || ''} onChange={(event) => update('departureTo', event.target.value)} /></label></> : null}
    </div>
  );
}

function Pagination({ page, total, onChange }) {
  const hasPrevious = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;
  return <nav className="admin-console-pagination" aria-label="Pagination"><span>{total} result{total === 1 ? '' : 's'}</span><div><button className="admin-console-secondary" type="button" aria-label="Previous page" disabled={!hasPrevious} onClick={() => onChange(page - 1)}>Previous</button><span aria-live="polite">Page {page + 1}</span><button className="admin-console-secondary" type="button" aria-label="Next page" disabled={!hasNext} onClick={() => onChange(page + 1)}>Next</button></div></nav>;
}

function Table({ columns, rows, onSelect, expandedId, expandedContent, empty = 'No records found.', loading = false, label = 'Records' }) {
  return <div className="admin-console-table-wrap"><table className="admin-console-table" aria-label={label} aria-busy={loading ? 'true' : 'false'}><thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row) => {
    const rowId = row.id || row.publicId;
    const isExpanded = expandedId !== null && expandedId !== undefined && String(expandedId) === String(rowId);
    const rowLabel = display(row.publicId || row.name || row.id || 'record');
    return <Fragment key={rowId}>
      <tr className={onSelect ? 'admin-console-selectable-row' : undefined} onClick={onSelect ? () => onSelect(row) : undefined} onKeyDown={onSelect ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row); } } : undefined} tabIndex={onSelect ? 0 : undefined} role={onSelect ? 'button' : undefined} aria-label={onSelect ? `Open ${rowLabel} details` : undefined} aria-expanded={onSelect ? isExpanded : undefined}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : display(row[column.key])}</td>)}</tr>
      {isExpanded ? <tr className="admin-console-expanded-row"><td colSpan={columns.length}>{expandedContent?.(row)}</td></tr> : null}
    </Fragment>;
  }) : <tr><td colSpan={columns.length} className="admin-console-empty" role="status">{loading ? 'Loading records…' : empty}</td></tr>}</tbody></table></div>;
}

function SummaryCard({ label, value, detail }) {
  return <article className="admin-summary-card"><span>{label}</span><strong>{display(value)}</strong><small>{detail}</small></article>;
}

function OverviewPanel({ title, columns, rows, onSelect, expandedId, expandedContent, empty, onRefresh, loading, wide = false }) {
  return <section className={`admin-console-panel admin-console-overview-panel${wide ? ' is-wide' : ''}`}><div className="admin-console-panel-heading"><h2>{title}</h2><button className="admin-console-secondary" type="button" onClick={() => onRefresh()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button></div><Table columns={columns} rows={rows} onSelect={onSelect} expandedId={expandedId} expandedContent={expandedContent} empty={empty} loading={loading} label={title} /></section>;
}

function DetailField({ label, value, status = false }) {
  return <div className="admin-detail-field"><dt>{label}</dt><dd>{status ? <StatusBadge value={value} /> : display(value)}</dd></div>;
}

function ConfirmationDialog({ action, pending, onCancel, onConfirm }) {
  if (!action) return null;
  const isAdmin = action.kind === 'disable-admin';
  return <div className="admin-console-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-copy">
    <div>
      <h2 id="admin-confirm-title">{isAdmin ? 'Disable admin user?' : 'Close support ticket?'}</h2>
      <p id="admin-confirm-copy">{isAdmin ? `Disable ${display(action.row?.username)}? They will lose console access.` : 'Close this ticket after you confirm the status reason.'}</p>
    </div>
    <div className="admin-console-confirmation-actions"><button className="admin-console-secondary" type="button" onClick={onCancel} disabled={pending}>Cancel</button><button className="admin-console-danger" type="button" onClick={onConfirm} disabled={pending}>{pending ? 'Saving…' : 'Confirm'}</button></div>
  </div>;
}

function Console({ admin, onLogout, onSessionExpired }) {
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionPending, setActionPending] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [supportReply, setSupportReply] = useState('');
  const [supportReason, setSupportReason] = useState('');
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '' });
  const [urlReady, setUrlReady] = useState(false);
  const hydrateUrlRef = useRef({ section: false, filters: false });
  const requestSequence = useRef(0);
  const detailSequence = useRef(0);

  useEffect(() => {
    const state = readConsoleUrlState();
    hydrateUrlRef.current = { section: true, filters: true };
    setSection(state.section);
    setPage(state.page);
    setFilters(state.filters);
    setAppliedFilters(state.filters);
    setUrlReady(true);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => onSessionExpired();
    window.addEventListener('fluxgo-admin-session-expired', handleSessionExpired);
    return () => window.removeEventListener('fluxgo-admin-session-expired', handleSessionExpired);
  }, [onSessionExpired]);

  useEffect(() => {
    if (!urlReady) return;
    const params = new URLSearchParams();
    if (section !== 'overview') params.set('section', section);
    if (page > 0) params.set('page', String(page + 1));
    FILTER_QUERY_KEYS.forEach((key) => {
      if (filters[key]) params.set(key, filters[key]);
    });
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [filters, page, section, urlReady]);

  const closeDetail = () => {
    detailSequence.current += 1;
    setSelected(null);
    setDetailLoading(false);
  };

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!urlReady) return;
    const requestId = ++requestSequence.current;
    if (!silent) { setLoading(true); setError(''); }
    else setRefreshing(true);
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
          setLastUpdated(new Date());
        }
        return;
      }
      if (section === 'admins') {
        const result = await requestApi('/admin/users');
        if (requestId === requestSequence.current) { setRows(result?.users || []); setTotal(result?.users?.length || 0); setLastUpdated(new Date()); }
        return;
      }
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (!value) return;
        const inclusiveEnd = section === 'trips' && key === 'departureTo' && /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? `${value}T23:59:59.999Z`
          : value;
        params.set(key, inclusiveEnd);
      });
      const endpoint = section === 'members' ? '/admin/members' : section === 'trips' ? '/admin/trips' : section === 'bookings' ? '/admin/bookings' : section === 'support' ? '/admin/support/tickets' : '/admin/audit';
      const result = await requestApi(`${endpoint}?${params.toString()}`);
      if (requestId === requestSequence.current) { setRows(result?.items || []); setTotal(result?.total || 0); setLastUpdated(new Date()); }
    } catch (requestError) {
      if (isSessionExpired(requestError)) return;
      if (requestId === requestSequence.current) setError(errorText(requestError));
    } finally {
      if (requestId === requestSequence.current) { setLoading(false); setRefreshing(false); }
    }
  }, [appliedFilters, page, section, urlReady]);

  useEffect(() => { if (urlReady) void loadData(); }, [loadData, urlReady]);
  useEffect(() => {
    if (!urlReady) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void loadData({ silent: true });
    }, CONSOLE_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadData, urlReady]);
  useEffect(() => {
    if (!urlReady) return;
    if (hydrateUrlRef.current.section) {
      hydrateUrlRef.current.section = false;
      return;
    }
    setPage(0); closeDetail(); setAppliedFilters({}); setFilters({}); setNotice('');
    if (section === 'overview') {
      setSummary(null);
      setOverviewLists({ activeTrips: [], activeSupportTickets: [], recentAudit: [] });
    }
  }, [section, urlReady]);
  useEffect(() => {
    if (!urlReady || section === 'overview' || section === 'admins') return undefined;
    if (hydrateUrlRef.current.filters) {
      hydrateUrlRef.current.filters = false;
      return undefined;
    }
    const timer = setTimeout(() => { setPage(0); setAppliedFilters({ ...filters }); }, 250);
    return () => clearTimeout(timer);
  }, [filters, section, urlReady]);

  useEffect(() => {
    const kind = selected?.kind;
    const recordId = selected?.data?.id;
    if (!kind || !recordId || (kind === 'support' && selected.data.status !== 'OPEN')) return undefined;
    const detailConfig = {
      member: { path: `/admin/members/${recordId}`, key: 'member' },
      trip: { path: `/admin/trips/${recordId}`, key: 'trip' },
      booking: { path: `/admin/bookings/${recordId}`, key: 'booking' },
      support: { path: `/admin/support/tickets/${recordId}`, key: 'ticket' },
    }[kind];
    if (!detailConfig) return undefined;
    let active = true;
    let refreshInFlight = false;
    const refreshSelectedDetail = async () => {
      if (refreshInFlight) return;
      refreshInFlight = true;
      try {
        const result = await requestApi(detailConfig.path);
        const data = result?.[detailConfig.key];
        if (!active || !data) return;
        setSelected((current) => {
          if (!current || current.kind !== kind || (String(current.rowId) !== String(recordId) && String(current.data?.id) !== String(recordId))) return current;
          return { ...current, data };
        });
        setRows((current) => current.map((row) => String(row.id || row.publicId) === String(recordId)
          ? { ...row, ...data }
          : row));
        if (kind === 'support' && data.status !== 'OPEN') void loadData({ silent: true });
      } catch {
        // Keep the current detail when one background refresh fails.
      } finally {
        refreshInFlight = false;
      }
    };
    const refreshInterval = kind === 'support' ? SUPPORT_DETAIL_REFRESH_INTERVAL_MS : CONSOLE_REFRESH_INTERVAL_MS;
    const timer = setInterval(() => { void refreshSelectedDetail(); }, refreshInterval);
    return () => { active = false; clearInterval(timer); };
  }, [loadData, selected?.data?.id, selected?.data?.status, selected?.kind]);

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
        if (isSessionExpired(requestError)) return;
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

  const beginAction = (key) => {
    setError('');
    setNotice('');
    setActionPending(key);
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    if (actionPending) return;
    beginAction('create-admin');
    try {
      await requestApi('/admin/users', { method: 'POST', body: JSON.stringify({ username: newAdmin.username.trim(), email: newAdmin.email.trim() || undefined, password: newAdmin.password }) });
      setNewAdmin({ username: '', email: '', password: '' }); setNotice('Admin user created.'); await loadData();
    } catch (requestError) { if (!isSessionExpired(requestError)) setError(errorText(requestError)); }
    finally { setActionPending(''); }
  };

  const updateAdmin = async (row, status, confirmed = false) => {
    if (!row?.id || actionPending) return;
    if (status === 'DISABLED' && !confirmed) {
      setConfirmAction({ kind: 'disable-admin', row });
      return;
    }
    const actionKey = `admin:${row.id}:${status}`;
    beginAction(actionKey);
    try {
      await requestApi(`/admin/users/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setNotice(`Admin user ${status === 'ACTIVE' ? 'enabled' : 'disabled'}.`); setConfirmAction(null); await loadData();
    } catch (requestError) { if (!isSessionExpired(requestError)) setError(errorText(requestError)); }
    finally { setActionPending(''); }
  };

  const updateSupport = async (status, confirmed = false) => {
    const ticketId = selected?.data?.id;
    if (!ticketId || actionPending) return;
    if (status === 'CLOSED' && !confirmed) {
      setConfirmAction({ kind: 'close-support', ticketId });
      return;
    }
    const actionKey = `support:${ticketId}:${status}`;
    beginAction(actionKey);
    try {
      await requestApi(`/admin/support/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify({ status, reason: supportReason.trim() || undefined }) });
      setNotice(`Support ticket ${status === 'OPEN' ? 'reopened' : 'closed'}.`); setConfirmAction(null); await reloadSelectedSupport();
    } catch (requestError) { if (!isSessionExpired(requestError)) setError(errorText(requestError)); }
    finally { setActionPending(''); }
  };

  const sendSupportReply = async (event) => {
    event.preventDefault();
    if (!selected?.data?.id || !supportReply.trim() || actionPending) return;
    beginAction('support-reply');
    try {
      await requestApi(`/admin/support/tickets/${selected.data.id}/messages`, { method: 'POST', body: JSON.stringify({ text: supportReply.trim() }) });
      setSupportReply(''); setNotice('Reply sent.'); await reloadSelectedSupport();
    } catch (requestError) { if (!isSessionExpired(requestError)) setError(errorText(requestError)); }
    finally { setActionPending(''); }
  };

  const logout = async () => {
    if (actionPending) return;
    beginAction('logout');
    try { await requestApi('/admin/auth/logout', { method: 'POST' }); } finally { setActionPending(''); onLogout(); }
  };

  const confirmationActionKey = confirmAction?.kind === 'disable-admin'
    ? `admin:${confirmAction.row?.id}:DISABLED`
    : confirmAction?.kind === 'close-support'
      ? `support:${confirmAction.ticketId}:CLOSED`
      : '';
  const confirmPending = Boolean(confirmationActionKey && actionPending === confirmationActionKey);
  const acceptConfirmation = async () => {
    if (!confirmAction || confirmPending) return;
    if (confirmAction.kind === 'disable-admin') await updateAdmin(confirmAction.row, 'DISABLED', true);
    if (confirmAction.kind === 'close-support') await updateSupport('CLOSED', true);
  };

  const renderDetail = () => {
    if (!selected) return null;
    if (!selected.data) return <div className="admin-console-detail admin-console-detail-loading">{detailLoading ? 'Loading details…' : 'Details unavailable.'}</div>;
    const data = selected.data;
    if (selected.kind === 'member') return <aside className="admin-console-detail" aria-label="Member details"><DetailHeader title="Member detail" onClose={closeDetail} /><dl className="admin-detail-grid"><DetailField label="Name" value={data.name} /><DetailField label="Member ID" value={data.id} /><DetailField label="Mobile" value={data.mobile} /><DetailField label="Personal email" value={data.personalEmail} /><DetailField label="Personal email status" value={data.personalEmailStatus} status /><DetailField label="Work email" value={data.workEmail} /><DetailField label="Work email status" value={data.workEmailStatus} status /><DetailField label="Account status" value={data.status} status /><DetailField label="Created" value={formatDate(data.createdAt)} /></dl><h3>Vehicles</h3><Table columns={[{ key: 'registrationNumber', label: 'Registration' }, { key: 'make', label: 'Vehicle', render: (row) => `${row.make} ${row.model}` }, { key: 'verificationStatus', label: 'Verification', render: (row) => <StatusBadge value={row.verificationStatus} /> }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }]} rows={data.vehicles || []} empty="No vehicles recorded." label="Member vehicles" /></aside>;
    if (selected.kind === 'trip') return <aside className="admin-console-detail" aria-label="Trip details"><DetailHeader title={`Trip ${display(data.publicId)}`} onClose={closeDetail} /><dl className="admin-detail-grid"><DetailField label="Route" value={`${data.origin} → ${data.destination}`} /><DetailField label="Driver" value={data.driverName} /><DetailField label="Departure" value={formatDate(data.departureAt)} /><DetailField label="Status" value={data.status} status /><DetailField label="Seats" value={`${data.seatsTotal - data.seatsAvailable}/${data.seatsTotal} booked`} /><DetailField label="Booking mode" value={data.bookingMode} /><DetailField label="Fare" value={`${data.pricePerSeat} ${data.currency || 'INR'}`} /><DetailField label="Cancellation" value={data.cancellationReason} /></dl><h3>Bookings</h3><Table columns={[{ key: 'publicId', label: 'Reference' }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }, { key: 'passengerCount', label: 'Passengers' }, { key: 'totalPrice', label: 'Total' }]} rows={data.bookings || []} empty="No bookings recorded." label="Trip bookings" /></aside>;
    if (selected.kind === 'booking') return <aside className="admin-console-detail" aria-label="Booking details"><DetailHeader title={`Booking ${display(data.publicId)}`} onClose={closeDetail} /><dl className="admin-detail-grid"><DetailField label="Trip" value={data.tripPublicId} /><DetailField label="Route" value={data.route} /><DetailField label="Booker" value={data.bookedByName} /><DetailField label="Status" value={data.status} status /><DetailField label="Passengers" value={data.passengerCount} /><DetailField label="Total" value={`${data.totalPrice} ${data.currency}`} /><DetailField label="Payment" value={data.paymentStatus} status /><DetailField label="Pickup" value={data.pickup?.label} /><DetailField label="Drop" value={data.drop?.label} /><DetailField label="Created" value={formatDate(data.createdAt)} /></dl><h3>Traveller snapshot</h3><Table columns={[{ key: 'name', label: 'Name' }, { key: 'ageBucket', label: 'Age' }, { key: 'gender', label: 'Gender' }]} rows={data.passengers || []} empty="No traveller rows." label="Booking travellers" /><h3>Booking events</h3><Table columns={[{ key: 'occurredAt', label: 'Time', render: (row) => formatDate(row.occurredAt) }, { key: 'fromStatus', label: 'From', render: (row) => <StatusBadge value={row.fromStatus} /> }, { key: 'toStatus', label: 'To', render: (row) => <StatusBadge value={row.toStatus} /> }, { key: 'actorRole', label: 'Actor' }]} rows={data.events || []} empty="No events recorded." label="Booking events" /></aside>;
    if (selected.kind === 'support') return <aside className="admin-console-detail" aria-label="Support ticket details"><DetailHeader title={`${display(data.publicId)} · ${display(data.subject)}`} onClose={closeDetail} /><dl className="admin-detail-grid"><DetailField label="Requester" value={data.requesterName} /><DetailField label="Requester email" value={data.requesterEmail} /><DetailField label="Category" value={data.category} /><DetailField label="Status" value={data.status} status /><DetailField label="Updated" value={formatDate(data.updatedAt)} /></dl><div className="admin-support-messages">{(data.messages || []).map((message) => <div className={`admin-support-message ${message.senderRole === 'SUPPORT' || message.senderAdminUserId ? 'is-admin' : ''}`} key={message.id}><strong>{statusLabel(message.senderRole)}</strong><time>{formatDate(message.createdAt)}</time><p>{message.text}</p></div>)}</div><p className="admin-support-auto-close-note">Open tickets close automatically after 24 hours without activity.</p><p className="admin-support-live-note">New messages load automatically while this ticket is open.</p><form className="admin-console-form" onSubmit={sendSupportReply}><div className="admin-form-field"><label htmlFor="support-reply">Reply</label><textarea id="support-reply" value={supportReply} onChange={(event) => setSupportReply(event.target.value)} maxLength={2000} rows={4} required /></div><button className="admin-console-primary" type="submit" disabled={actionPending === 'support-reply'}>{actionPending === 'support-reply' ? 'Sending…' : 'Send reply'}</button></form><div className="admin-support-actions"><div className="admin-form-field"><label htmlFor="support-reason">Status reason</label><input id="support-reason" value={supportReason} onChange={(event) => setSupportReason(event.target.value)} placeholder="Reason for status change" maxLength={500} /></div>{data.status === 'OPEN' ? <button className="admin-console-danger" type="button" disabled={Boolean(actionPending)} onClick={() => updateSupport('CLOSED')}>{actionPending === `support:${data.id}:CLOSED` ? 'Closing…' : 'Close ticket'}</button> : <button className="admin-console-secondary" type="button" disabled={Boolean(actionPending)} onClick={() => updateSupport('OPEN')}>{actionPending === `support:${data.id}:OPEN` ? 'Reopening…' : 'Reopen ticket'}</button>}</div></aside>;
    return null;
  };

  const columns = section === 'members'
    ? [{ key: 'name', label: 'Name' }, { key: 'mobile', label: 'Mobile' }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }, { key: 'workEmailStatus', label: 'Work email', render: (row) => <StatusBadge value={row.workEmailStatus} /> }, { key: 'vehicleCount', label: 'Vehicles' }, { key: 'createdAt', label: 'Created', render: (row) => formatDate(row.createdAt) }]
    : section === 'trips'
      ? [{ key: 'publicId', label: 'Reference' }, { key: 'origin', label: 'Route', render: (row) => `${row.origin} → ${row.destination}` }, { key: 'driverName', label: 'Driver' }, { key: 'departureAt', label: 'Departure', render: (row) => formatDate(row.departureAt) }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }, { key: 'bookingCount', label: 'Bookings' }]
      : section === 'bookings'
        ? [{ key: 'publicId', label: 'Reference' }, { key: 'tripPublicId', label: 'Trip' }, { key: 'route', label: 'Route' }, { key: 'bookedByName', label: 'Booker' }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }, { key: 'totalPrice', label: 'Total' }]
        : section === 'support'
          ? [{ key: 'publicId', label: 'Reference' }, { key: 'subject', label: 'Subject' }, { key: 'requesterName', label: 'Requester' }, { key: 'category', label: 'Category' }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }, { key: 'updatedAt', label: 'Updated', render: (row) => formatDate(row.updatedAt) }]
          : section === 'audit'
            ? [{ key: 'createdAt', label: 'Time', render: (row) => formatDate(row.createdAt) }, { key: 'action', label: 'Action' }, { key: 'resourceType', label: 'Resource' }, { key: 'resourceId', label: 'Resource ID' }, { key: 'reason', label: 'Reason' }]
            : [{ key: 'username', label: 'Username' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }, { key: 'createdAt', label: 'Created', render: (row) => formatDate(row.createdAt) }, { key: 'actions', label: 'Actions', render: (row) => <span className="admin-table-actions"><button className="admin-console-link" type="button" disabled={Boolean(actionPending)} onClick={(event) => { event.stopPropagation(); updateAdmin(row, row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'); }}>{actionPending === `admin:${row.id}:${row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'}` ? 'Saving…' : row.status === 'ACTIVE' ? 'Disable' : 'Enable'}</button></span> }];

  const detailKind = section === 'members' ? 'member' : section === 'trips' ? 'trip' : section === 'bookings' ? 'booking' : section === 'support' ? 'support' : null;
  const selectRow = detailKind ? (row) => toggleDetail(detailKind, row) : undefined;
  const expandedId = detailKind && selected?.kind === detailKind ? selected.rowId : null;

  return (
    <main className="admin-console-page">
      <div className="admin-console-shell">
        <aside className="admin-console-sidebar">
          <div className="admin-console-title"><strong>Flux Go</strong><span>Admin console</span></div>
          <nav aria-label="Admin sections">{SECTIONS.map((item) => <button key={item.id} className={section === item.id ? 'is-active' : ''} type="button" onClick={() => setSection(item.id)}>{item.label}</button>)}</nav>
          <button className="admin-console-sidebar-logout" type="button" onClick={logout} disabled={actionPending === 'logout'}>{actionPending === 'logout' ? 'Signing out…' : 'Sign out'}</button>
        </aside>
        <section className="admin-console-main">
          <header className="admin-console-header"><div><p className="admin-console-kicker">Operations</p><h1>{sectionLabel(section)}</h1><p className="admin-console-refresh-state" role="status" aria-live="polite">{refreshing || loading ? 'Refreshing data…' : lastUpdated ? `Updated ${formatDate(lastUpdated)}` : 'Waiting for data'}</p></div><div className="admin-console-identity">{display(admin?.username)} · {display(admin?.role)}</div></header>
          {error ? <div className="admin-console-banner admin-console-error" role="alert">{error}</div> : null}
          {notice ? <div className="admin-console-banner admin-console-success" role="status">{notice}</div> : null}
          <ConfirmationDialog action={confirmAction} pending={confirmPending} onCancel={() => setConfirmAction(null)} onConfirm={acceptConfirmation} />
          {section === 'overview' && summary ? <>
            <div className="admin-summary-grid"><SummaryCard label="Members" value={summary.members?.total} detail={`${display(summary.members?.active)} active`} /><SummaryCard label="Active trips" value={(summary.trips?.published || 0) + (summary.trips?.inProgress || 0)} detail="Published or in progress" /><SummaryCard label="Bookings" value={summary.bookings?.total} detail={`${display(summary.bookings?.confirmed)} confirmed`} /><SummaryCard label="Active support" value={summary.support?.open} detail="Open tickets" /><SummaryCard label="Admin users" value={summary.admins?.active} detail="Active accounts" /></div>
            <div className="admin-console-overview-grid">
              <OverviewPanel title="Active trips" columns={[{ key: 'publicId', label: 'Reference' }, { key: 'origin', label: 'Route', render: (row) => `${row.origin} → ${row.destination}` }, { key: 'driverName', label: 'Driver' }, { key: 'departureAt', label: 'Departure', render: (row) => formatDate(row.departureAt) }, { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }]} rows={overviewLists.activeTrips} onSelect={(row) => toggleDetail('trip', row)} expandedId={selected?.kind === 'trip' ? selected.rowId : null} expandedContent={renderDetail} empty="No active trips." onRefresh={loadData} loading={loading || refreshing} />
              <OverviewPanel title="Active support tickets" columns={[{ key: 'publicId', label: 'Reference' }, { key: 'subject', label: 'Subject' }, { key: 'requesterName', label: 'Requester' }, { key: 'category', label: 'Category' }, { key: 'updatedAt', label: 'Updated', render: (row) => formatDate(row.updatedAt) }]} rows={overviewLists.activeSupportTickets} onSelect={(row) => toggleDetail('support', row)} expandedId={selected?.kind === 'support' ? selected.rowId : null} expandedContent={renderDetail} empty="No active support tickets." onRefresh={loadData} loading={loading || refreshing} />
              <OverviewPanel title="Recent audit log" columns={[{ key: 'createdAt', label: 'Time', render: (row) => formatDate(row.createdAt) }, { key: 'action', label: 'Action' }, { key: 'resourceType', label: 'Resource' }, { key: 'resourceId', label: 'Resource ID' }, { key: 'reason', label: 'Reason' }]} rows={overviewLists.recentAudit} empty="No audit entries." onRefresh={loadData} loading={loading || refreshing} wide />
            </div>
          </> : null}
          {section === 'overview' && !summary && loading ? <p className="admin-console-loading-inline">Loading overview…</p> : null}
          {section !== 'overview' && section !== 'admins' ? <FilterBar section={section} filters={filters} setFilters={setFilters} /> : null}
          {section === 'admins' ? <form className="admin-console-create-form" onSubmit={createAdmin}><strong>Create admin user</strong><div className="admin-form-field"><label htmlFor="new-admin-username">Username</label><input id="new-admin-username" placeholder="Username" value={newAdmin.username} onChange={(event) => setNewAdmin({ ...newAdmin, username: event.target.value })} required /></div><div className="admin-form-field"><label htmlFor="new-admin-email">Email</label><input id="new-admin-email" placeholder="Email" type="email" value={newAdmin.email} onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })} /></div><div className="admin-form-field"><label htmlFor="new-admin-password">Temporary password</label><input id="new-admin-password" placeholder="Temporary password" type="password" minLength={12} value={newAdmin.password} onChange={(event) => setNewAdmin({ ...newAdmin, password: event.target.value })} required /></div><button className="admin-console-primary" type="submit" disabled={actionPending === 'create-admin'}>{actionPending === 'create-admin' ? 'Creating…' : 'Create'}</button></form> : null}
          {section !== 'overview' ? <section className="admin-console-panel"><div className="admin-console-panel-heading"><div><h2>{sectionLabel(section)}</h2>{loading ? <p>Loading…</p> : detailKind ? <p>Select a row to expand details.</p> : null}</div><button className="admin-console-secondary" type="button" onClick={() => loadData()} disabled={loading || refreshing}>{loading || refreshing ? 'Refreshing…' : 'Refresh'}</button></div><Table columns={columns} rows={rows} onSelect={selectRow} expandedId={expandedId} expandedContent={renderDetail} loading={loading || refreshing} label={sectionLabel(section)} />{section !== 'admins' ? <Pagination page={page} total={total} onChange={(nextPage) => { setPage(nextPage); closeDetail(); }} /> : null}</section> : null}
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
  const [resetToken, setResetToken] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const nextResetToken = params.get('resetToken') || '';
      if (nextResetToken) {
        setResetToken(nextResetToken);
        params.delete('resetToken');
        const nextQuery = params.toString();
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`);
      }
    }
    requestApi('/admin/me').then((result) => { setAdmin(result?.admin || null); setSessionState('authenticated'); }).catch(() => setSessionState('signed-out'));
  }, []);
  if (sessionState === 'checking') return <main className="admin-console-loading">Checking admin session…</main>;
  if (sessionState === 'signed-out') return <LoginScreen initialResetToken={resetToken} initialNotice={sessionNotice} onLogin={(nextAdmin) => { setResetToken(''); setSessionNotice(''); setAdmin(nextAdmin); setSessionState('authenticated'); }} />;
  return <Console admin={admin} onSessionExpired={() => { setSessionNotice('Your admin session expired. Sign in again.'); setAdmin(null); setSessionState('signed-out'); }} onLogout={() => { setSessionNotice(''); setAdmin(null); setSessionState('signed-out'); }} />;
}
