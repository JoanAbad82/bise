// src/app/panel · BarTabs: the panel's tabs in the window's transparent bar (page native-mac §6:
// 28 high, padding 0 12, r 8, 13/500, the icon 14, 160 at most with '…', × on the active one and
// on hover; '+' 28 opens New tab), six at most (HIG) and the rest behind an overflow button whose
// native menu lists them; a drag reorders; a right click is the tab's menu (nm-menus'
// useEntityMenu({ kind: 'tab', id })). The ▯ button folds and unfolds the panel (⌥⌘0). Mounted by
// Frame.tsx's title bar, so nm-panel never edits Frame.tsx (plan native-mac-plan v4 §3).
// The tabs show while the panel is open; folded, only ▯. Owner: nm-panel.
import { useState, type DragEvent, type KeyboardEvent } from 'react';
import { AppIcon, IconButton, tipAttrs } from '@/ds';
import { panel } from '@/proto/words_panel.gen';
import { useEntityMenu } from '@/app/menus/use';
import { shownOf, type Tab } from './model';
import { activateTab, closeTabId, moveTabTo, openLauncher, panelToggle, usePanelState } from './state';
import { useTabLooks, type TabLook } from './look';
import { PANEL_KEYS } from './keys';

/** The panel's tabs, in the bar over the panel, and its ▯. */
export function BarTabs() {
  const s = usePanelState();
  const look = useTabLooks();
  const { shown, over } = shownOf(s.tabs);
  const [drag, setDrag] = useState<string | null>(null);
  return (
    <div className="pn-bar" data-testid="app.panel.bar" data-open={s.open || undefined}>
      {s.open && (
        <div className="pn-tabs" role="tablist" aria-label={panel.tabs_label} data-testid="app.panel.tabs">
          {shown.map((t) => (
            <BarTab
              key={t.id}
              tab={t}
              look={look(t)}
              on={t.id === s.tabs.active}
              dragging={drag === t.id}
              onDragStart={() => {
                setDrag(t.id);
              }}
              onDropAt={() => {
                if (drag !== null && drag !== t.id) moveTabTo(drag, s.tabs.list.indexOf(t));
                setDrag(null);
              }}
              onDragEnd={() => {
                setDrag(null);
              }}
            />
          ))}
          {over.length > 0 && <OverButton over={over} look={look} />}
          <IconButton label={panel.tab_add({ key: PANEL_KEYS.add })} size="bar" onClick={openLauncher} testId="app.panel.add">
            <AppIcon name="plus" size={16} />
          </IconButton>
        </div>
      )}
      <IconButton label={panel.panel_toggle({ key: PANEL_KEYS.toggle })} size="bar" pressed={s.open} onClick={panelToggle} testId="app.panel.toggle">
        <AppIcon name="panel" size={16} />
      </IconButton>
    </div>
  );
}

function BarTab({ tab, look, on, dragging, onDragStart, onDropAt, onDragEnd }: {
  tab: Tab;
  look: TabLook;
  on: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDropAt: () => void;
  onDragEnd: () => void;
}) {
  const menu = useEntityMenu({ kind: 'tab', id: tab.id });
  const [near, setNear] = useState(false);
  const pick = () => {
    activateTab(tab.id);
  };
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick();
    }
  };
  const close = panel.tab_close({ key: PANEL_KEYS.close });
  return (
    <div
      className="pn-tab"
      role="tab"
      tabIndex={0}
      aria-selected={on}
      aria-label={look.title}
      {...tipAttrs(look.title)}
      data-on={on || undefined}
      data-drag={dragging || undefined}
      data-near={near || undefined}
      data-testid={`app.panel.tab.${tab.id}`}
      draggable
      onClick={pick}
      onKeyDown={keys}
      onContextMenu={menu.onContextMenu}
      onDragStart={(e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setNear(true);
      }}
      onDragLeave={() => {
        setNear(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setNear(false);
        onDropAt();
      }}
      onDragEnd={onDragEnd}
    >
      {look.icon}
      <span className="pn-tab-t">{look.title}</span>
      <button
        type="button"
        className="pn-tab-x"
        aria-label={close}
        {...tipAttrs(close)}
        tabIndex={on ? 0 : -1}
        onClick={(e) => {
          e.stopPropagation();
          closeTabId(tab.id);
        }}
        data-testid={`app.panel.tab.${tab.id}.close`}
      >
        <AppIcon name="close" size={14} />
      </button>
    </div>
  );
}

/** Past six tabs: a button whose native menu lists the rest; a pick brings it to the front. */
function OverButton({ over, look }: { over: readonly Tab[]; look: (t: Tab) => TabLook }) {
  const words = panel.tabs_more({ n: over.length });
  return (
    <button
      type="button"
      className="pn-over"
      aria-label={words}
      aria-haspopup="menu"
      {...tipAttrs(words)}
      data-testid="app.panel.over"
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        const bise = (window as Partial<Window>).bise;
        void bise?.popupMenu(over.map((t) => ({ id: t.id, label: look(t).title })), { x: box.left, y: box.top, width: box.width, height: box.height }).then((id) => {
          if (id !== null) activateTab(id);
        });
      }}
    >
      <AppIcon name="down" size={14} />
      <span>{over.length}</span>
    </button>
  );
}
