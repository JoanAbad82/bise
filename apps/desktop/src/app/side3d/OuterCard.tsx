// src/app/side3d · the outer card (page outer-side v2, Gabriel's pick m_46173): the Overview out of
// the panel, a card at the window's right (280 wide, 12 from the edges, the bar's included: its top
// inline, tilestate OUTER_TOP + the tile's room), shown while the panel is folded and the room leaves the column 480 (layout 'card'); a panel
// open gives way to the coins, then to the minis (Host). Its sections head in the folded side's
// style: the section's 3D object at 20, its name, its count, 'all ›'. AGENTS: one line of 28 each,
// in the hub's rank: its mark (the bar's language, ⌥N while ⌥ is held, an ask's in the accent),
// its head at 20, its name, its age while it works or asks, its PR, its ψ when it has its own
// worktree; idle and done step back. A click opens its thread; an ask's click opens it in place,
// its options and 'answer…' / 'write to perf…' under it. 15 at most, then '+ N more'. The other
// sections keep the floats' rows (FlyoutLists). Owner: nm-side.
import { useState, type ReactNode } from 'react';
import type { Card } from '@/proto';
import { AppIcon, Press, tipAttrs } from '@/ds';
import { sortCards } from '@/inbox/order';
import { useStore } from '@/store';
import type { AnswerAt } from '@/store/answered';
import { side } from '@/proto/words_side.gen';
import { waitLen } from '@/thread/wake';
import { AgentSign } from '../Marks';
import { askInbox } from '../inboxAsk';
import { useEntityMenu } from '../menus/use';
import { roleWords, type BarRow, type ProjAgent } from '../barrows';
import { ThingPic } from './Bubbles';
import { OptButton } from './FlyoutAgents';
import { askButtons, pickIntent } from './model';
import { bubbleThing, type BubbleId } from './objects';
import { groupParts } from './lists';
import { OUTER_TOP } from './tilestate';

/** the agents shown before '+ N more' (15 fit a 900 high window with the other sections) */
export const OUTER_AGENTS = 15;
/** an agent's head in the card, css px */
export const OUTER_HEAD_PX = 20;

/** the composer's field, where 'answer…' puts his words */
const COMPOSER_FIELD = '[data-testid="composer.field"]';

/** A section's head: its 3D object, its name, its count (and what waits on him, in the accent), 'all ›'. */
export function OuterHead({ id, name, count, loud, sum, onAll, onCube }: { id: BubbleId; name: string; count: string; loud?: string; sum?: string; onAll: () => void; onCube?: () => void }) {
  return (
    <header className="s3-ohead" data-testid={`app.outer.${id}.head`}>
      <span className="s3-ohead-pic" aria-hidden="true">
        <ThingPic thing={bubbleThing(id)} px={OUTER_HEAD_PX} tile={id === 'agents' ? 'thread' : id === 'artifacts' ? 'artifacts' : id === 'scheduled' ? 'scheduled' : 'terminal'} />
      </span>
      <b className="s3-ohead-name">{name}</b>
      {count !== '' && <span className="s3-ohead-n">{count}</span>}
      {loud !== undefined && loud !== '' && <span className="s3-ohead-loud" data-testid={`app.outer.${id}.loud`}>· {loud}</span>}
      {sum !== undefined && sum !== '' && <span className="s3-ohead-sum" data-testid={`app.outer.${id}.sum`}>· {sum}</span>}
      <Press look="s3-ohead-all" onClick={onAll} data-testid={`app.outer.${id}.all`}>{side.all_short}</Press>
      {onCube !== undefined && (
        <Press look="s3-ohead-cube" aria-label={side.tile_show} {...tipAttrs(side.tile_show)} onClick={onCube} data-testid={`app.outer.${id}.cube`}>
          <AppIcon name="cube" size={14} />
        </Press>
      )}
    </header>
  );
}

export interface OuterAgentsProps {
  readonly live: readonly BarRow[];
  readonly agents: readonly ProjAgent[];
  readonly cards: readonly Card[];
  readonly at: AnswerAt | null;
  /** the thread in view: its row is tinted */
  readonly here: { readonly project: string | null; readonly agent: string | null };
  readonly now: number;
  readonly groupOf?: (project: string) => string | undefined;
  readonly onOpen: (r: BarRow) => void;
  readonly onOpenPr: (r: BarRow) => void;
  readonly onMore: () => void;
}

/** The agents' rows past their worktree heads: each with its PR (its own, or its shared worktree's) and whether it works in a worktree. Pure. */
export function outerRows(live: readonly BarRow[], agents: readonly ProjAgent[]): { r: BarRow; pr: number | undefined; wt: boolean }[] {
  const heads = new Map(live.filter((r) => r.kind === 'group' && r.group !== undefined).map((r) => [r.group ?? '', r]));
  const byKey = new Map(agents.map((x) => [`${x.project}/${x.a.name}`, x.a]));
  return live.filter((r) => r.kind === 'agent').map((r) => {
    const head = r.group === undefined ? undefined : heads.get(r.group);
    const a = byKey.get(`${r.project}/${r.agent ?? ''}`);
    return { r, pr: r.mark?.pr ?? head?.mark?.pr ?? undefined, wt: r.group !== undefined || a?.mode === 'worktree' };
  });
}

/** AGENTS in the card: 15 lines at most, then '+ N more'. */
export function OuterAgents({ live, agents, cards, at, here, now, groupOf, onOpen, onOpenPr, onMore }: OuterAgentsProps) {
  const rows = outerRows(live, agents);
  const byKey = new Map(agents.map((x) => [`${x.project}/${x.a.name}`, x.a]));
  const [open, setOpen] = useState<string | null>(null);
  const more = rows.length - OUTER_AGENTS;
  return (
    <div className="s3-orows" data-testid="app.outer.agents.rows">
      {rows.slice(0, OUTER_AGENTS).map(({ r, pr, wt }) => {
        const a = byKey.get(`${r.project}/${r.agent ?? ''}`);
        const card = sortCards(cards.filter((c) => c.agent === r.agent && c.project === r.project))[0];
        return (
          <AgentLine key={r.key} r={r} pr={pr} wt={wt} job={a === undefined ? r.sub : roleWords(a.note || a.title || a.purpose)} card={card} at={at} now={now}
            here={here.project === r.project && here.agent === r.agent} group={groupOf?.(r.project)} open={open === r.key}
            onToggle={() => {
              setOpen((o) => (o === r.key ? null : r.key));
            }} onOpen={onOpen} onOpenPr={onOpenPr} />
        );
      })}
      {more > 0 && (
        <Press look="s3-omore" onClick={onMore} data-testid="app.outer.agents.more">
          {side.more_agents({ n: more })}
        </Press>
      )}
    </div>
  );
}

interface LineProps {
  readonly r: BarRow;
  readonly pr: number | undefined;
  readonly wt: boolean;
  readonly job: string;
  readonly card: Card | undefined;
  readonly at: AnswerAt | null;
  readonly now: number;
  readonly here: boolean;
  readonly group: string | undefined;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly onOpen: (r: BarRow) => void;
  readonly onOpenPr: (r: BarRow) => void;
}

/** One agent's line: mark · head · name · age · PR · ψ; an ask opens in place under it. */
function AgentLine({ r, pr, wt, job, card, at, now, here, group, open, onToggle, onOpen, onOpenPr }: LineProps) {
  const store = useStore();
  const menu = useEntityMenu({ kind: 'agent', project: r.project, agent: r.agent ?? '' });
  const st = r.state;
  const asks = card !== undefined;
  const id = `app.outer.agents.${r.project}.${r.agent ?? ''}`;
  const g = groupParts(group, r.name);
  const key = r.glyph.startsWith('⌥') ? r.glyph : null;
  const age = asks ? waitLen(now - card.since_ms) : st?.tone === 'work' ? (r.time ?? '') : '';
  const b = card === undefined ? null : askButtons(card);
  return (
    <div className="s3-orow" data-asks={asks || undefined} data-here={here || undefined} data-back={st?.back === true || undefined} data-open={open || undefined}
      onContextMenu={menu.onContextMenu} data-testid={id}>
      <Press look="s3-orow-open" aria-label={r.title} aria-expanded={asks ? open : undefined} {...tipAttrs(`${r.name} · ${job}`)} onClick={() => {
        if (asks) onToggle();
        else onOpen(r);
      }} data-row="">
        <span className="s3-orow-mark" data-tone={st?.tone} data-testid={`${id}.mark`}>
          {key !== null ? <span className="s3-orow-key">{key}</span> : <Mark g={st?.g ?? ''} id={id} />}
        </span>
        <span className="s3-orow-head" aria-hidden="true">
          <ThingPic thing={{ head: r.agent ?? '', main: r.main === true }} px={OUTER_HEAD_PX} tile="thread" />
        </span>
        <span className="s3-orow-name" data-testid={`${id}.name`}>{g.project !== '' && <span className="s3-group">{g.project}</span>}{g.name}</span>
        {age !== '' && <span className="s3-orow-age" {...tipAttrs(st?.tip)} data-testid={`${id}.age`}>{age}</span>}
        {pr !== undefined && (
          <span className="s3-orow-pr" role="button" {...tipAttrs(r.mark?.tip ?? `#${String(pr)}`)} onClick={(e) => {
            e.stopPropagation();
            onOpenPr(r);
          }} data-testid={`${id}.pr`}><AppIcon name="branch" size={14} />#{String(pr)}</span>
        )}
        {wt && <span className="s3-orow-wt" {...tipAttrs(side.in_worktree)} data-testid={`${id}.wt`}>ψ</span>}
      </Press>
      {open && card !== undefined && b !== null && (
        <div className="s3-orow-ask" data-testid={`${id}.ask`}>
          <span className="s3-orow-q">{card.question}</span>
          <span className="s3-orow-acts">
            {b.opts.map((o) => (
              <OptButton key={o.n} label={o.label} onPick={() => store.do(pickIntent(card, o.n, at))} testId={`${id}.opt.${String(o.n)}`} />
            ))}
            <Press look="s3-arow-answer" onClick={() => {
              askInbox({ project: card.project, card: card.id });
              requestAnimationFrame(() => {
                document.querySelector<HTMLElement>(COMPOSER_FIELD)?.focus();
              });
            }} data-testid={`${id}.answer`}>
              {card.approval === true ? side.write_to({ agent: r.name }) : side.answer}
            </Press>
          </span>
        </div>
      )}
    </div>
  );
}

/** An agent's mark in the bar's language: the circled ? (asks), the breath (works), '…', '✓', '✗', '◷'; nothing at rest. */
function Mark({ g, id }: { g: string; id: string }): ReactNode {
  if (g === '?') return <AgentSign mark="asks" testId={`${id}.sign`} />;
  if (g === '∿') return <AgentSign mark="works" testId={`${id}.sign`} />;
  if (g === '') return null;
  return <span className="s3-orow-g">{g}</span>;
}

/** One section of the card: its head and its rows. */
export function OuterSection({ id, name, count, loud, sum, onAll, onCube, children }: { id: BubbleId; name: string; count: string; loud?: string; sum?: string; onAll: () => void; onCube?: () => void; children?: ReactNode }) {
  return (
    <section className="s3-osec" data-testid={`app.outer.${id}`}>
      <OuterHead id={id} name={name} count={count} {...(loud === undefined ? {} : { loud })} {...(sum === undefined ? {} : { sum })} onAll={onAll} {...(onCube === undefined ? {} : { onCube })} />
      {children}
    </section>
  );
}

/**
 * The card: its sections, scrolling inside when they pass its height. `tile`: the room the bims'
 * tile and its handle take above it (0: hidden); `scrolls`: past the heads alone, the agents' list
 * scrolls inside (tilestate.ts outerFold).
 */
export function OuterCard({ tile = 0, scrolls = false, children }: { tile?: number; scrolls?: boolean; children: ReactNode }) {
  return (
    <aside className="s3-outer" style={{ top: OUTER_TOP + tile }} data-scrolls={scrolls || undefined} data-testid="app.outer">
      {children}
    </aside>
  );
}
