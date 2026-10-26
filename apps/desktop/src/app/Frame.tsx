// The window's frame (bise fait mac, page native-mac §6, mockup 1): the bar over the whole width
// (Bar: the lights' room, the sidebar button, ‹ ›, the title and its subtitle, the page's slot,
// the panel's tabs and ▯ through <BarTabs/>, nm-panel's), the width classes (under 1000 px the
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
import { useAgents, useProjects } from "@/store";
import { formatRoute, MAIN, type Route } from "./route";
import { overOf, type Slid } from "./over";
import { type Side, useRoute, useRouter } from "./router";
import { TitleStatus } from "./TitleStatus";
import { BarTabs } from "./panel/BarTabs";
import { BarSlot, TitleSlot } from "./barslot";
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
  /** ⌘\ the sidebar; ⌥⌘0 the tabbed panel (app/panel/state.ts, nm-panel's) */
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);
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
export const STATUS_NARROW_PX = 160;

/**
 * The title bar's status slot (designer's desktop-notices v2, ambient-lead m_21070): the free room
 * between the crumb's end (+16) and the right bar's toggle (8 before it), its content right-aligned;
 * the crumb never cuts for it. It marks data-narrow when that room is under 160 px, so the pill
 * (amb-home's TitleStatus) shows its short form. The slot drags like the bar; only what it holds is
 * a no-drag region (app.css).
 */
function StatusSlot({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const read = () => {
      setNarrow(el.clientWidth < STATUS_NARROW_PX);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className="app-title-status" data-narrow={narrow} data-testid="app.title.status">
      {children}
    </div>
  );
}

/**
 * The window's bar (bise fait mac, page native-mac §6, mockup 1): 52 high over the whole width,
 * transparent on the window's vibrancy (--p-bg 30%), no rule under it, the window's drag region
 * (a double-click zooms or minimises as his Mac says: window.bise.barDoubleClick). Its lead holds
 * macOS's lights' room (x 20, 12 each, 8 apart, then 24), the sidebar button and ‹ ›, over the rail
 * and the sidebar; then the title (13/600) and its subtitle (13/400 text-2, 8 after) from 16 left of
 * the content; the status pill; the page's slot (barslot.tsx); the panel's tabs and ▯ (BarTabs,
 * nm-panel's). Its buttons 28 × 28, the icons 16, 4 apart, no-drag. Full screen keeps the lights'
 * room: nothing moves.
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
  const t = barTitleOf(route, name, place, what);
  // the window's title is what he looks at (title.ts): macOS's Window menu, Mission Control
  const winTitle = windowTitleOf(t);
  useEffect(() => {
    document.title = winTitle;
  }, [winTitle]);
  const shown = state.side || state.over === "side";
  return (
    <header
      className="app-bar"
      data-testid="app.bar"
      onDoubleClick={(e) => {
        // the bar's own ground only: a double-click on a control is the control's
        if (e.target !== e.currentTarget && (e.target as HTMLElement).closest("button, a, input, [role='button'], [role='tab']") !== null) return;
        (window as Partial<Window>).bise?.barDoubleClick();
      }}
    >
      <div className="app-bar-lead" data-testid="app.bar.lead">
        <BarButton
          icon="sidebar"
          label={shown ? frame.hide_sidebar : frame.show_sidebar}
          keys="⌘\\"
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
      </StatusSlot>
      {/* the page's search and action (barslot.tsx: a page's <InBar>) */}
      <BarSlot />
      {/* the panel's tabs and its ▯ (nm-panel's mount point) */}
      <BarTabs />
    </header>
  );
}

/** A bar button: 28 × 28, its line icon 16, its tip with its key; no-drag (app.css). */
function BarButton({ icon, label, keys, pressed, disabled, onClick, testId }: { icon: AppIconName; label: string; keys?: string; pressed?: boolean; disabled?: boolean; onClick: () => void; testId: string }) {
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
      <AppIcon name={icon} size={16} />
    </Press>
  );
}
