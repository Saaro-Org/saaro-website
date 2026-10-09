'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { requestApi } from './api';

/**
 * One change check for the whole portal.
 *
 * The portal polls GET /admin/dashboard/pulse. It returns the newest change time
 * for each data type. A view reloads only when one of its types changes.
 * There is no other background polling.
 * - Normal interval: 60 s. While a support conversation is open: 15 s.
 * - Paused while the tab is hidden, and after 10 min without input.
 * - One immediate check when the tab shows again or input starts again.
 */
const NORMAL_MS = 60_000;
const FAST_MS = 15_000;
const IDLE_AFTER_MS = 10 * 60_000;

export const LIVE_KEYS = ['support', 'trips', 'bookings', 'members', 'reviews', 'vehicles', 'audit'];

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const [lastSync, setLastSync] = useState(null);
  const [paused, setPaused] = useState(false);
  const [checking, setChecking] = useState(false);
  const stamps = useRef(null);
  const listeners = useRef(new Set());
  const fastHolders = useRef(0);
  const [fast, setFast] = useState(false);
  const lastInput = useRef(Date.now());
  const inFlight = useRef(false);
  const pausedRef = useRef(false);

  const emit = useCallback((changed) => {
    if (!changed.length) return;
    listeners.current.forEach((listener) => {
      if (listener.keys.some((key) => changed.includes(key))) listener.callback(changed);
    });
  }, []);

  const check = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setChecking(true);
    try {
      const result = await requestApi('/admin/dashboard/pulse');
      const next = result?.changes || {};
      const previous = stamps.current;
      stamps.current = next;
      setLastSync(Date.now());
      if (previous) emit(LIVE_KEYS.filter((key) => (previous[key] || null) !== (next[key] || null)));
    } catch {
      // The next check tries again.
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }, [emit]);

  useEffect(() => { void check(); }, [check]);

  useEffect(() => {
    let timer = null;
    const active = () => document.visibilityState === 'visible' && Date.now() - lastInput.current < IDLE_AFTER_MS;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!active()) { pausedRef.current = true; setPaused(true); return; }
        await check();
        schedule();
      }, fast ? FAST_MS : NORMAL_MS);
    };
    const resume = () => {
      pausedRef.current = false;
      setPaused(false);
      void check();
      schedule();
    };
    const onInput = () => {
      lastInput.current = Date.now();
      if (pausedRef.current) resume();
    };
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      lastInput.current = Date.now();
      resume();
    };
    schedule();
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((name) => window.addEventListener(name, onInput, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, onInput));
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check, fast]);

  const subscribe = useCallback((keys, callback) => {
    const listener = { keys, callback };
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);

  /** Reload every open view now. */
  const refreshAll = useCallback(() => {
    emit(LIVE_KEYS);
    void check();
  }, [check, emit]);

  const holdFast = useCallback(() => {
    fastHolders.current += 1;
    setFast(true);
    return () => {
      fastHolders.current = Math.max(0, fastHolders.current - 1);
      setFast(fastHolders.current > 0);
    };
  }, []);

  return (
    <LiveContext.Provider value={{ lastSync, paused, checking, subscribe, refreshAll, holdFast, check }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  return useContext(LiveContext);
}

/** Run a reload when one of these data types changes, or on a manual refresh. */
export function useLiveRefresh(keys, callback, enabled = true) {
  const live = useContext(LiveContext);
  const saved = useRef(callback);
  useEffect(() => { saved.current = callback; }, [callback]);
  const keyText = keys.join(',');
  useEffect(() => {
    if (!live || !enabled) return undefined;
    return live.subscribe(keyText.split(','), (changed) => saved.current(changed));
  }, [live, keyText, enabled]);
}

/** Ask for the 15 s interval while this component is mounted. */
export function useFastLive(enabled = true) {
  const live = useContext(LiveContext);
  useEffect(() => {
    if (!live || !enabled) return undefined;
    return live.holdFast();
  }, [live, enabled]);
}
