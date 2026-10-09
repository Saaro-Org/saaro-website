'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { NAV_GROUPS, SECTION_META } from '../_config/sections';
import { queryString, requestApi } from '../_lib/api';
import { display, formatDateTime } from '../_lib/format';
import { useDebounced, useFocusTrap } from '../_lib/hooks';
import { Badge, Icon, Kbd } from './ui';

const GROUPS = [
  { kind: 'member', label: 'Members', endpoint: '/admin/members', describe: (row) => ({ title: display(row.name), meta: [row.mobile, row.personalEmail].filter(Boolean).join(' · '), badge: row.status }) },
  { kind: 'trip', label: 'Rides', endpoint: '/admin/trips', describe: (row) => ({ title: `${row.origin} → ${row.destination}`, meta: `${row.publicId} · ${display(row.driverName)} · ${formatDateTime(row.departureAt)}`, badge: row.status }) },
  { kind: 'booking', label: 'Bookings', endpoint: '/admin/bookings', describe: (row) => ({ title: `${display(row.bookedByName)} · ${row.route.replace(' to ', ' → ')}`, meta: `${row.publicId} · ride ${row.tripPublicId}`, badge: row.status }) },
  { kind: 'support', label: 'Support tickets', endpoint: '/admin/support/tickets', describe: (row) => ({ title: row.subject, meta: `${row.publicId} · ${display(row.requesterName)}`, badge: row.status }) },
];

/** ⌘K search across members, rides, bookings, and tickets, plus section jumps. */
export function CommandPalette({ open, onClose, onOpenRecord, onNavigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);
  const debounced = useDebounced(query, 220);
  useFocusTrap(ref, open, onClose);

  useEffect(() => { if (open) { setQuery(''); setResults({}); setActive(0); } }, [open]);

  useEffect(() => {
    const text = debounced.trim();
    if (!open || text.length < 2) { setResults({}); setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true);
    Promise.all(GROUPS.map((group) => requestApi(`${group.endpoint}${queryString({ query: text, limit: 5, offset: 0 })}`).then((result) => [group.kind, result?.items || []]).catch(() => [group.kind, []])))
      .then((entries) => { if (!cancelled) { setResults(Object.fromEntries(entries)); setActive(0); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, open]);

  const items = useMemo(() => {
    const text = query.trim().toLowerCase();
    const list = [];
    const sections = NAV_GROUPS.flatMap((group) => group.items).filter((id) => !text || SECTION_META[id].label.toLowerCase().includes(text));
    if (text.length < 2 || sections.length) {
      sections.slice(0, text ? 4 : 10).forEach((id) => list.push({ group: 'Go to', key: `nav-${id}`, icon: SECTION_META[id].icon, title: SECTION_META[id].label, meta: SECTION_META[id].description, run: () => onNavigate(id) }));
    }
    GROUPS.forEach((group) => (results[group.kind] || []).forEach((row) => {
      const description = group.describe(row);
      list.push({ group: group.label, key: `${group.kind}-${row.id}`, title: description.title, meta: description.meta, badge: description.badge, run: () => onOpenRecord(group.kind, row.id, row) });
    }));
    return list;
  }, [query, results, onNavigate, onOpenRecord]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;
  const run = (item) => { onClose(); item.run(); };
  let lastGroup = null;
  const searched = query.trim().length >= 2;
  const recordCount = items.filter((item) => item.group !== 'Go to').length;

  return (
    <div className="ax-overlay is-top" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={ref} className="ax-palette" role="dialog" aria-modal="true" aria-label="Search">
        <div className="ax-palette-input">
          <Icon name="search" size={18} />
          <input data-autofocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, mobiles, references, or go to a page…" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="ax-palette-list"
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') { event.preventDefault(); setActive((current) => Math.min(items.length - 1, current + 1)); }
              if (event.key === 'ArrowUp') { event.preventDefault(); setActive((current) => Math.max(0, current - 1)); }
              if (event.key === 'Enter' && items[active]) { event.preventDefault(); run(items[active]); }
            }} />
          {loading ? <span className="ax-spinner" aria-label="Searching" /> : <Kbd>Esc</Kbd>}
        </div>
        <ul className="ax-palette-list" id="ax-palette-list" role="listbox" ref={listRef}>
          {items.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.key} role="presentation">
                {header ? <p className="ax-palette-group">{header}</p> : null}
                <button type="button" role="option" aria-selected={index === active} data-active={index === active} className={index === active ? 'is-active' : ''} onMouseEnter={() => setActive(index)} onClick={() => run(item)}>
                  {item.icon ? <Icon name={item.icon} size={16} /> : null}
                  <span className="ax-palette-main"><strong>{item.title}</strong>{item.meta ? <span className="ax-muted">{item.meta}</span> : null}</span>
                  {item.badge ? <Badge value={item.badge} /> : null}
                  <Icon name="arrowRight" size={13} className="ax-palette-go" />
                </button>
              </li>
            );
          })}
          {searched && !loading && !recordCount ? <li className="ax-palette-empty">No members, rides, bookings, or tickets match “{query.trim()}”.</li> : null}
        </ul>
        <div className="ax-palette-foot"><span><Kbd>↑</Kbd><Kbd>↓</Kbd> move</span><span><Kbd>↵</Kbd> open</span><span><Kbd>⌘</Kbd><Kbd>K</Kbd> toggle</span></div>
      </div>
    </div>
  );
}
