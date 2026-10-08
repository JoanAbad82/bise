// src/ds · the composer's frame and what sits above it (desktop-ds v5: components/composer.html,
// css/composer.css): ComposerFrame, Quote, Dock, Opts, Tabs.
//
// The editor itself is src/composer's (Lexical, amb-web): it goes in ComposerFrame's `children`,
// and the frame never touches it. The frame's props change only when the screen's state changes
// (send on/off/stop, the dock, the tabs), never per keystroke; focus shows through :focus-within
// (css/live.css), so focusing or typing re-renders nothing here. The caret is the editor's own.
import type { MouseEventHandler, ReactNode } from "react";
import { cx, st, sub, type UiState } from "./cx";
import { Dot, Help, type DotState } from "./prim";

/** a quote from selected lines, above his words: ❝ 1 “workers: [Worker; 4],” decode_pool.rs:13-14 */
export function Quote({ children, onClick, testId }: { children: ReactNode; onClick?: MouseEventHandler<HTMLDivElement>; testId?: string }) {
  return <div className="b-quote" onClick={onClick} role={onClick ? "button" : undefined} data-testid={testId}>❝ {children}</div>;
}

export interface Opt {
  n: number;
  text: ReactNode;
  /** the keyboard's */
  on?: boolean;
  picked?: boolean;
  state?: UiState;
}
export interface OptsProps {
  items: readonly Opt[];
  onPick?: (n: number) => void;
  /** "or type your answer below" (a question), "pick 1 or 2" (an approval) */
  typeHint?: ReactNode;
  /** each option's test id is `<testId>.<n>` */
  testId?: string;
}
/** the numbered options of a question or an approval */
export function Opts({ items, onPick, typeHint, testId }: OptsProps) {
  return (
    <div className="b-opts" role="listbox" data-testid={testId}>
      {items.map((o) => (
        <span key={o.n} role="option" aria-selected={o.on || o.picked || false} className={cx("b-opt", o.on && "on", o.picked && "picked", st(o.state))}
          onClick={onPick ? () => { onPick(o.n); } : undefined} data-testid={sub(testId, o.n)}>
          <b>{o.n}</b>{o.text}
        </span>
      ))}
      {typeHint != null && <span className="b-opt ty">{typeHint}</span>}
    </div>
  );
}

export interface DockCtx {
  /** a screenshot's thumb */
  shot?: ReactNode;
  body: ReactNode;
  /** where it came from, in text-3 */
  origin?: ReactNode;
}
export interface DockProps {
  /** "" (a question, the accent), "plain" (a report), "err" */
  kind?: "plain" | "err";
  /** "? search needs you" */
  head: ReactNode;
  /** "1 of 3   ← →   esc back" */
  keys?: ReactNode;
  /** the inbox card's context, above the question */
  ctx?: DockCtx;
  q: ReactNode;
  opts?: readonly Opt[];
  onPick?: (n: number) => void;
  typeHint?: ReactNode;
  testId?: string;
}
/** what waits above the composer, one at a time: a question, an approval, an inbox card */
export function Dock({ kind, head, keys, ctx, q, opts, onPick, typeHint, testId }: DockProps) {
  return (
    <div className={cx("b-dock", kind)} role="group" data-testid={testId}>
      <div className="h">{kind === "err" && <>▲ </>}{head}{keys != null && <span className="k">{keys}</span>}</div>
      {ctx && (
        <div className="ctx">
          {ctx.shot}
          <div><div className="b-text">{ctx.body}</div>{ctx.origin != null && <Help>{ctx.origin}</Help>}</div>
        </div>
      )}
      <div className="q">{q}</div>
      {opts && opts.length > 0 && <Opts items={opts} onPick={onPick} typeHint={typeHint} testId={sub(testId, "opt")} />}
    </div>
  );
}

export interface Tab {
  id: string;
  text: ReactNode;
  dot?: DotState | undefined;
  on?: boolean;
}
/** the inbox's tabs above the dock; each tab's test id is `<testId>.<id>` */
export function Tabs({ items, onPick, testId }: { items: readonly Tab[]; onPick?: (id: string) => void; testId?: string }) {
  return (
    <div className="b-tabs" role="tablist" data-testid={testId}>
      {items.map((t) => (
        <span key={t.id} role="tab" aria-selected={t.on || false} className={cx(t.on && "on")} onClick={onPick ? () => { onPick(t.id); } : undefined}
          data-testid={sub(testId, t.id)}>
          {t.dot !== undefined && <><Dot state={t.dot} /> </>}{t.text}
        </span>
      ))}
    </div>
  );
}

export type Send = "on" | "off" | "stop";
export interface ComposerFrameProps {
  /** the editor (src/composer): mounted once, never re-created by the frame */
  children: ReactNode;
  /** "you → bise · opus · high" */
  to?: ReactNode;
  /** on: something to send; off: nothing yet; stop: a turn runs, the button interrupts */
  send: Send;
  onSend?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  /** "@ file   $ skills   / commands   ⌘I inbox" */
  keys?: ReactNode;
  /** the lines he quoted, the dock, the inbox tabs: above the box */
  quote?: ReactNode;
  dock?: ReactNode;
  tabs?: ReactNode;
  /** shown focused without focus (the gallery); live, :focus-within does it */
  focus?: boolean;
  /** the whole frame is the input: a press on its padding or empty area (not on the editor, a chip, a
   * button, the dock, the tabs or a quote) calls this to focus the editor, the caret at the end (his round 2) */
  onBoxDown?: () => void;
  testId?: string;
}

/** A press in the frame that is not the editor's own text, a chip, a control, the dock, the tabs or a quote. Pure. */
export function boxPress(target: EventTarget | null): boolean {
  const el = target as { closest?: (s: string) => unknown } | null;
  if (el === null || typeof el.closest !== "function") return true;
  // a disabled control (send while the draft is empty) does nothing of its own: the press focuses the field
  return el.closest('[contenteditable="true"], button:not(:disabled), a, input, textarea, [role=button], .b-chip, .b-dock, .b-tabs, .b-quote') === null;
}
/** the composer's frame: tabs, dock, quote, the to-line, the box with the editor and send, the keys */
export function ComposerFrame({ children, to, send, onSend, disabled, keys, quote, dock, tabs, focus, onBoxDown, testId }: ComposerFrameProps) {
  return (
    <div className={cx("b-composer", disabled && "is-disabled")} data-testid={testId}
      onMouseDown={onBoxDown && ((e) => {
        // the editor's own text keeps the click (the caret at the clicked line); elsewhere the frame focuses it
        if (e.button !== 0 || !boxPress(e.target)) return;
        e.preventDefault();
        onBoxDown();
      })}>
      {tabs}
      {dock}
      {quote}
      {to != null && <div className="div">{to}</div>}
      <div className={cx("box", focus && "is-focus")} data-testid={sub(testId, "box")}>
        <div className="in">{children}</div>
        <button type="button" className={cx("send", send === "stop" ? "stop" : send === "off" && "off")} onClick={onSend}
          disabled={send === "off" || disabled} aria-label={send === "stop" ? "stop" : "send"} data-testid={sub(testId, send === "stop" ? "stop" : "send")}>
          {send === "stop" ? "■" : "↑"}
        </button>
      </div>
      {keys != null && <div className="keys">{keys}</div>}
    </div>
  );
}

/** the reference's placeholder and caret, for a frame with no editor (the gallery, a still) */
export function ComposerStill({ text, placeholder, caret }: { text?: ReactNode; placeholder?: ReactNode; caret?: boolean }) {
  return <>{text != null && text !== "" ? text : <span className="ph">{placeholder}</span>}{caret && <span className="cur" />}</>;
}
