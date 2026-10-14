// src/ds · Picker: the one list you pick from (designer's ds list-menu, m_24793): the composer's /,
// @, mode and model menus first, then settings selects and ⌘K. A shell (solid, 1 px line, r 12,
// padding 4, the e-2 shadow) with, all optional but the rows: a head line ('mode   ⇧⇥'), groups with
// their heads, one-line (32 px) or two-line (44 px) rows of glyph | name (+ secondary) | one trailing
// item (a key, an age, a count, or the ✓ of the current value), a footer control (the model's effort
// row, PickerSeg), a key line. Width fits the content (240 to 420, 640 wide); never an x scroll; y
// scroll past `maxHeight`, with 16 px fades at the clipped edges. The active row (hover or the
// keyboard cursor, the last input wins) has the 6% tint; the current value its ✓, no tint.
// Keys: `ownKeys` (mode, model): it takes the focus and ↑↓ (wrap) home end pgup pgdn ⏎ esc; else
// (/ and @, the editor keeps the keys) `active` is the caller's. Placement is the caller's
// (pickerPlace gives it: 8 px from the trigger, clamped in the window). css/picker.css.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cx, sub } from "./cx";

export interface PickerRow {
  id: string;
  name: ReactNode;
  /** under the name, sans 12 text-3 (a two-line row) */
  secondary?: ReactNode;
  /** a 16 px glyph before the name, text-3 ('/', a file kind, ψ) */
  glyph?: ReactNode;
  /** one trailing item, text-3 12 (a key, an age, a count); the ✓ wins when `current` */
  trailing?: ReactNode;
  /** the current value: its ✓ */
  current?: boolean;
  /** shown, text-3, skipped by the keys; its tip says why */
  disabled?: boolean;
  /** the row's tip words (the ds tip layer) */
  tip?: string;
  testId?: string;
}
export interface PickerGroup {
  id: string;
  /** its head, text-3 12, 28 px ('Anthropic') */
  head?: ReactNode;
  rows: readonly PickerRow[];
}
export interface PickerProps {
  /** the head line's title and key, text-3 12 ('mode', '⇧⇥') */
  title?: ReactNode;
  titleKeys?: ReactNode;
  groups: readonly PickerGroup[];
  /** a control after a rule (the model's effort row) */
  footer?: ReactNode;
  /** '↑↓ choose   ⏎ pick   esc close', where the keys aren't obvious */
  keyline?: ReactNode;
  /** no rows: one text-3 row ('no match', 'loading…') */
  empty?: ReactNode;
  /** the caller's active row (the editor keeps the keys); unset: the picker's own */
  active?: string | null;
  /** the picker takes the focus and the keys */
  ownKeys?: boolean;
  onPick: (id: string) => void;
  /** esc (ownKeys): the caller closes it and gives the focus back to its trigger */
  onClose?: () => void;
  /** ⌘K's 640 px shell */
  wide?: boolean;
  /** one-line rows with the secondary inline after the name (text-3 12, 12 px after, cut after a
   *  whole word with '…'): the / and @ lists. One height per list: 32 px every row (designer m_25011) */
  inline?: boolean;
  /** the room toward the anchor, less 16 (pickerPlace) */
  maxHeight?: number;
  /** its place (pickerPlace) */
  style?: CSSProperties;
  testId?: string;
}

/** The rows the keys walk: every row not disabled, in order. Pure. */
export function walkable(groups: readonly PickerGroup[]): string[] {
  return groups.flatMap((g) => g.rows.filter((r) => r.disabled !== true).map((r) => r.id));
}

/** The next active row for a key (↑↓ wrap, home end, a page of 8); null: not a walking key. Pure. */
export function stepActive(ids: readonly string[], active: string | null, key: string): string | null {
  if (ids.length === 0) return null;
  const i = active === null ? -1 : ids.indexOf(active);
  const at = (n: number) => ids[((n % ids.length) + ids.length) % ids.length] ?? null;
  switch (key) {
    case "ArrowDown":
      return at(i + 1);
    case "ArrowUp":
      return i < 0 ? at(ids.length - 1) : at(i - 1);
    case "Home":
      return ids[0] ?? null;
    case "End":
      return ids[ids.length - 1] ?? null;
    case "PageDown":
      return ids[Math.min(ids.length - 1, Math.max(0, i) + 8)] ?? null;
    case "PageUp":
      return ids[Math.max(0, i - 8)] ?? null;
    default:
      return null;
  }
}

/**
 * A picker's place (designer m_24793): 8 px above its anchor (the composer's box), aligned to its
 * trigger's left edge, or its right edge when the trigger sits right, clamped 8 px inside the window;
 * its height up to the room above, less 16. Fixed coordinates. Pure.
 */
export function pickerPlace(anchor: { top: number }, trigger: { left: number; right: number }, align: "start" | "end", win: { width: number; height: number }): { style: CSSProperties; maxHeight: number } {
  const bottom = win.height - anchor.top + 8;
  const maxHeight = Math.max(120, anchor.top - 8 - 16);
  const style: CSSProperties = align === "start" ? { position: "fixed", left: Math.max(8, trigger.left), bottom } : { position: "fixed", right: Math.max(8, win.width - trigger.right), bottom };
  return { style, maxHeight };
}

/** The glyph column shows only when the list mixes kinds: every row with the same glyph (or none)
 *  drops it (designer m_25011). Pure. */
export function glyphColumn(groups: readonly PickerGroup[]): boolean {
  const kinds = new Set(groups.flatMap((g) => g.rows.map((r) => (r.glyph == null ? "" : typeof r.glyph === "string" ? r.glyph : "node"))));
  return kinds.size > 1;
}

/** Cut `text` after a whole word with one '…' so it fits `fits(t)`; the whole text when it fits,
 *  the first word cut when nothing else does. Pure. */
export function cutWords(text: string, fits: (t: string) => boolean): string {
  if (fits(text)) return text;
  const words = text.split(/(?<=\s)/u);
  for (let n = words.length - 1; n >= 1; n -= 1) {
    const t = `${words.slice(0, n).join("").replace(/[\s,;:·]+$/u, "")}…`;
    if (fits(t)) return t;
  }
  return `${(words[0] ?? "").trim()}…`;
}

/** An inline secondary, cut after a whole word to the room left (its full words in the row's tip). */
function WordCut({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return;
    el.textContent = cutWords(text, (t) => {
      el.textContent = t;
      return el.scrollWidth <= el.clientWidth;
    });
  }, [text]);
  return (
    <span ref={ref} className="s">
      {text}
    </span>
  );
}

/** The list you pick from. */
export function Picker({ title, titleKeys, groups, footer, keyline, empty, active, ownKeys = false, onPick, onClose, wide, inline = false, maxHeight, style, testId }: PickerProps) {
  const shell = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const ids = walkable(groups);
  const current = groups.flatMap((g) => g.rows).find((r) => r.current === true && r.disabled !== true)?.id ?? null;
  const [own, setOwn] = useState<string | null>(current ?? ids[0] ?? null);
  // the caller's keys: the pointer's row wins until its active row moves (the last input wins)
  const [hover, setHover] = useState<{ id: string; at: string | null } | null>(null);
  const on = active === undefined ? own : hover !== null && hover.at === active ? hover.id : active;
  const [edges, setEdges] = useState({ top: false, bottom: false });
  // its own keys: the focus on open
  useEffect(() => {
    if (ownKeys) shell.current?.focus();
  }, [ownKeys]);
  // the active row stays in view (never the page)
  useLayoutEffect(() => {
    if (on === null) return;
    list.current?.querySelector<HTMLElement>(`[data-row="${CSS.escape(on)}"]`)?.scrollIntoView({ block: "nearest" });
  }, [on]);
  // the fades at the clipped edges
  const onScroll = () => {
    const el = list.current;
    if (el === null) return;
    const next = { top: el.scrollTop > 0, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1 };
    setEdges((e) => (e.top === next.top && e.bottom === next.bottom ? e : next));
  };
  useLayoutEffect(onScroll, [groups]);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!ownKeys) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose?.();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (on !== null) onPick(on);
      return;
    }
    const next = stepActive(ids, on, e.key);
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    setOwn(next);
  };
  const rows = groups.reduce((n, g) => n + g.rows.length, 0);
  const glyphs = glyphColumn(groups);
  return (
    <div ref={shell} className={cx("b-picker", wide && "wide", inline && "inline")} role="menu" tabIndex={ownKeys ? -1 : undefined} style={style} onKeyDown={onKeyDown}
      onMouseDown={(e) => { e.preventDefault(); }} data-testid={testId}>
      {title != null && (
        <div className="b-picker-head">
          <span>{title}</span>
          {titleKeys != null && <span className="k">{titleKeys}</span>}
        </div>
      )}
      <div ref={list} className={cx("b-picker-list", edges.top && "fade-top", edges.bottom && "fade-bottom")} style={maxHeight === undefined ? undefined : { maxHeight }} onScroll={onScroll}>
        {rows === 0 && empty != null && <div className="b-picker-row none">{empty}</div>}
        {groups.map((g) => (
          <div key={g.id} className="b-picker-group" role="group">
            {g.head != null && <div className="b-picker-ghead">{g.head}</div>}
            {g.rows.map((r) => (
              <div key={r.id} data-row={r.id} role="menuitemradio" aria-checked={r.current === true} aria-disabled={r.disabled === true || undefined}
                className={cx("b-picker-row", r.secondary != null && !inline && "two", r.id === on && "on", r.disabled === true && "dis")}
                data-tip={r.tip === undefined || r.tip === "" ? undefined : r.tip}
                onMouseMove={() => {
                  if (r.disabled === true || on === r.id) return;
                  if (active === undefined) setOwn(r.id);
                  else setHover({ id: r.id, at: active });
                }}
                onClick={r.disabled === true ? undefined : () => { onPick(r.id); }}
                data-testid={r.testId ?? sub(testId, r.id)}>
                {glyphs && <span className="g">{r.glyph}</span>}
                <span className="t">
                  <span className="n">{r.name}</span>
                  {r.secondary != null && (inline && typeof r.secondary === "string" ? <WordCut text={r.secondary} /> : <span className="s">{r.secondary}</span>)}
                </span>
                {r.current === true ? <span className="ok" aria-hidden="true">✓</span> : r.trailing != null && <span className="k">{r.trailing}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {footer != null && <div className="b-picker-foot">{footer}</div>}
      {keyline != null && <div className="b-picker-keys">{keyline}</div>}
    </div>
  );
}

/** A footer's segmented row (the model's effort: low medium high max), the picked one in the 9% tint. */
export function PickerSeg({ head, items, on, onPick, testId }: { head?: ReactNode; items: readonly string[]; on: string | null; onPick: (item: string) => void; testId?: string }) {
  return (
    <div className="b-picker-seg">
      {head != null && <div className="b-picker-ghead">{head}</div>}
      <div className="row" role="radiogroup">
        {items.map((x) => (
          <span key={x} role="radio" aria-checked={x === on} className={cx("it", x === on && "on")} onClick={() => { onPick(x); }} data-testid={sub(testId, x)}>
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}
