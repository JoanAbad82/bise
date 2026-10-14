// src/ds · what floats over the screen (desktop-ds v5: components/cards.html, spotlight.html,
// menus.html, toasts.html; css/cards.css, spotlight.css, menus.css, toasts.css): Card, Spot +
// SpotRow + SpotGroup, Menu + MenuItem, Toast.
//
// Spot is the spotlight's frame: the input is src/spotlight's (amb-web) and goes in `input`; the
// rows go in `children` (a virtualized list as one child is fine). SpotRow and MenuItem are
// memo'd, so moving the keyboard's row re-renders two rows, not the list.
import { memo, type MouseEventHandler, type ReactNode, type Ref } from "react";
import { cx } from "./cx";
import { Button, Dot, Pearl, type DotState } from "./prim";

export interface CardProps {
  /** a report, not a question: no accent ring */
  plain?: boolean;
  /** "bise" (the pearl) or an agent's dot */
  lead?: "bise" | DotState;
  /** "telemetry · alerts" */
  who: ReactNode;
  /** " needs you" */
  rest?: ReactNode;
  /** when, "1 of 2" */
  k?: ReactNode;
  q: ReactNode;
  /** Opts, an Art, anything under the question */
  children?: ReactNode;
  /** "1 2 pick   esc later" */
  keys?: ReactNode;
  /** more cards behind it */
  stacked?: boolean;
  testId?: string;
}
/** a card: what bise asks or tells him outside the window, or in the inbox */
export function Card({ plain, lead = "bise", who, rest, k, q, children, keys, stacked, testId }: CardProps) {
  const card = (
    <div className={cx("b-card", plain && "plain")} role="group" data-testid={testId}>
      <div className="h">
        {lead === "bise" ? <Pearl size={22} /> : <Dot state={lead} lg />}
        <b>{who}</b>{rest}
        {k != null && <span className="k">{k}</span>}
      </div>
      <div className="q">{q}</div>
      {children}
      {keys != null && <div className="keys">{keys}</div>}
    </div>
  );
  return stacked ? <div>{card}<div className="b-stackback" /></div> : card;
}

export interface SpotRowProps {
  lead: "bise" | DotState;
  name: ReactNode;
  where?: ReactNode;
  what?: ReactNode;
  /** its key ("⌥1", "↵") */
  hotkey?: ReactNode;
  /** the keyboard's */
  on?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  testId?: string;
  ref?: Ref<HTMLDivElement>;
}
/** a spotlight row */
export const SpotRow = memo(function SpotRow({ lead, name, where, what, hotkey, on, onClick, testId, ref }: SpotRowProps) {
  return (
    <div ref={ref} className={cx("r", on && "on")} role="option" aria-selected={on || false} onClick={onClick} data-testid={testId}>
      {lead === "bise" ? <Pearl size={22} /> : <Dot state={lead} />}
      <b>{name}</b>
      <span className="pp">{where}</span>
      <span className="dm">{what}</span>
      <span className="ky">{hotkey}</span>
    </div>
  );
});

/** a group head in the spotlight's list */
export function SpotGroup({ children }: { children: ReactNode }) {
  return <div className="g">{children}</div>;
}

export interface SpotProps {
  /** the input (src/spotlight's), mounted once; SpotStill for a still */
  input: ReactNode;
  /** "to bise" */
  to?: ReactNode;
  /** the live pearl, else the reference's */
  pearl?: ReactNode;
  children?: ReactNode;
  keys?: ReactNode;
  testId?: string;
}
/** the spotlight's frame */
export function Spot({ input, to = "to bise", pearl, children, keys, testId }: SpotProps) {
  return (
    <div className="b-spot" data-testid={testId}>
      <div className="in">{pearl ?? <Pearl size={40} />}<span className="tx">{input}</span><span className="to">{to}</span></div>
      <div role="listbox">{children}</div>
      {keys != null && <div className="keys">{keys}</div>}
    </div>
  );
}

/** the reference's typed words or placeholder + caret, for a still */
export function SpotStill({ text, placeholder }: { text?: ReactNode; placeholder?: ReactNode }) {
  return text != null && text !== "" ? <>{text}</> : <><span className="cur" /><span className="lo">{placeholder}</span></>;
}

export interface MenuItemProps {
  children: ReactNode;
  hotkey?: ReactNode;
  /** the keyboard's */
  on?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  testId?: string;
}
/** a menu item: a ds Picker row (picker.css, designer m_24793): name | its key, the 6% tint on */
export const MenuItem = memo(function MenuItem({ children, hotkey, on, disabled, danger, onClick, testId }: MenuItemProps) {
  return (
    <div className={cx("b-picker-row", "b-mi", on && "on", disabled && "dis", danger && "danger")} role="menuitem" aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick} data-testid={testId}>
      <span className="t"><span className="n">{children}</span></span>
      {hotkey != null && <span className="k">{hotkey}</span>}
    </div>
  );
});

/** a separator in a menu */
export function MenuSep() {
  return <div className="b-picker-sep" role="separator" />;
}

/** a menu (the ⋯ menus): MenuItem and MenuSep children in the ds Picker's shell (picker.css) */
export function Menu({ children, testId }: { children: ReactNode; testId?: string }) {
  return <div className="b-picker b-menu" role="menu" data-testid={testId}>{children}</div>;
}

export interface ToastProps {
  children: ReactNode;
  err?: boolean;
  dot?: DotState | undefined;
  /** its one action, a ghost button */
  action?: { text: ReactNode; onClick?: MouseEventHandler<HTMLButtonElement>; testId?: string };
  testId?: string;
}
/** a toast */
export function Toast({ children, err, dot, action, testId }: ToastProps) {
  return (
    <div className={cx("b-toast", err && "err")} role={err ? "alert" : "status"} data-testid={testId}>
      {err ? <><span className="m">▲</span> </> : dot !== undefined ? <><Dot state={dot} /> </> : null}
      {children}
      {action && <span className="end"><Button kind="ghost" onClick={action.onClick} testId={action.testId}>{action.text}</Button></span>}
    </div>
  );
}
