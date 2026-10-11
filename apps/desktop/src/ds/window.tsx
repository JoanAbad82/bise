// src/ds · the window (desktop-ds v5: components/window.html, css/window.css): Win (frame), Side
// (the sidebar), Row (a list row: bise, a project, an agent, an archived one), SectionHead, Head
// (the main column's head), Main. The 3-column layout and the scroll areas are src/app's; this is
// the look. Row is memo'd: it sits in long, virtualized lists.
import { memo, type MouseEventHandler, type ReactNode, type Ref } from "react";
import { cx, st, type UiState } from "./cx";
import { Dot, Pearl, type DotState } from "./prim";

/** the window's frame: three columns (sidebar, main, aside) */
export function Win({ inactive, side, main, aside }: { inactive?: boolean; side: ReactNode; main: ReactNode; aside?: ReactNode }) {
  return (
    <div className={cx("b-win", inactive && "is-inactive")}>
      <div className="cols">{side}{main}{aside}</div>
    </div>
  );
}

export interface RowProps {
  /** "me": bise (pearl, name, sub); "pj": a project; "ag": an agent under its project; "arch": archived */
  kind?: "me" | "pj" | "ag" | "arch";
  name: ReactNode;
  sub?: ReactNode;
  dot?: DotState | undefined;
  /** a sign of its own in the dot's place (the sidebar's '⋯' / '?'); wins over `dot` */
  lead?: ReactNode;
  /** the end: a time, a count; `needs` draws it in the accent (what waits for him) */
  end?: ReactNode;
  needs?: boolean;
  /** the one in view */
  on?: boolean;
  state?: UiState;
  /** with it, the row is a real <button> (full width, left-aligned, the row's hover and on tints) */
  onClick?: MouseEventHandler<HTMLElement>;
  testId?: string;
  ref?: Ref<HTMLElement>;
}
/** a list row (sidebar, side views, settings nav, any list); a real button when it has onClick */
export const Row = memo(function Row({ kind, name, sub, dot, lead: own, end, needs, on, state, onClick, testId, ref }: RowProps) {
  const lead = kind === "me" ? <Pearl size={22} /> : own ?? (dot !== undefined ? <Dot state={dot} lg={kind === "pj"} /> : null);
  const body = (
    <>
      {lead}
      {kind === "me" ? (
        <span><span className="nm">{name}</span>{sub != null && <span className="sub">{sub}</span>}</span>
      ) : (
        <span className="nm">{name}</span>
      )}
      {end != null && end !== "" && <span className={cx("end", needs && "nd")}>{end}</span>}
    </>
  );
  if (onClick !== undefined) {
    return (
      <button ref={ref as Ref<HTMLButtonElement>} type="button" className={cx("b-row", "btn", kind, on && "on", st(state))} onClick={onClick}
        aria-current={on || undefined} data-testid={testId}>
        {body}
      </button>
    );
  }
  return (
    <div ref={ref as Ref<HTMLDivElement>} className={cx("b-row", kind, on && "on", st(state))} aria-current={on || undefined} data-testid={testId}>
      {body}
    </div>
  );
});

/** a section head in a list ("projects") */
export function SectionHead({ children }: { children: ReactNode }) {
  return <div className="b-sh">{children}</div>;
}

export interface SideProps {
  /** the rows and section heads (a virtualized list goes here as one child) */
  children: ReactNode;
  foot?: ReactNode;
  onFoot?: MouseEventHandler<HTMLDivElement>;
  footTestId?: string;
  /** the traffic lights' room at the top (on by default) */
  lights?: boolean;
  testId?: string;
}
/** the sidebar */
export function Side({ children, foot, onFoot, footTestId, lights = true, testId }: SideProps) {
  return (
    <div className="b-side" data-testid={testId}>
      {lights && <div className="b-lights"><i /><i /><i /></div>}
      {children}
      {foot != null && <div className="foot" onClick={onFoot} role={onFoot ? "button" : undefined} data-testid={footTestId}>{foot}</div>}
    </div>
  );
}

export interface HeadProps {
  title: ReactNode;
  sub?: ReactNode;
  pearl?: 22 | 40;
  dot?: DotState | undefined;
  /** its own lead in place of the pearl or the dot (the window's bise pearl: ink at rest) */
  lead?: ReactNode;
  /** buttons and chips on the right */
  end?: ReactNode;
}
/** the main column's head: who this thread is with */
export function Head({ title, sub, pearl, dot, lead, end }: HeadProps) {
  return (
    <div className="b-head">
      {lead ?? (pearl ? <Pearl size={pearl} /> : dot !== undefined ? <Dot state={dot} lg /> : null)}
      <span><span className="t1">{title}</span>{sub != null && <span className="t2">{sub}</span>}</span>
      {end != null && <span className="end">{end}</span>}
    </div>
  );
}

/** the main column (head, thread, composer go in it) */
export function Main({ children, testId }: { children: ReactNode; testId?: string }) {
  return <div className="b-main" data-testid={testId}>{children}</div>;
}
