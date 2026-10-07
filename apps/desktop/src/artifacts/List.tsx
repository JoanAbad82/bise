// The artifacts' rows (desktop-screens v6, designer m_11837): the screen's one-line rows with
// columns (glyph, title + 'new', kind, made by, when), and panel A's two-line rows for one project
// (amb-win's Panel.tsx mounts <ArtifactList project onOpen />). Both grouped by day; ↑↓ move, ⏎ opens,
// space looks. Owner: amb-kit.
import { memo, useState, type KeyboardEvent, type Ref } from 'react';
import { byDay, glyphOf, keyOf, kindWords, madeBy, pathOf, timeOf, type Item } from './model';
import { useAllArtifacts } from './hooks';
import { bridge, copyLink, openWithVersions, usePutInMessage } from './Open';
import './artifacts.css';

export interface RowsProps {
  items: readonly Item[];
  now: number;
  /** the selected row's key (project/id) */
  sel: string | null;
  onSel: (key: string) => void;
  onOpen: (it: Item) => void;
  /** space: a quick look (none: space opens) */
  onLook?: (it: Item) => void;
  /** @: put it in a message (none: @ does nothing) */
  onPut?: (it: Item) => void;
  /** 'screen': one line, columns; 'panel': two lines, one project */
  form: 'screen' | 'panel';
  testId: string;
}

/** ↑↓ ⏎ space over a flat list of items: the shared keys of both forms. */
export function listKey(e: KeyboardEvent, flat: readonly Item[], sel: string | null, p: Pick<RowsProps, 'onSel' | 'onOpen' | 'onLook' | 'onPut'>): boolean {
  const i = flat.findIndex((it) => keyOf(it) === sel);
  const at = (k: number) => flat[Math.max(0, Math.min(flat.length - 1, k))];
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const next = at(i < 0 ? 0 : i + (e.key === 'ArrowDown' ? 1 : -1));
    if (next) p.onSel(keyOf(next));
    return true;
  }
  const cur = i >= 0 ? flat[i] : undefined;
  if (cur && e.key === 'Enter') {
    p.onOpen(cur);
    return true;
  }
  if (cur && e.key === ' ') {
    (p.onLook ?? p.onOpen)(cur);
    return true;
  }
  if (cur && e.key === '@' && p.onPut) {
    p.onPut(cur);
    return true;
  }
  // v: open it with its versions shown; ⌘C: copy its link
  if (cur && e.key === 'v' && !e.metaKey && !e.ctrlKey) {
    openWithVersions(keyOf(cur));
    p.onOpen(cur);
    return true;
  }
  if (cur && e.key === 'c' && e.metaKey) {
    copyLink(cur.a.url);
    return true;
  }
  return false;
}

/**
 * Space on a row: Quick Look of its file when it has one and the window can (amb-mac's
 * window.bise.quickLook), else it opens in the window.
 */
export function useLook(open: (it: Item) => void): (it: Item) => void {
  return (it) => {
    const path = pathOf(it.a);
    const look = bridge()?.quickLook;
    if (path === null || look === undefined) {
      open(it);
      return;
    }
    void look(path).then((shown) => {
      if (!shown) open(it);
    });
  };
}

/** The rows grouped by day. */
export function ArtifactRows({ items, now, sel, onSel, onOpen, onLook, onPut, form, testId }: RowsProps) {
  const groups = byDay(items, now);
  return (
    <div
      className={`art-list ${form}`}
      role="listbox"
      tabIndex={0}
      data-testid={testId}
      onKeyDown={(e) => {
        if (listKey(e, items, sel, { onSel, onOpen, ...(onLook ? { onLook } : {}), ...(onPut ? { onPut } : {}) })) e.preventDefault();
      }}
    >
      {groups.map((g) => (
        <div key={g.day} className="art-day" data-testid={`${testId}.day.${g.day}`}>
          <div className="art-day-h">{g.title}</div>
          {g.items.map((it) => (
            <ArtRow key={keyOf(it)} it={it} on={sel === keyOf(it)} form={form} testId={`${testId}.row.${it.a.id}`}
              onPick={() => { onSel(keyOf(it)); }} onOpen={() => { onOpen(it); }} />
          ))}
        </div>
      ))}
    </div>
  );
}

const ArtRow = memo(function ArtRow({ it, on, form, onPick, onOpen, testId, ref }: {
  it: Item; on: boolean; form: 'screen' | 'panel'; onPick: () => void; onOpen: () => void; testId: string; ref?: Ref<HTMLDivElement>;
}) {
  const a = it.a;
  const title = (
    <span className="art-title">
      <span className="art-t">{a.title}</span>
      {a.new && <span className="art-new" data-testid={`${testId}.new`}>new</span>}
    </span>
  );
  return (
    <div ref={ref} className={`art-row${on ? ' on' : ''}`} role="option" aria-selected={on} data-testid={testId}
      onClick={onPick} onDoubleClick={onOpen}>
      <span className="art-g" aria-hidden="true">{glyphOf(a.kind)}</span>
      {form === 'screen' ? (
        <>
          {title}
          <span className="art-k">{kindWords(a)}</span>
          <span className="art-by">{madeBy(it)}</span>
          <span className="art-w">{timeOf(a.at_ms)}</span>
        </>
      ) : (
        <span className="art-two">
          {title}
          <span className="art-sub">{`${kindWords(a)} · ${madeBy(it, false)} · ${timeOf(a.at_ms)}`}</span>
        </span>
      )}
    </div>
  );
});

/**
 * Panel A's body (amb-win's frame): one project's artifacts, two-line rows by day. ⏎ opens one in
 * the window (onOpen with its id), space looks at its file (else opens), @ puts it in a message.
 */
export function ArtifactList({ project, onOpen, testId = 'artifacts.panel' }: { project: string; onOpen: (id: string) => void; testId?: string }) {
  const items = useAllArtifacts(project);
  const put = usePutInMessage();
  const look = useLook((it) => { onOpen(it.a.id); });
  const [sel, setSel] = useState<string | null>(null);
  // the clock of the day groups: when the panel mounted (a render reads no clock)
  const [now] = useState(() => Date.now());
  if (items.length === 0) {
    return (
      <div className="art-empty" data-testid={`${testId}.empty`}>
        nothing yet. when an agent makes a page, a doc or a file for you, it lands here.
      </div>
    );
  }
  return (
    <ArtifactRows items={items} now={now} sel={sel} onSel={setSel} onOpen={(it) => { onOpen(it.a.id); }} onLook={look}
      onPut={(it) => { put(it.project, it.a); }} form="panel" testId={testId} />
  );
}
