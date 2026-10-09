'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_PREFIX = 'fluxgo-admin:';

function readStored(key, fallback) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Keep one per-viewer preference in localStorage. It works when storage is blocked. */
export function useStoredState(key, fallback) {
  const [value, setValue] = useState(fallback);
  const loaded = useRef(false);
  useEffect(() => {
    setValue(readStored(key, fallback));
    loaded.current = true;
    // The fallback is a default value only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback((next) => {
    setValue((current) => {
      const resolved = typeof next === 'function' ? next(current) : next;
      try { window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(resolved)); } catch { /* storage blocked */ }
      return resolved;
    });
  }, [key]);
  return [value, update];
}

/** Run a callback on an interval while the tab is visible. */
export function useInterval(callback, delayMs, enabled = true) {
  const saved = useRef(callback);
  useEffect(() => { saved.current = callback; }, [callback]);
  useEffect(() => {
    if (!enabled || !delayMs) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') saved.current();
    }, delayMs);
    return () => clearInterval(timer);
  }, [delayMs, enabled]);
}

/** Re-render on an interval so relative times stay current. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function useDebounced(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** Return true when focus is in a text field, so single-key shortcuts stay off. */
export function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep keyboard focus inside a modal element and restore it on close. */
export function useFocusTrap(ref, active, onEscape) {
  const escapeRef = useRef(onEscape);
  useEffect(() => { escapeRef.current = onEscape; }, [onEscape]);
  useEffect(() => {
    if (!active) return undefined;
    const node = ref.current;
    const previous = document.activeElement;
    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE) || node;
    window.requestAnimationFrame(() => first?.focus?.());
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        escapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll(FOCUSABLE));
      if (!items.length) { event.preventDefault(); return; }
      const head = items[0];
      const tail = items[items.length - 1];
      if (event.shiftKey && document.activeElement === head) { event.preventDefault(); tail.focus(); }
      else if (!event.shiftKey && document.activeElement === tail) { event.preventDefault(); head.focus(); }
    };
    node?.addEventListener('keydown', onKeyDown);
    return () => {
      node?.removeEventListener('keydown', onKeyDown);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [active, ref]);
}
