// The composer's context strip (bise fait mac, mockup 1; it replaced designer's composer-strip A
// tab): the box's first row, 32 high, 12/16 text-2, 14 px icons, 16 between: the project (its
// picker when the screen gives one: it changes where his words go), the place ('local' or
// 'worktree', its path in the tip) and the branch in mono, each a tipped label when there is
// nothing to pick (native-lead m_42159: a picker only where a real choice exists). On the right
// the context ring, or the screen's own words ('esc to bise instead', the approvals flash). His
// words answering a card (or another agent's @name, an open artifact): the label alone in the
// accent, '↳ answering search · …' (answerFit). His words to an agent that is not main: 'to perf'
// first, in the accent, always kept (his ask m_44704). Items that don't fit go whole (tab.ts stripFit),
// measured on a resize or new words, never per keystroke (the composer is memoised). Owner:
// nm-composer.
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Agent } from '@/proto';
import { AppIcon, PickerPop, PickerTrigger, Ring, RowMark, tipAttrs } from '@/ds';
import { useFlow, usePlaces, useProjects } from '@/store';
import { placeOf as placeOfAgent, tilde, worktreeParts } from '@/app/barplaces';
import { WorkingMark } from '@/app/Marks';
import { useNow } from '@/app/clock';
import { composer } from '../proto/words.gen';
import { answerFit, contextOf, RING_CLEAR_PCT, ringTip, stripFit, stripState, tabPlace, type StripFit, type TabPlace, type TabWords } from './tab';
import { waitLen } from './wake';

/** his home folder, for '~/…' in the tips (main's window.bise.home) */
const HOME = (globalThis as { bise?: { home?: string } }).bise?.home;

/** Where `a` works, as the strip names it (tab.ts tabPlace): its worktree's Place and his checkout's path. */
export function useTabPlace(project: string, a: Agent | undefined, home: boolean): TabPlace | undefined {
  const places = usePlaces(project);
  const path = useProjects().find((p) => p.project === project)?.path;
  const wt = a === undefined ? undefined : placeOfAgent(a, places);
  const tip = wt === undefined ? '' : worktreeParts(wt, HOME).map((x) => x.t).join('');
  return tabPlace(a, home, wt === undefined ? undefined : { path: wt.path ?? (wt.id.startsWith('pt:') ? wt.id.slice(3) : null), tip }, path, (x) => tilde(x, HOME));
}

/** The strip's words as one object while they hold (a memoised composer never draws again for an
 *  unrelated render of its screen). */
export function useTabWords(label: string, place: TabPlace | undefined, context: string, who: string): TabWords {
  const name = place?.name;
  const worktree = place?.worktree;
  const tip = place?.tip;
  const branch = place?.branch;
  return useMemo(
    () => ({ label, place: name === undefined ? undefined : { name, worktree: worktree === true, tip: tip ?? '', branch }, context, who }),
    [label, name, worktree, tip, branch, context, who],
  );
}

/** The strip's project: its hub id, and what picking another one does (none: a tipped label). */
export interface StripProject {
  readonly id: string;
  readonly onPick?: ((project: string) => void) | undefined;
}

const ALL: StripFit = { project: true, state: true, end: true };
/** The room a notice at the strip's right keeps at least (Composer's NoticeLine cuts its words to the rest). */
const NOTICE_ROOM = 160;

/** A string's width in a font, by a canvas (null: no canvas, as in unit tests: the css clip then). */
function widthIn(font: string): ((s: string) => number) | null {
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx === null) return null;
  ctx.font = font;
  return (s) => Math.ceil(ctx.measureText(s).width);
}

/**
 * A label's width as MarkedLabel draws it: its first part in the `.who` span's font (bold in the
 * accent strip), the rest in the label's. Measured all in the label's font, a bold head came out
 * short and the css clip cut the question mid-word (designer m_27021: 'next to th…').
 */
function labelWidth(lbl: HTMLElement): ((s: string) => number) | null {
  const reg = widthIn(getComputedStyle(lbl).font);
  if (reg === null) return null;
  const who = lbl.querySelector<HTMLElement>('.who');
  const head = (who === null ? null : widthIn(getComputedStyle(who).font)) ?? reg;
  return (s) => {
    const i = s.indexOf(' · ');
    return i < 0 ? head(s) : head(s.slice(0, i)) + reg(s.slice(i));
  };
}

/** The label with its mark after the first part: '↳ answering perf' ∿ ' · the question'. */
function MarkedLabel({ label, mark }: { label: string; mark: ReactNode }) {
  const cut = label.indexOf(' · ');
  return cut < 0 ? (
    <>
      <span className="who">{label}</span>
      {mark}
    </>
  ) : (
    <>
      <span className="who">{label.slice(0, cut)}</span>
      {mark}
      {label.slice(cut)}
    </>
  );
}

/** The project's segment: its name with the folder icon; with `onPick`, a button that opens the projects' picker. */
function ProjectItem({ project, shown, testId }: { project: StripProject; shown: boolean; testId: string }) {
  const rows = useProjects();
  const row = rows.find((p) => p.project === project.id);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  if (row === undefined) return null;
  const pick = project.onPick;
  const cls = shown ? 'it' : 'it gone';
  const inner = (
    <>
      <AppIcon name="folder" size={14} />
      <span className="nm">{row.name}</span>
    </>
  );
  if (pick === undefined) {
    return (
      <span className={cls} data-item="project" data-testid={`${testId}.project`} {...tipAttrs(composer.ctx_project_tip({ path: tilde(row.path, HOME) }))} aria-hidden={!shown || undefined}>
        {inner}
      </span>
    );
  }
  return (
    <>
      <PickerTrigger ref={trigger} extra={`${cls} cmp-ctx-pick`} open={open} label={composer.ctx_project_pick({ project: row.name })}
        tip={composer.ctx_project_pick({ project: row.name })} testId={`${testId}.project`}
        onClick={() => {
          setOpen((o) => !o);
        }}>
        {inner}
      </PickerTrigger>
      {open && (
        <PickerPop
          anchor={trigger}
          box=".box"
          side="above"
          align="start"
          title={composer.ctx_projects}
          groups={[{ id: 'projects', rows: rows.map((p) => ({ id: p.project, name: p.name, current: p.project === project.id, testId: `${testId}.project.pick.${p.project}` })) }]}
          onPick={(id) => {
            setOpen(false);
            if (id !== project.id) pick(id);
          }}
          onClose={() => {
            setOpen(false);
          }}
          testId={`${testId}.project.menu`}
        />
      )}
    </>
  );
}

export function ComposerTab({ words, mark, end, project, bare = false, newPlace = false, to = false, at, testId }: {
  words: TabWords;
  /** his words go to an agent that is not main (pinkState's quiet, or an open item only its options
   *  decide): 'to perf' first, in the accent; bare, the label's rest text-3 (designer m_44890) */
  to?: boolean;
  /** after the label's first part (bare): the addressee's working gust */
  mark?: ReactNode;
  /** the right end instead of the context ring */
  end?: ReactNode;
  /** the project segment; none: not said */
  project?: StripProject | undefined;
  /** the label alone (answering, an @name, an open artifact): no project, place or branch */
  bare?: boolean;
  /** the empty home: the branch is the project's own (main starts its worktrees from it) */
  newPlace?: boolean;
  /** the addressee's row: its state while it runs (tab.ts stripState); none or idle: nothing said */
  at?: Agent | undefined;
  testId: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // the strip's own minute clock: 'working · 3 min' moves, the memoised field above never redraws
  const now = useNow();
  const state = bare ? null : stripState(at, now);
  // the empty home: the project's own branch (where main starts its worktrees from)
  const projectBranch = useProjects().find((p) => p.project === project?.id)?.branch ?? undefined;
  const flow = useFlow(project?.id ?? '');
  const [fit, setFit] = useState<StripFit>(ALL);
  // the label cut after a whole word when even alone it doesn't fit (designer m_24325); null: whole
  const [cut, setCut] = useState<string | null>(null);
  // answering, the end ('esc to bise instead') goes once the question has gone (answerFit)
  const [endIn, setEndIn] = useState(true);
  const context = words.context ?? '';
  const ring = contextOf(context);
  const place = words.place;
  const key = `${words.label}|${place?.name ?? '-'}|${place?.branch ?? ''}|${project?.id ?? ''}|${context}|${end === undefined ? '' : 'end'}|${bare ? 'b' : ''}|${to ? 't' : ''}`;
  useLayoutEffect(() => {
    const host = ref.current?.closest<HTMLElement>('.head');
    if (host == null) return;
    const measure = () => {
      const q = (sel: string) => host.querySelector<HTMLElement>(sel);
      const nat = (e: HTMLElement | null) => (e === null ? 0 : Math.ceil(e.scrollWidth));
      const cs = getComputedStyle(host);
      const gap = parseFloat(cs.columnGap) || 0;
      const inner = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - (q(':scope > .notice') === null ? 0 : NOTICE_ROOM + gap);
      if (bare) {
        const lbl = q('[data-item="label"]');
        const markEl = lbl?.querySelector<HTMLElement>('[data-testid="thread.mark"]') ?? null;
        const markW = markEl === null ? 0 : Math.ceil(markEl.getBoundingClientRect().width + (parseFloat(getComputedStyle(markEl).marginLeft) || 0));
        const width = lbl === null ? null : labelWidth(lbl);
        const endEl = q('[data-item="end"]');
        const endW = endEl === null ? 0 : nat(endEl) + gap;
        if (width === null) return;
        // the question first, then the end; '↳ answering search' never goes; an open artifact's
        // '· about “…”' whole or gone (designer m_27021)
        const f = answerFit(words.label, inner - markW, endW, width, words.whole === true);
        const nextCut = f.label === words.label ? null : f.label;
        setCut((c) => (c === nextCut ? c : nextCut));
        setEndIn(f.end);
        return;
      }
      setEndIn(true);
      const w = { project: nat(q('[data-item="project"]')), state: nat(q('[data-item="state"]')), branch: nat(q('[data-item="branch"]')), end: nat(q('[data-item="end"]')) };
      // 'to perf' always stays: the rest fits in what it leaves
      const toEl = q('[data-item="to"]');
      const next = stripFit({ avail: inner - (toEl === null ? 0 : nat(toEl) + gap), gap, ...w });
      setFit((f) => (f.project === next.project && f.state === next.state && f.end === next.end ? f : next));
      // the label is only drawn bare; a plain strip never cuts one
      setCut((c) => (c === null ? c : null));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => {
      ro.disconnect();
    };
  }, [key, words.label, words.whole, bare, to]);
  const endEl =
    end !== undefined ? (
      <span className={endIn && fit.end ? 'end' : 'end gone'} data-item="end" data-testid={`${testId}.end`} aria-hidden={!(endIn && fit.end) || undefined}>
        {end}
      </span>
    ) : (
      !bare &&
      ring !== null && (
        // the tokens and the ring, its words in the tip; past 80% the percent shows in clear too
        <span className={fit.end ? 'end ctx' : 'end ctx gone'} data-item="end" data-testid={`${testId}.context`} {...tipAttrs(ringTip(words.who ?? 'its', ring))} aria-label={ringTip(words.who ?? 'its', ring)}
          aria-hidden={!fit.end || undefined} data-pct={Math.round(ring.pct)}>
          {/* the tokens used left of the ring (his ask m_26205: '84k'), past 80% its percent too */}
          <span className="num">{ring.pct > RING_CLEAR_PCT ? `${ring.tokens} · ${String(Math.round(ring.pct))}%` : ring.tokens}</span>
          <Ring pct={ring.pct} />
        </span>
      )
    );
  if (bare) {
    return (
      <span ref={ref} className="cmp-ctx bare" data-testid={testId}>
        <span className={to ? 'lbl to' : 'lbl'} data-item="label" data-testid={`${testId}.to`}>
          <MarkedLabel label={cut ?? words.label} mark={mark} />
        </span>
        {endEl}
      </span>
    );
  }
  const branch = newPlace ? projectBranch : place?.branch;
  // a trunk project's fact, where the work lands, text-3 after the branch (designer m_43996): never
  // a loose line between the thread and the dock
  const lands = flow === 'trunk' && branch !== undefined ? composer.ctx_lands({ branch: projectBranch ?? 'main' }) : null;
  return (
    <span ref={ref} className="cmp-ctx" data-testid={testId}>
      {/* his words go to an agent that is not main: 'to perf' first, in the accent, as main's tab
          had it (agent-target, designer m_28208; his ask m_44704: clear at a glance) */}
      {to && (
        <span className="it to" data-item="to" data-testid={`${testId}.to`}>
          <span className="nm">{words.label}</span>
        </span>
      )}
      {project !== undefined && <ProjectItem project={project} shown={fit.project} testId={testId} />}
      {/* where 'local' was (his m_44719: the only option, no control): the addressee's state while
          it runs, main's breath and how long, or the ask mark in the accent; nothing when idle */}
      {state !== null && (
        <span className={fit.state ? 'it st' : 'it st gone'} data-item="state" data-state={state.kind} data-testid={`${testId}.state`} aria-hidden={!fit.state || undefined}>
          {state.kind === 'working' ? <WorkingMark testId={`${testId}.state.mark`} /> : <RowMark icon="ask" tone="accent" label={composer.ctx_waits} />}
          <span className="nm">{state.kind === 'working' ? composer.ctx_working({ dur: waitLen(state.ms) }) : composer.ctx_waits}</span>
        </span>
      )}
      {branch !== undefined && (
        <span className="it br" data-item="branch" data-testid={`${testId}.branch`} {...tipAttrs(composer.ctx_branch_tip({ branch }))}>
          <AppIcon name="branch" size={14} />
          <span className="nm mono">{branch}</span>
        </span>
      )}
      {lands !== null && (
        <span className="it lands" data-item="lands" data-testid={`${testId}.lands`}>
          <span className="nm">{lands}</span>
        </span>
      )}
      {endEl}
    </span>
  );
}
