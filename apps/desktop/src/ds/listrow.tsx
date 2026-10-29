// src/ds · a page's list (bise fait mac, page native-mac §6, mockup 6), for every page that is no
// thread (inbox, artifacts, scheduled, processes, agents, changes, PRs...):
// - ListRow: 52 high, two lines (13/18, then 12/16 text-3), padding 0 12, r 8; a state column of
//   16 at its left ('?', a check, a dot), 12 between its parts; the chosen one --c-active (one row
//   rule for every page). Its body is one button (the click, the focus ring, VoiceOver's name); its
//   end (an action, the '…' MoreButton) sits beside it, never inside it. A right click anywhere on
//   the row is `onContextMenu` (useEntityMenu's, nm-menus). Its one action: RowAction (28).
// - GroupLabel: the label over a group of rows: 12/500 text-3, sentence case (never spaced
//   capitals), 32 high, 16 above it; its count in the accent only when it waits on him.
// Pure render of their props. Owner: nm-ds.
import type { MouseEventHandler, ReactNode, Ref } from "react";
import { cx, sub } from "./cx";
import { tipAttrs } from "./tip";

export interface ListRowProps {
  /** the first line, 13/18 (a name in 600 then its words: the screen's own spans) */
  title: ReactNode;
  /** the second line, 12/16 text-3: where, when, who */
  sub?: ReactNode;
  /** the state column, 16 wide: '?' in the accent, an AppIcon check, a Dot */
  state?: ReactNode;
  /** the row's end: an action (28), a MoreButton */
  end?: ReactNode;
  /** the chosen row: --c-active (aria-current) */
  on?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** a right click on the row: the entity's menu (useEntityMenu(e).onContextMenu) */
  onContextMenu?: MouseEventHandler<HTMLElement>;
  /** the body's VoiceOver name when its words don't say it all */
  label?: string;
  /** a hover tip on the body (a compact mark's words) */
  tip?: string;
  ref?: Ref<HTMLButtonElement>;
  testId?: string;
}

export function ListRow({ title, sub: line2, state, end, on, onClick, onContextMenu, label, tip, ref, testId }: ListRowProps) {
  return (
    <div className={cx("b-lrow b-chrome", on && "on")} onContextMenu={onContextMenu} data-testid={testId}>
      <button ref={ref} type="button" className="body" aria-current={on || undefined} aria-label={label} {...tipAttrs(tip)}
        onClick={onClick} data-testid={sub(testId, "open")}>
        <span className="state" aria-hidden={state == null || undefined}>{state}</span>
        <span className="lines">
          <span className="l1">{title}</span>
          {line2 != null && <span className="l2">{line2}</span>}
        </span>
      </button>
      {end != null && <span className="end">{end}</span>}
    </div>
  );
}

export interface RowActionProps {
  /** its words (the screen's, from the words catalog: 'answer', 'open') */
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** its tip when its words don't say it all */
  tip?: string;
  testId?: string;
}

/** a row's one action at its end (mockup 6 .act): 28, padding 0 12, r 6, --c-solid, a 1 px ring, 13/500 */
export function RowAction({ children, onClick, tip, testId }: RowActionProps) {
  return (
    <button type="button" className="b-ract" {...tipAttrs(tip)} onClick={onClick} data-testid={testId}>
      {children}
    </button>
  );
}

export interface GroupLabelProps {
  /** its words, sentence case ('waiting for you', 'earlier') */
  children: ReactNode;
  /** a count after it */
  count?: ReactNode;
  /** the count waits on him: the accent */
  waits?: boolean;
  /** the count's tip ('3 waiting for you') */
  tip?: string;
  testId?: string;
}

export function GroupLabel({ children, count, waits, tip, testId }: GroupLabelProps) {
  return (
    <h3 className="b-glabel b-chrome" data-testid={testId}>
      {children}
      {count != null && <span className={cx("n", waits && "wait")} {...tipAttrs(tip)}>{count}</span>}
    </h3>
  );
}
