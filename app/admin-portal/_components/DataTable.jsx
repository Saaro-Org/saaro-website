'use client';

import { useMemo, useRef } from 'react';
import { formatNumber } from '../_lib/format';
import { useStoredState } from '../_lib/hooks';
import { Button, EmptyState, Icon, IconButton, Popover, Skeleton } from './ui';

const MIN_WIDTH = 64;
export const PAGE_SIZES = [25, 50, 100];

/**
 * A server-paged table.
 * - Drag a header edge to change a column width. Widths are kept per table in this browser.
 * - Click a sortable header to sort. The parent sends the sort to the API.
 * - Use the Columns menu to show or hide columns.
 */
export function DataTable({
  tableId,
  columns,
  rows,
  loading,
  getRowId = (row) => row.id || row.publicId,
  onRowClick,
  selectedId,
  sort,
  onSortChange,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  empty,
  onExport,
  exporting,
  toolbar,
  label,
}) {
  const [widths, setWidths] = useStoredState(`table:${tableId}:widths`, {});
  const [hidden, setHidden] = useStoredState(`table:${tableId}:hidden`, null);
  const [density, setDensity] = useStoredState('table:density', 'comfortable');
  const bodyRef = useRef(null);

  const hiddenKeys = useMemo(() => new Set(hidden ?? columns.filter((column) => column.defaultHidden).map((column) => column.key)), [hidden, columns]);
  const visible = columns.filter((column) => !hiddenKeys.has(column.key));
  const tableWidth = visible.reduce((sum, column) => sum + (widths[column.key] || column.width || 160), 0);

  const startResize = (event, column) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = widths[column.key] || column.width || 160;
    const min = column.minWidth || MIN_WIDTH;
    document.body.classList.add('ax-resizing');
    const onMove = (moveEvent) => {
      const next = Math.max(min, Math.round(startWidth + moveEvent.clientX - startX));
      setWidths((current) => ({ ...current, [column.key]: next }));
    };
    const onUp = () => {
      document.body.classList.remove('ax-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const resizeByKey = (event, column) => {
    const step = event.shiftKey ? 40 : 10;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const current = widths[column.key] || column.width || 160;
    const next = Math.max(column.minWidth || MIN_WIDTH, current + (event.key === 'ArrowRight' ? step : -step));
    setWidths((all) => ({ ...all, [column.key]: next }));
  };

  const toggleSort = (column) => {
    if (!column.sortKey || !onSortChange) return;
    if (sort?.key !== column.sortKey) onSortChange({ key: column.sortKey, order: column.defaultOrder || 'desc' });
    else onSortChange({ key: column.sortKey, order: sort.order === 'desc' ? 'asc' : 'desc' });
  };

  const toggleColumn = (key) => {
    setHidden(() => {
      const next = new Set(hiddenKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return [...next];
    });
  };

  const moveFocus = (event, index) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick?.(rows[index]);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const target = bodyRef.current?.querySelectorAll('tr[data-row]')[index + (event.key === 'ArrowDown' ? 1 : -1)];
    target?.focus();
  };

  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const showSkeleton = loading && !rows.length;

  return (
    <div className={`ax-table-card is-${density}`}>
      <div className="ax-table-toolbar">
        <div className="ax-table-toolbar-start">{toolbar}</div>
        <div className="ax-table-toolbar-end">
          {loading && rows.length ? <span className="ax-table-updating" role="status"><span className="ax-spinner" aria-hidden="true" />Updating</span> : null}
          <Popover label="Table options" trigger={(props) => <Button size="sm" icon="columns" onClick={props.toggle} aria-expanded={props['aria-expanded']}>Columns</Button>}>
            {() => (
              <div className="ax-menu">
                <p className="ax-menu-label">Show columns</p>
                {columns.map((column) => (
                  <label key={column.key} className="ax-menu-check">
                    <input type="checkbox" checked={!hiddenKeys.has(column.key)} disabled={column.locked} onChange={() => toggleColumn(column.key)} />
                    <span>{column.label}</span>
                  </label>
                ))}
                <div className="ax-menu-sep" />
                <p className="ax-menu-label">Row height</p>
                <div className="ax-menu-row">
                  <button type="button" className={density === 'comfortable' ? 'is-active' : ''} onClick={() => setDensity('comfortable')}>Comfortable</button>
                  <button type="button" className={density === 'compact' ? 'is-active' : ''} onClick={() => setDensity('compact')}>Compact</button>
                </div>
                <div className="ax-menu-sep" />
                <button type="button" className="ax-menu-item" onClick={() => { setWidths({}); setHidden(null); }}>Reset widths and columns</button>
              </div>
            )}
          </Popover>
          {onExport ? <Button size="sm" icon="download" onClick={onExport} busy={exporting} disabled={!total}>{exporting ? 'Exporting…' : 'Export CSV'}</Button> : null}
        </div>
      </div>
      <div className="ax-table-scroll">
        <table className="ax-table" style={{ width: tableWidth, minWidth: '100%' }} aria-label={label} aria-busy={loading ? 'true' : 'false'}>
          <colgroup>{visible.map((column) => <col key={column.key} style={{ width: widths[column.key] || column.width || 160 }} />)}</colgroup>
          <thead>
            <tr>
              {visible.map((column) => {
                const active = column.sortKey && sort?.key === column.sortKey;
                const ariaSort = active ? (sort.order === 'asc' ? 'ascending' : 'descending') : column.sortKey ? 'none' : undefined;
                return (
                  <th key={column.key} scope="col" aria-sort={ariaSort} className={`${column.align === 'end' ? 'is-end' : ''}${active ? ' is-sorted' : ''}`}>
                    {column.sortKey ? (
                      <button type="button" className="ax-th-sort" onClick={() => toggleSort(column)} title={`Sort by ${column.label.toLowerCase()}`}>
                        <span>{column.label}</span>
                        <Icon name={active ? (sort.order === 'asc' ? 'sortUp' : 'sortDown') : 'sortNone'} size={12} className="ax-sort-icon" />
                      </button>
                    ) : <span className="ax-th-label">{column.label}</span>}
                    <span className="ax-col-resize" role="separator" aria-orientation="vertical" aria-label={`Resize ${column.label} column`} tabIndex={0}
                      onPointerDown={(event) => startResize(event, column)} onKeyDown={(event) => resizeByKey(event, column)}
                      onDoubleClick={() => setWidths((current) => { const next = { ...current }; delete next[column.key]; return next; })} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {showSkeleton ? Array.from({ length: 8 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="ax-skeleton-row">{visible.map((column) => <td key={column.key}><Skeleton width={`${50 + ((index * 17 + column.key.length * 7) % 45)}%`} /></td>)}</tr>
            )) : rows.length ? rows.map((row, index) => {
              const id = getRowId(row);
              const selected = selectedId !== undefined && selectedId !== null && String(selectedId) === String(id);
              return (
                <tr key={id} data-row tabIndex={onRowClick ? 0 : undefined} className={`${onRowClick ? 'is-clickable' : ''}${selected ? ' is-selected' : ''}`}
                  onClick={onRowClick ? (event) => { if (event.target.closest('a,button,input')) return; onRowClick(row); } : undefined}
                  onKeyDown={onRowClick ? (event) => moveFocus(event, index) : undefined} aria-selected={onRowClick ? selected : undefined}>
                  {visible.map((column) => <td key={column.key} className={column.align === 'end' ? 'is-end' : ''}>{column.render ? column.render(row) : (row[column.key] ?? <span className="ax-muted">—</span>)}</td>)}
                </tr>
              );
            }) : (
              <tr><td colSpan={visible.length} className="ax-table-empty-cell">{empty || <EmptyState title="No records" />}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {onPageChange ? (
        <nav className="ax-pagination" aria-label="Pagination">
          <span className="ax-pagination-range">{total ? <>{formatNumber(from)}–{formatNumber(to)} of <strong>{formatNumber(total)}</strong></> : '0 results'}</span>
          <div className="ax-pagination-controls">
            {onPageSizeChange ? (
              <label className="ax-page-size"><span>Rows</span>
                <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>{PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}</select>
              </label>
            ) : null}
            <IconButton icon="arrowLeft" label="Previous page" disabled={page <= 0} onClick={() => onPageChange(page - 1)} />
            <span className="ax-page-indicator" aria-live="polite">Page {page + 1} of {pageCount}</span>
            <IconButton icon="arrowRight" label="Next page" disabled={page + 1 >= pageCount} onClick={() => onPageChange(page + 1)} />
          </div>
        </nav>
      ) : null}
    </div>
  );
}

/** Build a CSV file from rows and start a download. */
export function downloadCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.map((column) => escape(column.label)).join(',')];
  rows.forEach((row) => lines.push(columns.map((column) => escape(column.csv ? column.csv(row) : row[column.key])).join(',')));
  const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
