// The artifacts' rows (desktop-screens v6, designer m_11837): the screen's one-line rows with
// columns (glyph, title + 'new', kind, made by, when), and panel A's two-line rows for one project
// (amb-win's Panel.tsx mounts <ArtifactList project onOpen />). Both grouped by day; the list keys are
// app/listkeys.ts's (↑↓ jk pgup pgdn home end, ⏎ opens), the row's are rowKey's (space looks, v, c, r,
// @). Owner: amb-mac (amb-kit's before).
import { memo, useState, type KeyboardEvent, type Ref } from 'react';
import { useListKeys } from '@/app/listkeys';
import { byDay, glyphOf, keyOf, kindWords, madeBy, pathOf, splitArchived, timeOf, type Item } from './model';
import { useAllArtifacts } from './hooks';
import { bridge, copyLink, openWithVersions, usePutInMessage } from './Open';
import { leaves, LEAVES, useGoArtifact } from './leave';
import './artifacts.css';
import { Press } from '@/ds';

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

/**
 * The selected row's keys of both forms, beside the list keys (app/listkeys.ts: ↑↓ jk pgup pgdn
 * home end ⏎), as the TUI's /artifacts (artifacts_screen.rs on_key): space looks, @ puts it in a
 * message, v opens it with its versions, c or ⌘C copies its link, r or o shows its file in the
 * Finder (a browser-only one: opens it). True when it took the key.
 */
export function rowKey(e: KeyboardEvent, cur: Item | undefined, p: Pick<RowsProps, 'onOpen' | 'onLook' | 'onPut'>): boolean {
  if (cur === undefined || e.altKey || e.ctrlKey) return false;
  if (e.metaKey) {
    if (e.key !== 'c') return false;
    copyLink(cur.a.url);
    return true;
  }
  switch (e.key) {
    case ' ':
      (p.onLook ?? p.onOpen)(cur);
      return true;
    case '@':
      if (!p.onPut) return false;
      p.onPut(cur);
      return true;
    case 'v':
      openWithVersions(keyOf(cur));
      p.onOpen(cur);
      return true;
    case 'c':
      copyLink(cur.a.url);
      return true;
    case 'r':
    case 'o': {
      const path = pathOf(cur.a);
      const finder = bridge()?.showInFinder;
      if (path !== null && finder !== undefined) void finder(path);
      else if (leaves(cur.a)) p.onOpen(cur);
      return true;
    }
    default:
      return false;
  }
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

/** The rows grouped by day; the keys are its screen's (useListKeys + rowKey), a click picks a row. */
export function ArtifactRows({ items, now, sel, onSel, onOpen, form, testId }: RowsProps) {
  const groups = byDay(items, now);
  return (
    <div className={`art-list ${form}`} role="listbox" data-testid={testId}>
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
  // a browser-only one (a PR, a link): '↗' in place of its kind and version (designer m_21714)
  const out = leaves(a);
  const kind = out ? LEAVES : kindWords(a);
  return (
    <div ref={ref} className={`art-row${on ? ' on' : ''}`} role="option" aria-selected={on} data-testid={testId} data-row={keyOf(it)}
      data-leaves={out || undefined} onClick={onPick} onDoubleClick={onOpen}>
      <span className="art-g" aria-hidden="true">{glyphOf(a.kind)}</span>
      {form === 'screen' ? (
        <>
          {title}
          <span className="art-k" title={out ? 'opens in your browser' : undefined}>{kind}</span>
          <span className="art-by">{madeBy(it)}</span>
          <span className="art-w">{timeOf(a.at_ms)}</span>
        </>
      ) : (
        <span className="art-two">
          {title}
          <span className="art-sub">{`${kind} · ${madeBy(it, false)} · ${timeOf(a.at_ms)}`}</span>
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
  const { live, archived } = splitArchived(useAllArtifacts(project));
  const put = usePutInMessage();
  // a browser-only one opens his browser (leave.ts), the others the frame's way
  const goArtifact = useGoArtifact();
  const openIt = (it: Item) => {
    if (leaves(it.a)) goArtifact(it.project, it.a.id, it.a);
    else onOpen(it.a.id);
  };
  const look = useLook(openIt);
  // the archived ones behind a faint 'N archived' row; a click shows them under the others
  const [showArchived, setShowArchived] = useState(false);
  // the clock of the day groups: when the panel mounted (a render reads no clock)
  const [now] = useState(() => Date.now());
  const items = showArchived ? [...live, ...archived] : live;
  const byKey = new Map(items.map((it) => [keyOf(it), it]));
  const put1 = (it: Item) => {
    put(it.project, it.a);
  };
  const { sel, setSel, ref, onKeyDown } = useListKeys<HTMLDivElement>({
    order: items.map(keyOf),
    onOpen: (k) => {
      const it = byKey.get(k);
      if (it) openIt(it);
    },
    onKey: (e, k) => rowKey(e, k === null ? undefined : byKey.get(k), { onOpen: openIt, onLook: look, onPut: put1 }),
  });
  const more =
    archived.length > 0 ? (
      <Press look="art-archived" onClick={() => { setShowArchived((o) => !o); }} data-testid={`${testId}.archived`}>
        {showArchived ? 'hide the archived ones' : `${String(archived.length)} archived`}
      </Press>
    ) : null;
  if (items.length === 0) {
    return (
      <div className="art-empty" data-testid={`${testId}.empty`}>
        nothing yet. when an agent makes a page, a doc or a file for you, it lands here.
        {more}
      </div>
    );
  }
  return (
    <div ref={ref} tabIndex={-1} onKeyDown={onKeyDown} data-testid={`${testId}.keys`}>
      <ArtifactRows items={items} now={now} sel={sel} onSel={setSel} onOpen={openIt} onLook={look}
        onPut={put1} form="panel" testId={testId} />
      {more}
    </div>
  );
}
