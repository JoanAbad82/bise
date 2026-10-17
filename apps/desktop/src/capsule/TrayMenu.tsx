// The tray's dropdown (the capsule at 'menu'): its head ('3 at work · 1 waiting for you'), the
// inbox block rows (one-inbox 3), the projects (MenuProjects), then open bise / inbox / settings /
// quit. A live project opens its submenu (his ask, main m_29563; designer m_29577): its live
// agents in a second column of the same glass (the window is the glass, glass.ts: it grows 340 →
// 620 while the submenu is open, on the side the screen has room, the menu never moves), its rows
// level with the project's row. A native menu's feel: the pointer selects the row it is on (the
// ds 9% tint), a live project's submenu opens after 150 ms on it, a diagonal move toward the
// submenu keeps it (the safe triangle); ↑↓ move the row, ⏎ opens, → opens a submenu, ← goes back,
// esc closes the submenu, then the menu.
import { useEffect, useLayoutEffect, useRef, useState, type JSX, type MouseEvent, type RefObject } from "react";
import { shownName } from "@/agents/model";
import { inbox } from "@/proto/words_inbox.gen";
import { Menu, MenuItem, MenuSep, Row } from "@/ds";
import { useNow } from "@/app/clock";
import type { SpotCard, SpotData } from "@/spotlight";
import { MenuProjects, PROJECTS_MORE, lineKey } from "./MenuProjects";
import { hasProjects, isLive, menuCounts, projectLines, type ProjectLine } from "./projects";
import { ageShort, inTriangle, subAgents, subHead, subSide, type Pt } from "./projsum";

export const MW = {
  openBise: "open bise",
  inbox: "inbox",
  settings: "settings…",
  quit: "quit bise",
  head: (work: number, waits: number): string =>
    `${work > 0 ? `${work} at work` : "nobody at work"}${waits > 0 ? ` · ${waits} waiting for you` : ""}`,
  // never 'open bise' twice: the menu's own item says it (designer m_21314); a click opens ⌘I
  more: (n: number): string => `+ ${String(n)} more in the inbox`,
  // the submenu's last row: the project's main thread (designer m_29577)
  openProject: (name: string): string => `open ${name}`,
} as const;

/** The tray menu lists this many waiting items; the rest is '+ N more in the inbox', a click opens it (one-inbox 3). */
export const MENU_ROWS = 5;

/** A live project's submenu opens after the pointer rests this long on it (designer m_29577). */
export const HOVER_MS = 150;
/** A move inside the safe triangle waits this long before the row under it takes the submenu over. */
const TRIANGLE_MS = 300;
/** A second esc this soon after one that closed the submenu is the same key (the page's and the helper's). */
const ESC_TWICE_MS = 400;

const MARK: Record<SpotCard["kind"], string> = { question: "?", approval: "!", drafts: "✉" };
const firstLine = (s: string): string => s.split("\n")[0] ?? "";

/**
 * The items the tray menu lists under its head: the window's inbox block rows, in its order (the
 * hub's rank, then the oldest: data.ts), at most MENU_ROWS. fn+n opens row n. Pure.
 */
export function menuCards(spot: SpotData): readonly SpotCard[] {
  return spot.cards.slice(0, MENU_ROWS);
}

/** A row the keyboard can stand on: its test id, what ⏎ does, its project line when it has a submenu. */
interface Item {
  readonly k: string;
  readonly act: () => void;
  readonly line?: ProjectLine;
}

const SUB = "capsule.menu.sub";
const subKey = (name: string): string => `${SUB}.agent.${name}`;
const SUB_OPEN = `${SUB}.open`;

export interface TrayMenuProps {
  readonly spot: SpotData;
  readonly onOpenWindow: (route?: string) => void;
  readonly onOpenCard: (id: string) => void;
  readonly onQuit: (() => void) | null;
  readonly onClose: () => void;
  /** the helper's esc (plain esc while the capsule has the keys) asks here first: true, the menu used it */
  readonly escRef?: RefObject<(() => boolean) | null>;
}

export function TrayMenu({ spot, onOpenWindow, onOpenCard, onQuit, onClose, escRef }: TrayMenuProps): JSX.Element {
  const counts = menuCounts(spot);
  const rows = menuCards(spot);
  const more = spot.cards.length - rows.length;
  const lines = hasProjects(spot) ? projectLines(spot) : { lines: [], more: 0 };
  const now = useNow();

  const [sel, setSel] = useState<string | null>(null);
  // the line whose submenu is open ('' for bise's) and where it is
  const [sub, setSub] = useState<string | null>(null);
  const [side, setSide] = useState<"right" | "left">("right");
  const [subSel, setSubSel] = useState<string | null>(null);
  const [subTop, setSubTop] = useState(0);
  const tray = useRef<HTMLDivElement>(null);
  const menuCol = useRef<HTMLDivElement>(null);
  const subIn = useRef<HTMLDivElement>(null);
  const pending = useRef<number | null>(null);
  const lastPt = useRef<Pt | null>(null);
  const escAt = useRef(0);

  const items: Item[] = [
    ...rows.map((c, i) => ({ k: `capsule.menu.item.${String(i + 1)}`, act: () => { onOpenCard(c.id); } })),
    ...(rows.length > 0 && more > 0 ? [{ k: "capsule.menu.more", act: () => { onOpenWindow("inbox"); } }] : []),
    ...lines.lines.map((l) => ({ k: lineKey(l.id), act: () => { onOpenWindow(l.route); }, ...(isLive(l) && l.project !== "" ? { line: l } : {}) })),
    ...(lines.more > 0 ? [{ k: PROJECTS_MORE, act: () => { onOpenWindow(); } }] : []),
    { k: "capsule.menu.open", act: () => { onOpenWindow(); } },
    { k: "capsule.menu.inbox", act: () => { onOpenWindow("inbox"); } },
    { k: "capsule.menu.settings", act: () => { onOpenWindow("settings"); } },
    ...(onQuit === null ? [] : [{ k: "capsule.menu.quit", act: () => { onQuit(); } }]),
  ];
  const subLine = sub === null ? undefined : lines.lines.find((l) => l.id === sub && isLive(l) && l.project !== "");
  const agents = subLine === undefined ? [] : subAgents(spot, subLine.project);
  const subItems: Item[] =
    subLine === undefined
      ? []
      : [
          ...agents.map((a) => ({ k: subKey(a.name), act: () => { onOpenWindow(`agent/${subLine.project}/${a.name}`); } })),
          { k: SUB_OPEN, act: () => { onOpenWindow(subLine.id === "" ? "bise" : `agent/${subLine.project}/main`); } },
        ];
  // → on a line whose submenu wasn't open: its first row, once its rows are known
  const subOn = subSel === FIRST ? (subItems[0]?.k ?? null) : subSel;

  const stop = (): void => {
    if (pending.current !== null) window.clearTimeout(pending.current);
    pending.current = null;
  };
  const later = (ms: number, fn: () => void): void => {
    stop();
    pending.current = window.setTimeout(() => {
      pending.current = null;
      fn();
    }, ms);
  };
  useEffect(() => stop, []);

  /** the submenu of that line opens, on the side the screen has room */
  const openSub = (id: string): void => {
    const m = menuCol.current?.getBoundingClientRect();
    const scr = window.screen as Screen & { availLeft?: number };
    if (m !== undefined) setSide(subSide(window.screenX + m.left, m.width, scr.availLeft ?? 0, scr.availWidth));
    setSub(id);
    setSubSel(null);
  };
  const closeSub = (): void => {
    setSub(null);
    setSubSel(null);
  };

  // its rows level with the project's row: the head above it, moved up when they'd run past the bottom
  useLayoutEffect(() => {
    if (sub === null) return;
    const row = menuCol.current?.querySelector(`[data-testid="${lineKey(sub)}.line"]`);
    const inner = subIn.current;
    const col = menuCol.current;
    if (row == null || inner === null || col === null) return;
    const head = inner.querySelector(".b-cap-sub-head");
    const top = row.getBoundingClientRect().top - col.getBoundingClientRect().top - (head instanceof HTMLElement ? head.offsetTop + head.offsetHeight : 0);
    setSubTop(Math.max(0, Math.min(top, col.offsetHeight - inner.offsetHeight)));
  }, [sub, side, agents.length]);

  /** esc: the submenu first, then the menu; the same key from the page and the helper counts once */
  const esc = (): boolean => {
    if (sub !== null) {
      stop();
      closeSub();
      escAt.current = Date.now();
      return true;
    }
    return Date.now() - escAt.current < ESC_TWICE_MS;
  };
  const escNow = useRef(esc);
  useEffect(() => {
    escNow.current = esc;
  });
  useEffect(() => {
    if (escRef === undefined) return;
    escRef.current = () => escNow.current();
    return () => {
      escRef.current = null;
    };
  }, [escRef]);

  const keyNow = useRef<(e: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    keyNow.current = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      const inSub = sub !== null && subOn !== null;
      const step = (list: readonly Item[], at: string | null, d: 1 | -1): string | null => {
        const i = list.findIndex((x) => x.k === at);
        if (i < 0) return (d === 1 ? list[0] : list[list.length - 1])?.k ?? null;
        return list[Math.min(list.length - 1, Math.max(0, i + d))]?.k ?? null;
      };
      const here = items.find((x) => x.k === sel);
      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp": {
          const d = e.key === "ArrowDown" ? 1 : -1;
          stop();
          if (inSub) setSubSel(step(subItems, subOn, d));
          else {
            if (sub !== null) closeSub();
            setSel(step(items, sel, d));
          }
          break;
        }
        case "ArrowRight":
          if (inSub || here?.line === undefined) return;
          stop();
          if (sub !== here.line.id) openSub(here.line.id);
          setSubSel(here.line.id === sub ? (subItems[0]?.k ?? null) : FIRST);
          break;
        case "ArrowLeft":
          if (sub === null) return;
          stop();
          closeSub();
          break;
        case "Enter":
          if (inSub) subItems.find((x) => x.k === subOn)?.act();
          else here?.act();
          break;
        case "Escape":
          if (!esc()) onClose();
          break;
        default:
          return;
      }
      e.preventDefault();
    };
  });
  useEffect(() => {
    const on = (e: KeyboardEvent): void => {
      keyNow.current(e);
    };
    window.addEventListener("keydown", on);
    return () => {
      window.removeEventListener("keydown", on);
    };
  }, []);

  /** the pointer on the menu: the row under it, its submenu after a rest, the safe triangle kept */
  const onMove = (e: MouseEvent<HTMLDivElement>): void => {
    const p = { x: e.clientX, y: e.clientY };
    const from = lastPt.current;
    lastPt.current = p;
    const hit = (e.target as Element).closest("[data-testid]");
    const key = items.find((x) => hit !== null && x.k === hit.getAttribute("data-testid"))?.k ?? null;
    if (key === null) return;
    const item = items.find((x) => x.k === key);
    const open = sub === null ? null : lineKey(sub);
    if (open !== null && key !== open && from !== null) {
      const r = subIn.current?.getBoundingClientRect();
      if (r !== undefined) {
        const x = side === "right" ? r.left : r.right;
        if (inTriangle(p, from, { x, y: r.top }, { x, y: r.bottom })) {
          later(TRIANGLE_MS, () => {
            setSel(key);
            if (item?.line !== undefined) openSub(item.line.id);
            else closeSub();
          });
          return;
        }
      }
    }
    if (key === sel && (item?.line === undefined || item.line.id === sub)) return;
    setSel(key);
    setSubSel(null);
    if (item?.line !== undefined) {
      const id = item.line.id;
      if (id !== sub) later(HOVER_MS, () => { openSub(id); });
      else stop();
    } else if (sub !== null) later(HOVER_MS, closeSub);
    else stop();
  };
  const onSubMove = (e: MouseEvent<HTMLDivElement>): void => {
    stop();
    lastPt.current = null;
    const hit = (e.target as Element).closest("[data-testid]");
    const key = subItems.find((x) => hit !== null && x.k === hit.getAttribute("data-testid"))?.k ?? null;
    if (key !== null && key !== subOn) setSubSel(key);
  };

  return (
    <div ref={tray} className={`b-cap-tray ${side}${subLine === undefined ? "" : " has-sub"}`} data-testid="capsule.tray">
      <div ref={menuCol} className="b-cap-menu" data-glass onMouseMove={onMove}>
        <Menu testId="capsule.menu">
          <div className="b-cap-menu-head" data-testid="capsule.menu.head">
            {MW.head(counts.work, counts.waits)}
          </div>
          {rows.length > 0 && (
            // the window's inbox block rows (one-inbox 3, designer m_19631): '1 ? agent question… ·
            // project' at the tight row height, no age; a click or fn+n answers it here
            <div className="b-cap-rows" data-testid="capsule.menu.items">
              {rows.map((c, i) => (
                <Row
                  key={c.id}
                  lead={
                    <>
                      <span className="strip-n">{i + 1}</span>
                      <span className="ib-sign">{MARK[c.kind]}</span>
                    </>
                  }
                  name={
                    <>
                      <span className="strip-who">{shownName(c.agent)}</span>
                      <span className="strip-what">{firstLine(c.text)}</span>
                    </>
                  }
                  end={c.pname}
                  // its number in the tip only: the row is a glance, the number would cost it the
                  // question (notif-id, designer m_27959)
                  tip={inbox.with_id({ meta: firstLine(c.text), id: c.card })}
                  on={sel === `capsule.menu.item.${String(i + 1)}`}
                  onClick={() => {
                    onOpenCard(c.id);
                  }}
                  testId={`capsule.menu.item.${String(i + 1)}`}
                />
              ))}
              {more > 0 && (
                <MenuItem
                  on={sel === "capsule.menu.more"}
                  onClick={() => {
                    onOpenWindow("inbox");
                  }}
                  testId="capsule.menu.more"
                >
                  {MW.more(more)}
                </MenuItem>
              )}
            </div>
          )}
          {/* one line per project (designer m_27872): bise's, then his, what waits and what works */}
          {hasProjects(spot) && (
            <>
              <MenuSep />
              <MenuProjects spot={spot} onOpenWindow={onOpenWindow} sel={sel} sub={subLine === undefined ? null : subLine.id} />
            </>
          )}
          <MenuSep />
          <MenuItem on={sel === "capsule.menu.open"} onClick={() => { onOpenWindow(); }} testId="capsule.menu.open">
            {MW.openBise}
          </MenuItem>
          <MenuItem hotkey="⌘I" on={sel === "capsule.menu.inbox"} onClick={() => { onOpenWindow("inbox"); }} testId="capsule.menu.inbox">
            {MW.inbox}
          </MenuItem>
          <MenuItem hotkey="⌘," on={sel === "capsule.menu.settings"} onClick={() => { onOpenWindow("settings"); }} testId="capsule.menu.settings">
            {MW.settings}
          </MenuItem>
          <MenuSep />
          <MenuItem hotkey="⌘Q" disabled={onQuit === null} on={sel === "capsule.menu.quit"} onClick={() => { onQuit?.(); }} testId="capsule.menu.quit">
            {MW.quit}
          </MenuItem>
        </Menu>
      </div>
      {subLine !== undefined && (
        <div className="b-cap-sub" data-side={side} onMouseMove={onSubMove}>
          <div ref={subIn} className="b-cap-sub-in" style={{ marginTop: subTop }}>
            <Menu testId={SUB}>
              <div className="b-cap-sub-head" data-testid={`${SUB}.head`}>
                <span className="nm">{subLine.name}</span>
                <span className="cn">{subHead(subLine.working, subLine.waits)}</span>
              </div>
              {agents.map((a) => (
                <Row
                  key={a.name}
                  lead={<span className={`b-cap-sub-g ${a.sign.tone}`}>{a.sign.g}</span>}
                  name={
                    <>
                      <span className="who">{a.shown}</span>
                      <span className="what">{a.words}</span>
                    </>
                  }
                  end={a.since === null ? undefined : ageShort(now - a.since)}
                  tip={a.words}
                  on={subOn === subKey(a.name)}
                  onClick={() => {
                    onOpenWindow(`agent/${subLine.project}/${a.name}`);
                  }}
                  testId={subKey(a.name)}
                />
              ))}
              <MenuSep />
              <MenuItem
                on={subOn === SUB_OPEN}
                onClick={() => {
                  onOpenWindow(subLine.id === "" ? "bise" : `agent/${subLine.project}/main`);
                }}
                testId={SUB_OPEN}
              >
                {MW.openProject(subLine.name)}
              </MenuItem>
            </Menu>
          </div>
        </div>
      )}
    </div>
  );
}

/** → asked for the submenu's first row before its rows were known: set once they are. */
const FIRST = "\u0000first";
