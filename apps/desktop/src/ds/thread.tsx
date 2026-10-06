// src/ds · the thread's parts (desktop-ds v5: components/thread.html, css/thread.css): Thread, Msg,
// Tool, Fold, Day, Answered, Marker, Route, Art, Diff. The answer's words come in as ReactNode: the
// markdown render is src/thread's. Msg is memo'd: it sits in a long, virtualized list, and a new
// message must not re-render the others.
import { memo, type MouseEventHandler, type ReactNode, type Ref } from "react";
import { cx, st, sub } from "./cx";
import { Bar, Chip, Dot, Pearl, type DotState } from "./prim";
import { Quote } from "./composer";

/** the thread column (a virtualized list goes here as one child) */
export function Thread({ children, testId }: { children: ReactNode; testId?: string }) {
  return <div className="b-thread" data-testid={testId}>{children}</div>;
}

export interface MsgProps {
  from: "you" | "bise" | "agent";
  name?: ReactNode;
  /** "10:42", "by voice, from Chrome": joined with " · " */
  time?: string;
  via?: string;
  /** his initial; bise gets the pearl, an agent its dot */
  av?: string;
  dot?: DotState | undefined;
  /** indented: an agent's message to another */
  indent?: boolean;
  /** the context it came with (chips, a shot) */
  context?: ReactNode;
  /** the lines he quoted, above his words */
  quote?: ReactNode;
  state?: "streaming" | "error";
  /** the words (src/thread renders markdown into this) */
  children: ReactNode;
  /** tool, route, art, diff under the words */
  after?: ReactNode;
  testId?: string;
  ref?: Ref<HTMLDivElement>;
}
/** a message */
export const Msg = memo(function Msg({ from, name, time, via, av, dot, indent, context, quote, state, children, after, testId, ref }: MsgProps) {
  const meta = [time, via].filter(Boolean).join(" · ");
  return (
    <div ref={ref} className={cx("b-msg", from === "you" && "you", indent && "in", st(state))} data-testid={testId} aria-busy={state === "streaming" || undefined}>
      <div className="b-av">{from === "bise" ? <Pearl size={22} /> : dot !== undefined ? <Dot state={dot} lg /> : av ?? ""}</div>
      <div>
        <div className="b-who"><b>{name ?? from}</b>{meta}</div>
        {context != null && <div className="b-who">{context}</div>}
        {quote != null && <Quote>{quote}</Quote>}
        <div className="b-text">{children}</div>
        {after}
      </div>
    </div>
  );
});

export interface ToolProps {
  children: ReactNode;
  /** open: its output shows; run: a bar under it; err: ▲ and the error color */
  state?: "open" | "run" | "err";
  out?: ReactNode;
  onToggle?: MouseEventHandler<HTMLDivElement>;
  testId?: string;
}
/** folded work: one line, opens to its output */
export function Tool({ children, state, out, onToggle, testId }: ToolProps) {
  const head = (
    <div className={cx("b-tool", state)} onClick={onToggle} role={onToggle ? "button" : undefined} aria-expanded={state === "open"} data-testid={testId}>
      <span className="chev">▸</span>
      <span className={state === "err" ? undefined : "lbl"}>{state === "err" ? <>▲ {children}</> : children}</span>
    </div>
  );
  if (state === "open" && out != null) return <div>{head}<div className="b-out">{out}</div></div>;
  if (state === "run") return <div>{head}<Bar /></div>;
  return head;
}

/** "▸ 4 messages between 2 agents" (▾ once open) */
export function Fold({ children, open, onToggle, testId }: { children: ReactNode; open?: boolean; onToggle?: MouseEventHandler<HTMLDivElement>; testId?: string }) {
  return (
    <div className={cx("b-fold", open && "open")} onClick={onToggle} role={onToggle ? "button" : undefined} aria-expanded={open || false} data-testid={testId}>
      {open ? "▾ " : "▸ "}{children}
    </div>
  );
}

/** a day line ("today") */
export function Day({ children }: { children: ReactNode }) {
  return <div className="b-day">{children}</div>;
}

/** what main answered for him */
export function Answered({ children, onClick, testId }: { children: ReactNode; onClick?: MouseEventHandler<HTMLDivElement>; testId?: string }) {
  return <div className="b-answered" onClick={onClick} role={onClick ? "button" : undefined} data-testid={testId}>{children}</div>;
}

/** "? search asked you · it waits above the composer" */
export function Marker({ children }: { children: ReactNode }) {
  return <div className="b-marker">{children}</div>;
}

export interface RouteProps {
  state: "wk" | "ok" | "er";
  /** "telemetry · main → alerts" */
  p1: ReactNode;
  /** what */
  p2?: ReactNode;
  /** when */
  p3?: ReactNode;
  /** a known end: the bar's width (only while it works) */
  pct?: number;
  onClick?: MouseEventHandler<HTMLDivElement>;
  testId?: string;
}
/** a delegation line */
export function Route({ state, p1, p2, p3, pct, onClick, testId }: RouteProps) {
  return (
    <div className="b-route" onClick={onClick} role={onClick ? "button" : undefined} data-testid={testId}>
      <Dot state={state} />
      <span><span className="p1">{p1}</span> <span className="p2">{p2}</span></span>
      <span className="p3">{p3}</span>
      {state === "wk" && (pct == null ? <Bar /> : <Bar pct={pct} />)}
    </div>
  );
}

export interface ArtProps {
  /** "↗ flash sale replay" */
  title: ReactNode;
  /** "stock · 10:40" */
  meta?: ReactNode;
  isNew?: boolean;
  thumb?: ReactNode;
  state?: "hover";
  onClick?: MouseEventHandler<HTMLDivElement>;
  testId?: string;
}
/** an artifact */
export function Art({ title, meta, isNew, thumb, state, onClick, testId }: ArtProps) {
  return (
    <div className={cx("b-art", st(state))} onClick={onClick} role={onClick ? "button" : undefined} data-testid={testId}>
      <span className="th">{thumb}</span>
      <span>
        <span className="an">{title}</span>{isNew && <> <Chip tone="acc">new</Chip></>}
        {meta != null && <span className="am">{meta}</span>}
      </span>
    </div>
  );
}

export interface DiffLine {
  old?: number | null;
  new?: number | null;
  sign?: "+" | "-" | "";
  text: string;
  /** picked (a quote's lines): a run of picked lines is outlined as one block */
  sel?: boolean;
}
export interface DiffProps {
  file: ReactNode;
  add?: number;
  rm?: number;
  lines: readonly DiffLine[];
  onLine?: (i: number) => void;
  /** the quote pop under the picked lines */
  pop?: ReactNode;
  /** each line's test id is `<testId>.<i>` */
  testId?: string;
}
/** a diff: a file head and its lines */
export function Diff({ file, add, rm, lines, onLine, pop, testId }: DiffProps) {
  return (
    <div className="b-diff" data-testid={testId}>
      <div className="fh">{file}{add ? <> <span className="ok">+{add}</span></> : null}{rm ? <> <span className="er">−{rm}</span></> : null}</div>
      {lines.map((l, i) => {
        const first = l.sel && !lines[i - 1]?.sel;
        const last = l.sel && !lines[i + 1]?.sel;
        return (
          <div key={i} className={cx("b-dl", l.sign === "+" && "ad", l.sign === "-" && "rm", l.sel && "pk", first && "first", last && "last")}
            onClick={onLine ? () => { onLine(i); } : undefined} data-testid={sub(testId, i)}>
            <i>{l.old ?? ""}</i><i>{l.new ?? ""}</i><i>{l.sign ?? ""}</i>{l.text}
          </div>
        );
      })}
      {pop != null && <div className="b-quotepop">{pop}</div>}
    </div>
  );
}
