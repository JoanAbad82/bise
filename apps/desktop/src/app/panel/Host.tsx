// src/app/panel · PanelHost: the tabbed panel in the shell's right column (App.tsx's <Win aside>),
// so nm-panel never edits App.tsx (plan native-mac-plan v4 §3). Folded by default; ▯ and ⌥⌘0 unfold
// it (state.ts, kept per window). Its column runs the window's height: its own top row in the
// transparent 52 bar (the tabs, '+', and 'open in a window' for an artifact: mockups 3 and 4), then
// the body on --c-solid with its 1 px line. Its width is the one the tab in front asks (384 rows,
// 480 a shell, 640 a page; 320-640 by its border, kept per kind); opening animates the width in
// 220 ms (--d-base, none under reduce motion) while its inside keeps its final width, so nothing
// in it reflows and the thread beside glides. Folded, it is inert and hidden: no Tab, no
// VoiceOver reaches it (ui-review m_42482 #6). The tab in front draws; a shell's tab stays mounted
// hidden (its shell runs on, the same one when it comes back), the others mount when in front.
// The tabs of an agent no longer in the rows go (model.ts dropGone). Owner: nm-panel.
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type RefObject } from 'react';
import { AppIcon, IconButton } from '@/ds';
import { formatRoute } from '@/app/route';
import { panel } from '@/proto/words_panel.gen';
import { useProjects, useStore } from '@/store';
import { TerminalTab } from '@/terminal/Terminal';
import { MAX_W, MIN_W, type Tab } from './model';
import { dropGoneTabs, panelToggle, resetWidth, setWidth, usePanelFit, usePanelState } from './state';
import { Overview } from './Overview';
import { Launcher } from './Launcher';
import { ThingTab } from './Thing';
import { BlankBrowser } from './Browser';
import { PanelTabs, SheetToggle } from './BarTabs';
import './panel.css';

/** The tabbed panel on the window's right (--w-panel 384, from --w-panel-min to --w-panel-max). */
export function PanelHost() {
  const s = usePanelState();
  const { width, over } = usePanelFit();
  const [dragging, setDragging] = useState(false);
  useDropGone(s.tabs.list);
  const box = useRef<HTMLElement>(null);
  useSheetOut(s.open && over, box);
  const front = s.tabs.list.find((t) => t.id === s.tabs.active);
  const art = front?.what.kind === 'thing' && front.what.e.kind === 'artifact' ? front.what.e : undefined;
  return (
    <aside
      ref={box}
      className="pn"
      data-testid="app.panel"
      data-open={s.open || undefined}
      data-drag={dragging || undefined}
      data-over={over || undefined}
      aria-label={panel.panel_label}
      inert={!s.open}
      style={{ width: s.open && !over ? width : 0 }}
    >
      {s.open && <Border width={width} onDrag={setDragging} />}
      <div className="pn-col" style={{ width }}>
        <PanelTabs start={over ? <SheetToggle /> : undefined} end={art === undefined ? undefined : <WindowButton project={art.project} id={art.id} />} />
        <div className="pn-in" role="tabpanel" data-testid={`app.panel.body.${s.tabs.active}`}>
          {s.tabs.list.map((t) => (
            <Body key={t.id} tab={t} shown={s.open && t.id === s.tabs.active} />
          ))}
        </div>
      </div>
    </aside>
  );
}

/**
 * A sheet over the thread folds on esc or a click outside it (ui-review m_42642), besides its ▯:
 * the click still does what it does there. An esc a thing inside took (defaultPrevented) stays its own.
 */
function useSheetOut(on: boolean, box: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!on) return;
    const down = (e: PointerEvent) => {
      const el = box.current;
      if (el !== null && e.target instanceof Node && !el.contains(e.target)) panelToggle();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) panelToggle();
    };
    document.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      window.removeEventListener('keydown', key);
    };
  }, [on, box]);
}

/** The tab row's end over an artifact (mockup 4): the artifact in a window of its own. */
function WindowButton({ project, id }: { project: string; id: string }) {
  return (
    <IconButton
      label={panel.addr_window}
      size="bar"
      onClick={() => {
        (window as Partial<Window>).bise?.openWindow({ kind: 'artifact', route: formatRoute({ screen: 'artifacts', project, id }) });
      }}
      testId="app.panel.window"
    >
      <AppIcon name="window" size={16} />
    </IconButton>
  );
}

/** One tab's body: drawn while in front; a shell's stays mounted hidden. */
function Body({ tab, shown }: { tab: Tab; shown: boolean }) {
  const what = tab.what;
  if (what.kind === 'terminal') return <TerminalTab project={what.project} n={what.n} shown={shown} />;
  if (!shown) return null;
  switch (what.kind) {
    case 'overview':
      return <Overview pinned={what.project} shown={shown} />;
    case 'launcher':
      return <Launcher tabId={tab.id} shown={shown} artifacts={what.artifacts === true} />;
    case 'browser':
      return <BlankBrowser tabId={tab.id} shown={shown} />;
    case 'thing':
      return what.e.kind === 'tab' ? null : <ThingTab e={what.e} tabId={tab.id} />;
  }
}

/** The panel's left border: a drag sets the width of what is in front (320-640), a double click resets it. */
function Border({ width, onDrag }: { width: number; onDrag: (on: boolean) => void }) {
  const at = useRef<{ x: number; w: number } | null>(null);
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    at.current = { x: e.clientX, w: width };
    e.currentTarget.setPointerCapture(e.pointerId);
    onDrag(true);
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const a = at.current;
    if (a !== null) setWidth(a.w + (a.x - e.clientX));
  };
  const up = () => {
    at.current = null;
    onDrag(false);
  };
  return (
    <div
      className="pn-border"
      role="separator"
      aria-orientation="vertical"
      aria-label={panel.panel_width}
      aria-valuemin={MIN_W}
      aria-valuemax={MAX_W}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onDoubleClick={resetWidth}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setWidth(width + 16);
        else if (e.key === 'ArrowRight') setWidth(width - 16);
      }}
      data-testid="app.panel.border"
    />
  );
}

/**
 * The tabs of an agent that left the rows go (architect m_42089: a rename changes its key): each
 * project a tab names is read from the store once its agents came.
 */
function useDropGone(list: readonly Tab[]): void {
  const store = useStore();
  const projects = useProjects();
  const names = list.flatMap((t) => (t.what.kind === 'thing' && (t.what.e.kind === 'agent' || t.what.e.kind === 'diff' || t.what.e.kind === 'process') ? [t.what.e.project] : []));
  const key = [...new Set(names)].join('\n');
  useEffect(() => {
    if (key === '') return;
    const ps = key.split('\n');
    const check = () => {
      dropGoneTabs((p) => {
        const agents = store.agents(p);
        // no rows yet for that project (its hub not shown, the core not up): its tabs wait
        if (agents.length === 0 || !projects.some((x) => x.project === p)) return undefined;
        return new Set(agents.map((a) => a.name));
      });
    };
    check();
    const offs = ps.map((p) => store.subscribe(`agents:${p}`, check));
    return () => {
      for (const off of offs) off();
    };
  }, [store, key, projects]);
}
