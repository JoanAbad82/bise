// src/ds · primitives (desktop-ds v5: components/prim.html, css/prim.css): Button, Chip, Kbd, Seg,
// Toggle, Field, Help, Dot, Pearl, Bar, Skel, Empty, Err.
//
// Every component is a pure render of its props: no state, no effect, the reference's class names.
// What he can act on takes a `testId` (data-testid, `<area>.<thing>[.<id>]`, given by the screen)
// and a handler. A `state` prop shows a state without a mouse (the gallery); live, :hover and
// :focus-within do it (css/live.css).
import type { InputHTMLAttributes, MouseEventHandler, ReactNode, Ref } from "react";
import { cx, st, step5, sub, type UiState } from "./cx";
import { LivePearl, MOODS, type Mood } from "@/pearl";

export type Tone = "acc" | "err" | "ok";
export type DotState = "wk" | "nd" | "ok" | "er" | "off";

export interface ButtonProps {
  children: ReactNode;
  kind?: "pri" | "ghost" | "danger";
  state?: UiState;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  testId?: string;
  title?: string;
  ref?: Ref<HTMLButtonElement>;
}
/** a button: a real <button>; `loading` hides its words under a spinner */
export function Button({ children, kind, state, disabled, onClick, testId, title, ref }: ButtonProps) {
  const off = disabled || state === "disabled";
  return (
    <button ref={ref} type="button" className={cx("b-btn", kind, st(state))} disabled={off} aria-busy={state === "loading" || undefined}
      onClick={onClick} data-testid={testId} title={title}>
      {children}
    </button>
  );
}

export interface ChipProps {
  children: ReactNode;
  tone?: Tone;
  onClick?: MouseEventHandler<HTMLSpanElement>;
  testId?: string;
}
/** a chip: a small label, clickable when it has onClick */
export function Chip({ children, tone, onClick, testId }: ChipProps) {
  return (
    <span className={cx("b-chip", tone)} onClick={onClick} role={onClick ? "button" : undefined} data-testid={testId}>
      {children}
    </span>
  );
}

/** a key as drawn in the UI ("⌘I", "esc") */
export function Kbd({ children }: { children: ReactNode }) {
  return <span className="b-kbd">{children}</span>;
}

export interface SegProps {
  items: readonly ReactNode[];
  on: number;
  onPick?: (i: number) => void;
  hover?: number;
  testId?: string;
}
/** underline tabs (ds v4): one of `items` is on; each part's test id is `<testId>.<i>` */
export function Seg({ items, on, onPick, hover, testId }: SegProps) {
  return (
    <span className="b-seg" role="tablist" data-testid={testId}>
      {items.map((t, i) => (
        <span key={i} role="tab" aria-selected={i === on} className={cx(i === on && "on", i === hover && "is-hover")}
          onClick={onPick ? () => { onPick(i); } : undefined} data-testid={sub(testId, i)}>
          {t}
        </span>
      ))}
    </span>
  );
}

export interface ToggleProps {
  on: boolean;
  onChange?: (on: boolean) => void;
  state?: UiState;
  label?: string;
  testId?: string;
}
/** a switch; role switch, space/enter flip it when it has focus */
export function Toggle({ on, onChange, state, label, testId }: ToggleProps) {
  const off = state === "disabled";
  const flip = () => { if (!off && onChange) onChange(!on); };
  return (
    <span className={cx("b-toggle", on && "on", st(state))} role="switch" aria-checked={on} aria-label={label} aria-disabled={off || undefined}
      tabIndex={off ? -1 : 0} onClick={flip} data-testid={testId}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } }}>
      <i />
    </span>
  );
}

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "children"> {
  icon?: ReactNode;
  state?: "focus" | "error";
  testId?: string;
  ref?: Ref<HTMLInputElement>;
}
/**
 * a one-line field: a real <input> inside the reference's frame. Uncontrolled-friendly: pass
 * defaultValue (or value + onChange); the frame never re-renders the input to show focus, the
 * :focus-within rule does (css/live.css).
 */
export function Field({ icon, state, testId, ref, ...input }: FieldProps) {
  return (
    <label className={cx("b-field", st(state))}>
      {icon}
      <input ref={ref} {...input} aria-invalid={state === "error" || undefined} data-testid={testId} />
    </label>
  );
}

/** a help line under a control; `err` in the error color */
export function Help({ children, err }: { children: ReactNode; err?: boolean }) {
  return <div className={cx("b-help", err && "err")}>{children}</div>;
}

/** a dot state in words: its accessible name and tooltip (never by color alone, bar N2) */
export const DOT_WORDS: Record<DotState | "idle", string> = { wk: "working", nd: "needs you", ok: "done", er: "error", off: "offline", idle: "idle" };

/**
 * a status dot: working, needs you, done, error, off (idle without a state); `lg` 16 px. Its state
 * is also a word (aria-label, title) and, with increase contrast, a glyph in a ring (css/live.css).
 */
export function Dot({ state, lg }: { state?: DotState | undefined; lg?: boolean }) {
  const word = DOT_WORDS[state ?? "idle"];
  return <i className={cx("b-dot", state, lg && "lg")} role="img" aria-label={word} title={word} />;
}

export type PearlSize = 22 | 40 | 56 | 120;
export interface PearlProps {
  size?: PearlSize;
  mood?: string;
  /** the live pearl (src/pearl, amb-web) draws into this slot; without it, the reference's glyph */
  children?: ReactNode;
}
/** a mood the live pearl knows, else rest */
const moodOf = (m: string | undefined): Mood => (m !== undefined && m in MOODS ? (m as Mood) : "rest");
/** bise's pearl: the slot and its size; without children the live pearl (src/pearl), floating free, never the old ':*' glyph (ambient m_10689) */
export function Pearl({ size = 22, mood, children }: PearlProps) {
  return (
    <span className={cx("b-pearl", `s${size}`)} data-bise-pearl={size} data-mood={mood} aria-hidden="true">
      {children ?? <LivePearl mood={moodOf(mood)} size={size} />}
    </span>
  );
}

export interface BarProps {
  /** a known end: the width, in steps of 5; without it the bar runs with no end */
  pct?: number;
  state?: "err" | "done";
}
/** a progress bar */
export function Bar({ pct, state }: BarProps) {
  const ind = pct == null && !state;
  return (
    <div className={cx("b-bar", ind ? "ind" : state)} role="progressbar" aria-valuenow={pct == null ? undefined : step5(pct)}>
      <i className={pct == null ? undefined : `w${step5(pct)}`} />
    </div>
  );
}

/** a skeleton line, while a list loads */
export function Skel() {
  return <span className="b-skel" aria-hidden="true" />;
}

/** an empty state: what is empty and what to do */
export function Empty({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="b-empty">
      <b>{title}</b>
      {children != null && <span>{children}</span>}
    </div>
  );
}

/** an error line: ▲ and what happened */
export function Err({ children }: { children: ReactNode }) {
  return (
    <div className="b-err" role="alert">
      <span className="m">▲</span>
      <span>{children}</span>
    </div>
  );
}
