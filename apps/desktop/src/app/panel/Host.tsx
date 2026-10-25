// src/app/panel · PanelHost: the tabbed panel in the shell's right column (App.tsx's <Win aside>),
// so nm-panel never edits App.tsx (plan native-mac-plan v4 §3). Folded by default; ▯ and ⌥⌘0 unfold
// it (state.ts, kept per window). Its width is the one the tab in front asks (384 rows, 480 a
// shell, 640 a page; 320-640 by its border, kept per kind); opening animates the width in 220 ms
// (--d-base, none under reduce motion) while its inside keeps its final width, so nothing in it
// reflows and the thread beside glides. The tab in front draws; a shell's tab stays mounted
// hidden (its shell runs on, the same one when it comes back), the others mount when in front.
// The tabs of an agent no longer in the rows go (model.ts dropGone). Owner: nm-panel.
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { panel } from '@/proto/words_panel.gen';
import { useProjects, useStore } from '@/store';
import { TerminalTab } from '@/terminal/Terminal';
import { MAX_W, MIN_W, type Tab } from './model';
import { dropGoneTabs, resetWidth, setWidth, usePanelState, widthNow } from './state';
import { Overview } from './Overview';
import { Launcher } from './Launcher';
import { ThingTab } from './Thing';
import './panel.css';

/** The tabbed panel on the window's right (--w-panel 384, from --w-panel-min to --w-panel-max). */
export function PanelHost() {
  const s = usePanelState();
  const width = widthNow(s);
  const [dragging, setDragging] = useState(false);
  useDropGone(s.tabs.list);
  return (
    <aside
      className="pn"
      data-testid="app.panel"
      data-open={s.open || undefined}
      data-drag={dragging || undefined}
      aria-label={panel.panel_label}
      aria-hidden={!s.open || undefined}
      style={{ width: s.open ? width : 0 }}
    >
      {s.open && <Border width={width} onDrag={setDragging} />}
      <div className="pn-in" style={{ width }} role="tabpanel" data-testid={`app.panel.body.${s.tabs.active}`}>
        {s.tabs.list.map((t) => (
          <Body key={t.id} tab={t} shown={s.open && t.id === s.tabs.active} />
        ))}
      </div>
    </aside>
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
      return <Launcher tabId={tab.id} shown={shown} />;
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
