'use client';

import { useEffect, useState } from 'react';
import { errorText, requestApi } from '../_lib/api';
import { Button, Field, IconButton } from './ui';

export function LoginScreen({ onLogin, initialResetToken = '', initialNotice = '' }) {
  const [mode, setMode] = useState(initialResetToken ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(initialResetToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(initialNotice);
  const [pending, setPending] = useState(false);

  useEffect(() => { if (initialResetToken) { setToken(initialResetToken); setMode('reset'); } }, [initialResetToken]);
  useEffect(() => { if (initialNotice) setError(initialNotice); }, [initialNotice]);
  // The sign-in screen always uses the light theme.
  useEffect(() => { const root = document.querySelector('.admin-root'); if (root) delete root.dataset.theme; }, []);

  const switchMode = (next) => { setMode(next); setError(''); setMessage(''); };

  const submitLogin = async (event) => {
    event.preventDefault();
    setError(''); setMessage(''); setPending(true);
    try {
      const result = await requestApi('/admin/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
      onLogin(result.admin);
    } catch (requestError) {
      setError(errorText(requestError, 'The admin service is not available. Try again.'));
    } finally { setPending(false); }
  };

  const requestReset = async (event) => {
    event.preventDefault();
    setError(''); setMessage(''); setPending(true);
    try {
      await requestApi('/admin/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      setMessage('If this email belongs to an admin, we sent a reset code to it.');
    } catch (requestError) {
      setError(errorText(requestError, 'The reset request failed. Try again.'));
    } finally { setPending(false); }
  };

  const confirmReset = async (event) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (newPassword !== confirmPassword) { setError('The two new passwords are not the same.'); return; }
    setPending(true);
    try {
      await requestApi('/admin/auth/reset-password', { method: 'POST', body: JSON.stringify({ email: email.trim(), token: token.trim(), newPassword }) });
      setMessage('Your password changed. Sign in with the new password.');
      setToken(''); setNewPassword(''); setConfirmPassword(''); setPassword('');
      setMode('login');
    } catch (requestError) {
      setError(errorText(requestError, 'The reset code is not valid or it expired.'));
    } finally { setPending(false); }
  };

  return (
    <main className="ax-auth">
      <aside className="ax-auth-brand" aria-hidden="true">
        <div className="ax-auth-glow" />
        <div className="ax-auth-grid" />
        <header className="ax-auth-top">
          <span className="ax-wordmark is-light">fluxgo<span>.</span></span>
          <span className="ax-auth-tag">Admin</span>
        </header>

        <div className="ax-auth-middle">
          <div className="ax-auth-hero">
            <h2>Run Fluxgo<br />from one place.</h2>
            <p>Answer members, watch rides, and act on safety reports before they grow.</p>
          </div>
          <ul className="ax-auth-caps">
            <li>
              <span><b>Support inbox</b><i>Reply to members with templates and shortcuts.</i></span>
            </li>
            <li>
              <span><b>Live operations</b><i>Rides, bookings, and members, updated as they change.</i></span>
            </li>
            <li>
              <span><b>Safety and audit</b><i>Act on reports. Every admin action is logged.</i></span>
            </li>
          </ul>
        </div>

        <footer className="ax-auth-copy">© {new Date().getFullYear()} Fluxgo</footer>
      </aside>
      <section className="ax-auth-card" aria-labelledby="ax-auth-title">
        <div className="ax-auth-card-inner">
        <span className="ax-wordmark ax-auth-card-mark">fluxgo<span>.</span></span>
        <div className="ax-auth-heading">
          <h1 id="ax-auth-title">{mode === 'login' ? 'Sign in to the console' : 'Reset your password'}</h1>
          <p>{mode === 'login' ? 'Use your Fluxgo admin email.' : 'We send a reset code to your admin email.'}</p>
        </div>
        {mode === 'login' ? (
          <form className="ax-form-stack" onSubmit={submitLogin}>
            <Field label="Email" htmlFor="admin-email">
              <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" inputMode="email" required autoFocus />
            </Field>
            <Field label="Password" htmlFor="admin-password">
              <div className="ax-input-group">
                <input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
                <IconButton icon={showPassword ? 'eyeOff' : 'eye'} label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)} />
              </div>
            </Field>
            {error ? <p className="ax-form-error" role="alert">{error}</p> : null}
            {message ? <p className="ax-form-success" role="status">{message}</p> : null}
            <Button variant="primary" size="lg" type="submit" busy={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button>
            <button className="ax-link ax-auth-switch" type="button" onClick={() => switchMode('reset')}>Forgot your password?</button>
          </form>
        ) : (
          <>
            <form className="ax-form-stack" onSubmit={requestReset}>
              <Field label="Email" htmlFor="admin-reset-email" hint="We send a reset code to this address.">
                <input id="admin-reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
              </Field>
              <Button type="submit" busy={pending}>{pending ? 'Sending…' : 'Send reset code'}</Button>
            </form>
            <form className="ax-form-stack ax-auth-reset" onSubmit={confirmReset}>
              <Field label="Reset code" htmlFor="admin-reset-token"><input id="admin-reset-token" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="one-time-code" required className="ax-mono" /></Field>
              <Field label="New password" htmlFor="admin-new-password" hint="At least 12 characters."><input id="admin-new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={12} required /></Field>
              <Field label="Type the new password again" htmlFor="admin-confirm-password"><input id="admin-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={12} required /></Field>
              {error ? <p className="ax-form-error" role="alert">{error}</p> : null}
              {message ? <p className="ax-form-success" role="status">{message}</p> : null}
              <Button variant="primary" type="submit" busy={pending}>{pending ? 'Saving…' : 'Set new password'}</Button>
            </form>
            <button className="ax-link ax-auth-switch" type="button" onClick={() => switchMode('login')}>Back to sign in</button>
          </>
        )}
        <p className="ax-auth-foot">Having trouble signing in? Contact the Fluxgo team.</p>
        </div>
      </section>
    </main>
  );
}
