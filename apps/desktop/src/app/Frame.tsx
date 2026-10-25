// The window's frame around the screens (designer's desktop-screens v6/v7,
// signed): the titlebar over the main column ('storefront › perf'), the
// width classes (under 1000 px the sidebar is hidden and slides over the
// window with a 45% scrim, esc or a click outside closes it, and the titlebar
// shows the sidebar button (⌘\) and 'n waiting' in the accent), and whether
// the sidebar shows; the tabbed panel's tabs and its ▯ mount in the title bar
// (<BarTabs/>), its state is app/panel/state.ts (nm-panel's). Owner: nm-frame (bise fait mac; amb-win before).
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Chip, IconButton, Kbd, Pearl, PickerPop, Press } from "@/ds";
import { useModHeld } from "./held";
import { useProjects } from "@/store";
import { formatRoute, type Route } from "./route";
import { overOf, type Slid } from "./over";
import { type Side, useRoute, useRouter } from "./router";
import { TitleStatus } from "./TitleStatus";
import { BarTabs } from "./panel/BarTabs";
import { BarSlot } from "./barslot";
import { frameLeft, useLeft } from "./frame-state";
import { SIDE, sideWidthOf, UNFOLD_PX } from "./resize";
import { crumbGoOf, crumbOf, NARROW_PX, PANEL_OPEN_PX } from "./side";
import { useWaitingTotal } from "./Sidebar";
import { panelToggle, usePanelBox } from "./panel/state";
import { usePlaceCrumb } from "@/artifacts/crumb";

export type Width = "narrow" | "mid" | "wide";

const widthOf = (w: number): Width =>
  w < NARROW_PX ? "narrow" : w < PANEL_OPEN_PX ? "mid" : "wide";

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
 * ‹ › right after the lights (designer's desktop-history; amb-web, m_19808): 28 px, 4 px apart.
 * Nothing on a side: that arrow stays, faint at 45%, no hover, no tooltip, so the crumb never
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
    const label = side === "back" ? "back" : "forward";
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
        <IconButton
          label={label}
          keys={can ? (side === "back" ? "⌘[" : "⌘]") : ""}
          state={can ? undefined : "disabled"}
          onClick={() => {
            if (long.current) return;
            if (side === "back") router.back();
            else router.forward();
          }}
          testId={`app.title.${label}`}
        >
          {side === "back" ? "‹" : "›"}
        </IconButton>
        {cmd && can && (
          <span className="app-keyhint float" data-testid={`app.title.${label}.hint`}>
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
                  testId: `app.title.${label}.place`,
                })),
              },
            ]}
            onPick={(id) => {
              setMenu(null);
              router.jump(side, Number(id));
            }}
            onClose={closeMenu}
            testId={`app.title.${label}.menu`}
          />
        )}
      </span>
    );
  };
  return (
    <span className="app-hist" data-testid="app.title.history">
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

/** The titlebar over the main column: the sidebar button and what waits when the sidebar is away, the crumb, the panel's button. */
export function Titlebar({ frame }: { frame: FrameState }) {
  const route = useRoute();
  const router = useRouter();
  const rows = useProjects();
  const waits = useWaitingTotal();
  const name = (p: string) => rows.find((r) => r.project === p)?.name ?? p;
  // the artifacts library's place after 'artifacts' (artifacts/crumb.ts)
  const place = usePlaceCrumb();
  const crumb = crumbOf(route, name, place);
  // an earlier crumb's route, by its place (the last: where he is, no route) — crumbGoOf, pure
  const go = crumbGoOf(route, name, place).map((s) => s.go);
  return (
    <div
      className={frame.side ? "app-title" : "app-title away"}
      data-testid="app.title"
    >
      {!frame.side && (
        <>
          <span className="app-title-lights" />
          <IconButton
            label="sidebar"
            keys="⌘\\"
            size="bar"
            pressed={frame.over === "side"}
            onClick={() => {
              frame.toggle("sidebar");
            }}
            testId="app.title.sidebar"
          >
            <span className="app-tg-glyph" aria-hidden="true">
              <span />
            </span>
          </IconButton>
          {waits > 0 && (
            <Chip
              tone="acc"
              onClick={() => {
                frame.toggle("sidebar");
              }}
              testId="app.title.waiting"
            >
              <Pearl size={14} mood="need" />
              {waits} waiting
            </Chip>
          )}
        </>
      )}
      <HistoryArrows name={name} />
      <span className="app-crumb" data-testid="app.title.crumb">
        {crumb.map((c, i) => (
          <span
            key={`${String(i)} ${c}`}
            className={i === crumb.length - 1 ? "last" : undefined}
          >
            {i > 0 && <span className="app-crumb-sep">›</span>}
            {go[i] === undefined ? (
              c
            ) : (
              // an earlier crumb goes where it names (his ask): the project's main, that agent,
              // that screen; the last one is where he is, plain
              <Press
                look="app-crumb-go"
                onClick={() => {
                  router.go(go[i] as Route);
                }}
                data-testid={`app.title.crumb.${String(i)}`}
              >
                {c}
              </Press>
            )}
          </span>
        ))}
      </span>
      <StatusSlot>
        <TitleStatus />
      </StatusSlot>
      {/* the page's search and action (barslot.tsx: a page's <InBar>) */}
      <BarSlot />
      {/* bise fait mac: the panel's tabs in the bar (nm-panel's mount point) */}
      <BarTabs />
    </div>
  );
}
