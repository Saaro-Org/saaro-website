'use client';

import { useEffect, useState } from 'react';

// Set this to the approved backend origin in the website deployment.
// Empty means same-origin, which keeps local proxy setups safe by default.
const API_BASE_URL = (process.env.NEXT_PUBLIC_FLUXGO_API_URL || '').replace(/\/+$/, '');

const PORTAL_MODULES = [
  { number: '01', title: 'Verification queue', description: 'Review member and vehicle checks when the server queue is enabled.', status: 'Protected API' },
  { number: '02', title: 'Trip oversight', description: 'Monitor rides, bookings, and safety states from one operations view.', status: 'Protected API' },
  { number: '03', title: 'Support cases', description: 'Give support agents a clear place to manage member conversations.', status: 'Protected API' },
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
  if (!response.ok) throw new Error(body?.error?.message || 'The admin service is not available. Try again.');
  return body;
}

function BrandLockup() {
  return <div className="admin-portal-brand-lockup"><span className="admin-portal-brand-glyph" aria-hidden="true"><i /><i /></span><span className="admin-portal-brand-name">Flux <em>Go</em></span></div>;
}

function LoginPanel({ onLogin, initialReset = false }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    if (initialReset) setShowReset(true);
  }, [initialReset]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const result = await requestApi('/admin/auth/login', { method: 'POST', body: JSON.stringify({ username: username.trim(), password }) });
      onLogin(result.admin);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The admin service is not available. Try again.');
    } finally { setPending(false); }
  };

  if (showReset) return <ResetPanel username={username} onBack={() => { setShowReset(false); setError(''); }} />;

  return (
    <div className="admin-portal-login-panel">
      <div className="admin-portal-login-card">
        <div className="admin-portal-login-heading"><p className="eyebrow eyebrow-dark">Operations access</p><h1>Welcome<br /><span>back.</span></h1><p>Sign in to open the Flux Go operations workspace.</p></div>
        <form className="admin-portal-form" onSubmit={submit}>
          <div className="admin-portal-field"><label htmlFor="admin-portal-username">Username</label><input id="admin-portal-username" name="username" type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username" required /></div>
          <div className="admin-portal-field"><label htmlFor="admin-portal-password">Password</label><input id="admin-portal-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" required /></div>
          {error ? <p className="admin-portal-form-error" role="alert">{error}</p> : null}
          <button className="button button-primary admin-portal-submit" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Open portal'} <span aria-hidden="true">↗</span></button>
        </form>
        <button className="admin-portal-reset-link" type="button" onClick={() => setShowReset(true)}>Forgot password?</button>
        <p className="admin-portal-temporary-note"><span aria-hidden="true">✓</span>Server authorization is active. The browser stores only an HttpOnly session cookie.</p>
      </div>
    </div>
  );
}

function ResetPanel({ username: initialUsername, onBack }) {
  const [username, setUsername] = useState(initialUsername || '');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const queryToken = new URLSearchParams(window.location.search).get('resetToken');
    if (queryToken) { setToken(queryToken); setRequested(true); }
  }, []);

  const requestReset = async (event) => {
    event.preventDefault();
    setError(''); setMessage(''); setPending(true);
    try {
      const result = await requestApi('/admin/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ username: username.trim() }) });
      setRequested(true);
      setMessage(result?.message || 'If the admin account exists, a reset code was sent to its email address.');
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'The reset request failed. Try again.'); }
    finally { setPending(false); }
  };

  const confirmReset = async (event) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (newPassword !== confirmPassword) { setError('The new passwords do not match.'); return; }
    setPending(true);
    try {
      await requestApi('/admin/auth/reset-password', { method: 'POST', body: JSON.stringify({ username: username.trim(), token: token.trim(), newPassword }) });
      setMessage('Your password changed. Return to sign in.');
      setToken(''); setNewPassword(''); setConfirmPassword('');
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'The reset code is invalid or expired.'); }
    finally { setPending(false); }
  };

  return (
    <div className="admin-portal-login-panel">
      <div className="admin-portal-login-card">
        <div className="admin-portal-login-heading"><p className="eyebrow eyebrow-dark">Account recovery</p><h1>Reset<br /><span>access.</span></h1><p>Request a single-use code, then choose a new admin password.</p></div>
        <form className="admin-portal-form" onSubmit={requestReset}><div className="admin-portal-field"><label htmlFor="admin-reset-username">Username</label><input id="admin-reset-username" type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></div><button className="button button-primary admin-portal-submit" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send reset code'} <span aria-hidden="true">↗</span></button></form>
        {requested ? <form className="admin-portal-form admin-portal-reset-form" onSubmit={confirmReset}><div className="admin-portal-field"><label htmlFor="admin-reset-token">Reset code</label><input id="admin-reset-token" type="text" autoComplete="one-time-code" value={token} onChange={(event) => setToken(event.target.value)} required /></div><div className="admin-portal-field"><label htmlFor="admin-reset-password">New password</label><input id="admin-reset-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} required /></div><div className="admin-portal-field"><label htmlFor="admin-reset-confirm-password">Confirm password</label><input id="admin-reset-confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} required /></div><button className="button button-dark admin-portal-submit" type="submit" disabled={pending}>{pending ? 'Updating…' : 'Set new password'} <span aria-hidden="true">↗</span></button></form> : null}
        {message ? <p className="admin-portal-form-success" role="status">{message}</p> : null}
        {error ? <p className="admin-portal-form-error" role="alert">{error}</p> : null}
        <button className="admin-portal-reset-link" type="button" onClick={onBack}>Return to sign in</button>
      </div>
    </div>
  );
}

function Dashboard({ admin, onLogout }) {
  return <main className="admin-portal-dashboard"><header className="admin-portal-dashboard-header"><BrandLockup /><div className="admin-portal-header-actions"><span className="admin-portal-session-badge"><span aria-hidden="true" />{admin?.username || 'Admin'} · server session</span><button className="admin-portal-logout" type="button" onClick={onLogout}>Sign out</button></div></header><section className="admin-portal-dashboard-intro" aria-labelledby="admin-portal-heading"><div><p className="eyebrow eyebrow-dark">Flux Go operations</p><h1 id="admin-portal-heading">Keep the network<br /><span>moving.</span></h1></div><p>Signed in as {admin?.username || 'admin'}. Server authorization protects this workspace.</p></section><section className="admin-portal-module-grid" aria-label="Admin portal modules">{PORTAL_MODULES.map((module) => <article className="admin-portal-module-card" key={module.number}><div className="admin-portal-module-topline"><span>{module.number}</span><span className="admin-portal-module-status">{module.status}</span></div><h2>{module.title}</h2><p>{module.description}</p><span className="admin-portal-module-arrow" aria-hidden="true">↗</span></article>)}</section><section className="admin-portal-next-step" aria-labelledby="admin-portal-next-step-heading"><div><p className="eyebrow">Session status</p><h2 id="admin-portal-next-step-heading">The portal now uses server-owned admin access.</h2></div><p>Queue data remains deferred. This session is ready for the next protected admin API slice.</p></section></main>;
}

function LoadingState() { return <main className="admin-portal-loading" aria-live="polite"><BrandLockup /><p>Checking your admin session…</p></main>; }

export default function AdminPortal() {
  const [sessionState, setSessionState] = useState('checking');
  const [admin, setAdmin] = useState(null);
  const [initialReset, setInitialReset] = useState(false);
  useEffect(() => {
    setInitialReset(new URLSearchParams(window.location.search).has('resetToken'));
    requestApi('/admin/me').then((result) => { setAdmin(result?.admin || null); setSessionState('authenticated'); }).catch(() => setSessionState('signed-out'));
  }, []);
  if (sessionState === 'checking') return <LoadingState />;
  if (sessionState === 'authenticated') return <Dashboard admin={admin} onLogout={async () => { try { await requestApi('/admin/auth/logout', { method: 'POST' }); } finally { setAdmin(null); setSessionState('signed-out'); } }} />;
  return <main className="admin-portal-page"><div className="admin-portal-shell"><aside className="admin-portal-brand-panel"><BrandLockup /><div className="admin-portal-brand-copy"><p className="eyebrow"><span className="eyebrow-dot" />Private operations area</p><h1>Useful tools<br /><span>for the road.</span></h1><p>One calm place for the people who keep every ride clear, safe, and moving.</p></div><div className="admin-portal-brand-footer"><span>ADMIN-PORTAL / 01</span><span>FLUXGO.IN</span></div></aside><LoginPanel initialReset={initialReset} onLogin={(nextAdmin) => { setAdmin(nextAdmin); setSessionState('authenticated'); }} /></div></main>;
}
