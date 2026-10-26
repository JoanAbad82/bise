// The window's frame (bise fait mac, page native-mac §6, mockup 1): one bar across the top (Bar:
// the lights' room, the sidebar button, ‹ ›, the title and its subtitle, the page's slot, ▯ through
// <BarTabs/>, nm-panel's; the open panel's tabs sit in the same row over its column, app.css),
// the width classes (under 1000 px the
// sidebar slides over the window with a 45% scrim, esc or a click outside closes it), and whether
// the sidebar shows (its kept state: frame-state.ts; ⌘\ and the bar's button hide and show it in
// 220 ms). The tabbed panel's state is app/panel/state.ts (nm-panel's). Owner: nm-frame.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AppIcon, Kbd, PickerPop, Press, tipAttrs, type AppIconName } from "@/ds";
import { frame } from "@/proto/words_frame.gen";
import { useModHeld } from "./held";
import { FRAME_KEYS } from "./keys";
import { useAgents, useProjects } from "@/store";
import { usePluginTitle } from "@/plugins/title";
import { formatRoute, MAIN, type Route } from "./route";
import { overOf, type Slid } from "./over";
import { type Side, useRoute, useRouter } from "./router";
import { TitleStatus } from "./TitleStatus";
import { giveWay, STATUS_NARROW_PX } from "./giveway";
import { CoinSlot } from "./side3d/Minis";
import { useEscLayer } from "./escape";
import { BarTabs } from "./panel/BarTabs";
import { BarSlot, barGroundDoubleClick, TitleSlot } from "./barslot";
import { frameLeft, useLeft } from "./frame-state";
import { SIDE, sideWidthOf, UNFOLD_PX } from "./resize";
import { crumbOf, NARROW_PX, PANEL_OPEN_PX } from "./side";
import { barTitleOf, stateFactOf, windowTitleOf, type StateFact } from "./title";
import { useNow } from "./clock";
import { panelToggle, usePanelBox } from "./panel/state";
import { usePlaceCrumb } from "@/artifacts/crumb";

export type Width = "narrow" | "mid" | "wide";

const widthOf = (w: number): Width =>
  w < NARROW_PX ? "narrow" : w < PANEL_OPEN_PX ? "mid" : "wide";

/** The sidebar border's VoiceOver name (App.tsx's Splitter). */
export const SIDEBAR_WIDTH_LABEL = frame.sidebar_width;

/** The window's width class: re-renders its reader only when it crosses 1000 or 1100 px. */
export function useWidth(): Width {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => {
        window.removeEventListener("resize", cb);
      };
    },
    () => widthOf(window.innerWidth),
  );
}

export interface FrameState {
  readonly width: Width;
  /** the sidebar in its column */
  readonly side: boolean;
  /** what slides over the window now (under 1000 px, or the sidebar hidden by ⌘\) */
  readonly over: "side" | null;
  /** ⌘B the sidebar; ⌥⌘B the tabbed panel (app/panel/state.ts, nm-panel's); keys.ts FRAME_KEYS */
  readonly toggle: (what: "sidebar" | "panel") => void;
  readonly close: () => void;
  /** the sidebar's width (kept), and what a drag on its border does */
  readonly sideW: number;
  readonly resize: (what: "side", want: number) => void;
  readonly reset: (what: "side") => void;
}

/** Whether the sidebar shows, from the width and his kept choice; the panel is app/panel/state.ts's. */
export function useFrame(): FrameState {
  const width = useWidth();
  const route = useRoute();
  // the sidebar's kept state: one store, read by the right side too (frame-state.ts)
  const { hidden, width: sideW } = useLeft();
  const setHidden = frameLeft.hide;
  const setSideW = frameLeft.width;
  // what slid over, for the route and the width class it opened on (overOf, over.ts); only the
  // sidebar slides over now (the tabbed panel docks or folds: app/panel)
  const at_ = formatRoute(route);
  const [slid, setSlid] = useState<Slid | null>(null);
  const over = overOf(slid, at_, width) === "side" ? ("side" as const) : null;
  const setOver = (f: (o: "side" | null) => "side" | null) => {
    const next = f(over);
    setSlid(next === null ? null : { what: next, at: at_, width });
  };
  const side = width !== "narrow" && !hidden;
  const panelW = usePanelBox().width;
  return {
    width,
    side,
    over,
    toggle: (what) => {
      if (what === "panel") {
        panelToggle();
        return;
      }
      if (width === "narrow") setOver((o) => (o === "side" ? null : "side"));
      else setHidden(side);
    },
    close: () => {
      setSlid(null);
    },
    sideW,
    resize: (_what, want) => {
      // folded (⌘\ or a drag under 160): a drag out of the fold opens it at 200
      if (!side) {
        if (want >= UNFOLD_PX) {
          setSideW(Math.max(sideW, SIDE.reopen));
          setHidden(false);
        }
        return;
      }
      const w = sideWidthOf(want, window.innerWidth, panelW);
      if (w === "fold") setHidden(true);
      else if (w !== sideW) setSideW(w);
    },
    reset: () => {
      setSideW(SIDE.def);
    },
  };
}

/** What slides over the window: its content on one side, a 45% scrim over the rest; esc or a click outside closes it. */
export function Over({
  side,
  onClose,
  children,
  thread = false,
}: {
  side: "left" | "right";
  onClose: () => void;
  children: ReactNode;
  /** an artifact's maker thread sliding over the page under 1000 px (78% of the width) */
  thread?: boolean;
}) {
  // its esc in esc's one order (app/escape.ts, 2)
  useEscLayer("over", true, onClose);
  return (
    <>
      <div className={`app-scrim ${side}`} onClick={onClose} data-testid="app.scrim" />
      <div className={`app-over ${side}${thread ? " thread" : ""}`} data-testid={`app.over.${side}`}>
        {children}
      </div>
    </>
  );
}

/** How many places the ‹ › menu lists (designer's desktop-history: 10, the nearest at the top). */
const MENU_PLACES = 10;
/** A press this long on ‹ or › opens its menu, as a right-click (Safari's). */
const LONG_PRESS_MS = 500;

/**
 * ‹ › after the sidebar button (designer's desktop-history; bise fait mac: the line icons): 28 px, 4
 * px apart. Nothing on a side: that arrow stays, faint, no hover, no tooltip, so the title never
 * moves. A right-click or a long press opens the last 10 places on that side (the ds menu).
 */
function HistoryArrows({ name }: { name: (p: string) => string }) {
  const router = useRouter();
  useRoute();
  const [menu, setMenu] = useState<Side | null>(null);
  // ⌘ held: ⌘[ ⌘] under the arrows that can go (held.ts, designer m_21510)
  const cmd = useModHeld("Meta");
  const press = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const long = useRef(false);
  const backAt = useRef<HTMLSpanElement>(null);
  const forwardAt = useRef<HTMLSpanElement>(null);
  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);
  const arrow = (side: Side) => {
    const can = side === "back" ? router.canBack() : router.canForward();
    const label = side === "back" ? frame.back : frame.forward;
    const open = () => {
      if (can) setMenu(side);
    };
    return (
      <span
        ref={side === "back" ? backAt : forwardAt}
        className="app-hist-arrow"
        // a mouse press never takes focus (designer m_19953): the ring is for the keyboard, and a
        // later key (the menu's esc) would light it on the pressed arrow; Tab still reaches them
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          open();
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          long.current = false;
          clearTimeout(press.current);
          press.current = setTimeout(() => {
            long.current = true;
            open();
          }, LONG_PRESS_MS);
        }}
        onPointerUp={() => {
          clearTimeout(press.current);
        }}
        onPointerLeave={() => {
          clearTimeout(press.current);
        }}
      >
        <Press
          look="app-bar-b"
          aria-label={label}
          disabled={!can}
          {...tipAttrs(can ? frame.tip_key({ what: label, key: side === "back" ? "⌘[" : "⌘]" }) : undefined)}
          onClick={() => {
            if (long.current) return;
            if (side === "back") router.back();
            else router.forward();
          }}
          data-testid={`app.bar.${side}`}
        >
          <AppIcon name={side} size={16} />
        </Press>
        {cmd && can && (
          <span className="app-keyhint float" data-testid={`app.bar.${side}.hint`}>
            <Kbd>{side === "back" ? "⌘[" : "⌘]"}</Kbd>
          </span>
        )}
        {menu === side && (
          <PickerPop
            anchor={side === "back" ? backAt : forwardAt}
            align="start"
            groups={[
              {
                id: "places",
                rows: router.places(side, MENU_PLACES).map((r, i) => ({
                  id: String(i + 1),
                  name: crumbOf(r, name).join(" › "),
                  testId: `app.bar.${side}.place`,
                })),
              },
            ]}
            onPick={(id) => {
              setMenu(null);
              router.jump(side, Number(id));
            }}
            onClose={closeMenu}
            testId={`app.bar.${side}.menu`}
          />
        )}
      </span>
    );
  };
  return (
    <span className="app-hist" data-testid="app.bar.history">
      {arrow("back")}
      {arrow("forward")}
    </span>
  );
}

/** under this much room the status pill takes its short form (designer's desktop-notices v2) */
export { STATUS_NARROW_PX };

/**
 * The title bar's status slot (designer's desktop-notices v2, ambient-lead m_21070): the free room
 * between the crumb's end (+16) and the right bar's toggle (8 before it), its content right-aligned:
 * the status pill, then the coins' minis when the thread has no room for them (folded-side v9).
 * When the room runs short they never shrink and give way in order (giveway.ts, designer m_45616,
 * m_45674): the crumb's fact hides (the bar's data-give), then the pill takes its short form
 * (data-narrow, also under 160 px of room for it), never a word cut; last the crumb's name cuts.
 * The slot drags like the bar; only what it holds is a no-drag region (app.css).
 */
function StatusSlot({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const bar = el?.parentElement;
    if (el === null || bar === null || bar === undefined) return;
    // what the fact takes, and the pill's long width, kept from when they were last shown whole
    let factRoom = 0;
    let pillFull = 0;
    const read = () => {
      const factHidden = bar.dataset["give"] === "fact";
      const fact = bar.querySelector<HTMLElement>('[data-testid="app.bar.title.fact"]');
      if (fact !== null && !factHidden) factRoom = fact.offsetWidth + parseFloat(getComputedStyle(fact.parentElement ?? fact).columnGap || "0");
      if (fact === null) factRoom = 0;
      const pill = el.querySelector<HTMLElement>(".app-ts");
      const words = pill?.querySelector<HTMLElement>(".app-ts-words") ?? null;
      if (pill === null) pillFull = 0;
      else if (el.dataset["narrow"] !== "true" && words !== null) pillFull = pill.offsetWidth + Math.max(0, words.scrollWidth - words.clientWidth);
      const minis = el.querySelector<HTMLElement>(".s3-minis-slot");
      const minisW = minis === null || minis.childElementCount === 0 ? 0 : minis.offsetWidth + parseFloat(getComputedStyle(minis).marginLeft || "0");
      const g = giveWay({ slot: el.clientWidth - (factHidden ? factRoom : 0), fact: factRoom, pill: pillFull, minis: minisW });
      if (g.fact) bar.dataset["give"] = "fact";
      else delete bar.dataset["give"];
      setNarrow(g.narrow || (pill !== null && el.clientWidth - minisW < STATUS_NARROW_PX));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    // a pill or the minis come and go, the crumb's fact changes: read again
    const mo = new MutationObserver(read);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
      delete bar.dataset["give"];
    };
  }, []);
  return (
    <div ref={ref} className="app-title-status" data-narrow={narrow} data-testid="app.title.status">
      {children}
    </div>
  );
}

/**
 * The window's bar (bise fait mac, page native-mac §6, mockup 1): 52 high over the rail, the sidebar
 * and the screen, transparent on the window's vibrancy (--p-bg 30%), no rule under it, the window's
 * drag region (a double-click zooms or minimises as his Mac says: barslot.tsx barGroundDoubleClick).
 * With the panel beside the thread, the panel's tab row continues it over the panel's column, the
 * same height and material: one bar (his m_44307); the bar's right group then ends on the thread's
 * right edge, never over the tabs (app.css). Its lead holds macOS's lights' room (x 20, 12 each, 8
 * apart, then 24), the sidebar button and ‹ ›, over the rail and the sidebar; then the title
 * (13/600) and its subtitle (13/400 text-2, 8 after) from 16 left of the content; the status pill;
 * the page's slot (barslot.tsx); ▯ (BarTabs, nm-panel's). Its buttons 28 × 28, the icons 16, 4
 * apart, no-drag. Full screen keeps the lights' room: nothing moves.
 */
/** The thread's agent's own title ('profiling the hub'), first in the bar's subtitle; '' elsewhere and on a project's main. */
function useAgentTitle(route: Route): string {
  const project = route.screen === "thread" ? route.project : "";
  const agents = useAgents(project);
  if (route.screen !== "thread" || route.agent === MAIN) return "";
  return agents.find((a) => a.name === route.agent)?.title ?? "";
}

/** The thread's agent's state, the subtitle's one fact (title.ts stateFactOf; designer m_43892, nm-thread's declared exception). */
function useStateFact(route: Route): StateFact | null {
  const project = route.screen === "thread" ? route.project : "";
  const agents = useAgents(project);
  const now = useNow();
  if (route.screen !== "thread") return null;
  return stateFactOf(agents.find((a) => a.name === route.agent), now);
}

export function Bar({ frame: state }: { frame: FrameState }) {
  const route = useRoute();
  const router = useRouter();
  const rows = useProjects();
  const name = (p: string) => rows.find((r) => r.project === p)?.name ?? p;
  // the artifacts library's place after 'artifacts' (artifacts/crumb.ts)
  const place = usePlaceCrumb();
  const what = useAgentTitle(route);
  const fact = useStateFact(route);
  // a plugin's page: its title in the bar ('Linear'), never its id (nm-pages-b, ui-review m_43947 #1)
  // (installed or still in the browse lists: the same title as its banner, m_44027)
  const plugin = usePluginTitle();
  const t = barTitleOf(route, name, place, what, plugin);
  // the window's title is what he looks at (title.ts): macOS's Window menu, Mission Control
  const winTitle = windowTitleOf(t);
  useEffect(() => {
    document.title = winTitle;
  }, [winTitle]);
  const shown = state.side || state.over === "side";
  // ⌘ held: the sidebar button shows ⌘B in place of its glyph (designer m_45008)
  const cmdHeld = useModHeld("Meta");
  return (
    <header
      className="app-bar"
      data-testid="app.bar"
      onDoubleClick={barGroundDoubleClick}
    >
      <div className="app-bar-lead" data-testid="app.bar.lead">
        <BarButton
          icon="sidebar"
          label={shown ? frame.hide_sidebar : frame.show_sidebar}
          keys={FRAME_KEYS.sidebar}
          hint={cmdHeld}
          pressed={false}
          onClick={() => {
            state.toggle("sidebar");
          }}
          testId="app.bar.sidebar"
        />
        <HistoryArrows name={name} />
      </div>
      <div className="app-bar-title" data-testid="app.bar.title">
        <TitleSlot text={t.title} />
        {t.sub.length > 0 && (
          <span className="s" data-testid="app.bar.title.sub">
            {t.sub.map((p, i) => (
              <span key={`${String(i)} ${p.c}`}>
                {i > 0 && " · "}
                {p.go === undefined ? (
                  p.c
                ) : (
                  // an earlier part of where he is goes there (his ask): the project's main, that agent
                  <Press
                    look="app-bar-go"
                    onClick={() => {
                      router.go(p.go as Route);
                    }}
                    data-testid={`app.bar.title.go.${String(i)}`}
                  >
                    {p.c}
                  </Press>
                )}
              </span>
            ))}
          </span>
        )}
        {/* the thread's agent's state, one fact: waits on him (the ask icon in the accent), else working, text-3 */}
        {fact !== null && (
          <span className="app-bar-fact" data-kind={fact.kind} data-testid="app.bar.title.fact">
            {fact.kind === "waits" && <AppIcon name="ask" size={14} />}
            {fact.text}
          </span>
        )}
      </div>
      <StatusSlot>
        <TitleStatus />
        {/* no room for the coins beside the thread: their minis, right-aligned, 12 after the pill (side3d Minis, folded-side v9, designer m_45616) */}
        <CoinSlot at="header" />
      </StatusSlot>
      {/* the page's search and action (barslot.tsx: a page's <InBar>) */}
      <BarSlot />
      {/* the panel's tabs and its ▯ (nm-panel's mount point) */}
      <BarTabs />
    </header>
  );
}

/** A bar button: 28 × 28, its line icon 16, its tip with its key; no-drag (app.css). */
/** a title bar button; `hint`: its modifier is held, its key shows as a keycap in place of its glyph (held.ts) */
function BarButton({ icon, label, keys, hint, pressed, disabled, onClick, testId }: { icon: AppIconName; label: string; keys?: string; hint?: boolean; pressed?: boolean; disabled?: boolean; onClick: () => void; testId: string }) {
  return (
    <Press
      look="app-bar-b"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      {...tipAttrs(keys === undefined || keys === "" ? label : frame.tip_key({ what: label, key: keys }))}
      onClick={onClick}
      data-testid={testId}
    >
      {hint === true && keys !== undefined && keys !== "" ? (
        <span className="app-keyhint" data-testid={`${testId}.hint`}>
          <Kbd>{keys}</Kbd>
        </span>
      ) : (
        <AppIcon name={icon} size={16} />
      )}
    </Press>
  );
}
