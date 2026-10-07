// The window's frame around the screens (designer's desktop-screens v6/v7,
// signed): the titlebar over the main column ('storefront › perf', the
// right panel's button '↗ artifacts · 5 ⌥⌘0'), the width classes (under
// 1000 px the sidebar is hidden and slides over the window with a 45%
// scrim, esc or a click outside closes it, and the titlebar shows the
// sidebar button (⌘\) and 'n waiting' in the accent), and which of the
// sidebar and the right panel show. Owner: amb-win.
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Pearl } from '@/ds';
import { useProjects } from '@/store';
import { keep } from './keep';
import { useArtifactCount } from './Panel';
import { formatRoute } from './route';
import { useRoute } from './router';
import { crumbOf, NARROW_PX, PANEL_OPEN_PX, panelAt, panelProject } from './side';
import { useWaitingTotal } from './Sidebar';

export type Width = 'narrow' | 'mid' | 'wide';

const widthOf = (w: number): Width => (w < NARROW_PX ? 'narrow' : w < PANEL_OPEN_PX ? 'mid' : 'wide');

/** The window's width class: re-renders its reader only when it crosses 1000 or 1100 px. */
export function useWidth(): Width {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('resize', cb);
      return () => {
        window.removeEventListener('resize', cb);
      };
    },
    () => widthOf(window.innerWidth),
  );
}

const WIDE_PX: Record<Width, number> = { narrow: NARROW_PX - 1, mid: NARROW_PX, wide: PANEL_OPEN_PX };

/** A kept yes/no of the frame (no age: the sidebar hidden, the panel shown). */
function useKeptFlag(key: string): readonly [boolean | undefined, (v: boolean) => void] {
  const [v, set] = useState<boolean | undefined>(() => {
    const k = keep.view(key);
    return typeof k === 'boolean' ? k : undefined;
  });
  return [
    v,
    (next: boolean) => {
      keep.setView(key, next);
      set(next);
    },
  ];
}

export interface FrameState {
  readonly width: Width;
  /** the sidebar in its column */
  readonly side: boolean;
  /** what slides over the window now (under 1000 px, or the sidebar hidden by ⌘\) */
  readonly over: 'side' | 'panel' | null;
  /** the panel's project and whether it shows docked */
  readonly panel: { readonly project: string; readonly name: string; readonly docked: boolean } | undefined;
  readonly toggle: (what: 'sidebar' | 'panel') => void;
  readonly close: () => void;
}

/** Which of the sidebar and the right panel show, from the width, his kept choices and the route. */
export function useFrame(): FrameState {
  const width = useWidth();
  const route = useRoute();
  const rows = useProjects();
  const home = rows.find((p) => p.home)?.project;
  const [hidden, setHidden] = useKeptFlag('frame.side.hidden');
  const [kept, setKept] = useKeptFlag('frame.panel');
  // what slid over, for the route it opened on: a move closes it (he picked a row in it)
  const at_ = formatRoute(route);
  const [slid, setSlid] = useState<{ what: 'side' | 'panel'; at: string } | null>(null);
  const over = slid !== null && slid.at === at_ ? slid.what : null;
  const setOver = (f: (o: 'side' | 'panel' | null) => 'side' | 'panel' | null) => {
    const next = f(over);
    setSlid(next === null ? null : { what: next, at: at_ });
  };
  const side = width !== 'narrow' && hidden !== true;
  const project = panelProject(route, home, rows.filter((p) => !p.home).length);
  const row = rows.find((p) => p.project === project);
  const at = panelAt(WIDE_PX[width], kept);
  const panel = project === undefined ? undefined : { project, name: project === '' ? 'all projects' : (row?.name ?? project), docked: at.docked && at.open };
  return {
    width,
    side,
    over,
    panel,
    toggle: (what) => {
      if (what === 'sidebar') {
        if (width === 'narrow') setOver((o) => (o === 'side' ? null : 'side'));
        else setHidden(side);
        return;
      }
      if (project === undefined) return;
      if (at.docked) setKept(!at.open);
      else setOver((o) => (o === 'panel' ? null : 'panel'));
    },
    close: () => {
      setSlid(null);
    },
  };
}

/** What slides over the window: its content on one side, a 45% scrim over the rest; esc or a click outside closes it. */
export function Over({ side, onClose, children }: { side: 'left' | 'right'; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);
  return (
    <>
      <div className="app-scrim" onClick={onClose} data-testid="app.scrim" />
      <div className={`app-over ${side}`} data-testid={`app.over.${side}`}>
        {children}
      </div>
    </>
  );
}

/** The titlebar over the main column: the sidebar button and what waits when the sidebar is away, the crumb, the panel's button. */
export function Titlebar({ frame }: { frame: FrameState }) {
  const route = useRoute();
  const rows = useProjects();
  const waits = useWaitingTotal();
  const count = useArtifactCount(frame.panel?.project);
  const name = (p: string) => rows.find((r) => r.project === p)?.name ?? p;
  const crumb = crumbOf(route, name);
  const panelOn = frame.panel !== undefined && (frame.panel.docked || frame.over === 'panel');
  return (
    <div className={frame.side ? 'app-title' : 'app-title away'} data-testid="app.title">
      {!frame.side && (
        <>
          <span className="app-title-lights" />
          <button type="button" className="app-title-tg" aria-label="show the sidebar" title="sidebar ⌘\" aria-expanded={frame.over === 'side'}
            onClick={() => { frame.toggle('sidebar'); }} data-testid="app.title.sidebar">
            <span />
          </button>
          {waits > 0 && (
            <button type="button" className="app-title-wait" onClick={() => { frame.toggle('sidebar'); }} data-testid="app.title.waiting">
              <Pearl size={14} mood="need" />
              {waits} waiting
            </button>
          )}
        </>
      )}
      <span className="app-crumb" data-testid="app.title.crumb">
        {crumb.map((c, i) => (
          <span key={`${String(i)} ${c}`} className={i === crumb.length - 1 ? 'last' : undefined}>
            {i > 0 && <span className="app-crumb-sep">›</span>}
            {c}
          </span>
        ))}
      </span>
      {frame.panel !== undefined && (
        <button type="button" className={panelOn ? 'app-title-btn on' : 'app-title-btn'} aria-pressed={panelOn}
          onClick={() => { frame.toggle('panel'); }} data-testid="app.title.panel">
          ↗ {frame.width === 'narrow' ? String(count) : `artifacts · ${String(count)}`} <kbd>⌥⌘0</kbd>
        </button>
      )}
    </div>
  );
}
