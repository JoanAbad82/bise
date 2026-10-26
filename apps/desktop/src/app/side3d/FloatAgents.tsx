// src/app/side3d · the agents float with Overview's rows (page folded-side v9, Gabriel's pick: A's
// floats; designer m_45474): the same rows as the Overview's AGENTS (app/agentrows.ts): main
// first as 'bise', each agent its 40 head, then its mark (∿ at work, ? asks, ✗ failed, ✓ done, ⌥N
// while ⌥ is held), its name, the computer use mark when it uses his computer, its time, its
// context ring with its % from 70, its PR's number (a click opens the review); its now line under
// it, in red when it failed. An agent that asks him: its row on --c-accent-soft with the card's
// first two options in one click and 'answer…'. A worktree two agents share: its 'ψ <branch> · N
// agents' head with its PR, its agents under it; an open PR with no agent its own row. The foot
// folds ARCHIVED open ('▸ 3 archived'). Owner: nm-side.
import type { Agent, Card } from '@/proto';
import { AppIcon, Press, Ring, tipAttrs } from '@/ds';
import { sortCards } from '@/inbox/order';
import { useStore } from '@/store';
import type { AnswerAt } from '@/store/answered';
import { panel } from '@/proto/words_panel.gen';
import { side } from '@/proto/words_side.gen';
import { markTip } from '../tipwords';
import { AgentSign, agentMark } from '../RightBar';
import { askInbox } from '../inboxAsk';
import { useEntityMenu } from '../menus/use';
import type { BarRow, ProjAgent } from '../barrows';
import { ThingPic } from './Bubbles';
import { askButtons, pickIntent } from './model';
import { groupParts } from './lists';

/** a row's test id in the float: the Overview's own, under the float's ('app.flyout.agents.agent.perf'), never the same id twice in the window */
export const floatId = (r: BarRow): string =>
  r.kind === 'agent' || (r.kind === undefined && r.agent !== undefined && !r.testId.startsWith('app.right.archived.'))
    ? `app.flyout.agents.${r.project}.${r.agent ?? ''}`
    : r.testId.replace(/^app\.right\./u, 'app.flyout.agents.');

/** a row's head, css px */
export const ROW_HEAD_PX = 40;

export interface FloatAgentsProps {
  readonly live: readonly BarRow[];
  readonly agents: readonly ProjAgent[];
  readonly cards: readonly Card[];
  /** where an answer is made from (the thread in view) */
  readonly at: AnswerAt | null;
  readonly onOpen: (r: BarRow) => void;
  /** a mark or a head's PR: the review (an orphan's: its branch) */
  readonly onOpenPr: (r: BarRow) => void;
  /** a row's project's name on bise's own screen ('acme › perf', designer m_45706); none in a project */
  readonly groupOf?: (project: string) => string | undefined;
}

/** The agents float's rows. */
export function FloatAgents({ live, agents, cards, at, onOpen, onOpenPr, groupOf }: FloatAgentsProps) {
  const byKey = new Map(agents.map((x) => [`${x.project}/${x.a.name}`, x.a]));
  return (
    <>
      {live.map((r) => {
        if (r.kind === 'group' || r.kind === 'orphan') return <HeadRow key={r.key} r={r} members={live.filter((m) => m.kind === 'agent' && m.group === r.group).length} onOpen={onOpen} onOpenPr={onOpenPr} />;
        const a = byKey.get(`${r.project}/${r.agent ?? ''}`);
        const card = sortCards(cards.filter((c) => c.agent === r.agent && c.project === r.project))[0];
        return <AgentRow key={r.key} r={r} a={a} card={card} at={at} onOpen={onOpen} onOpenPr={onOpenPr} group={groupOf?.(r.project)} />;
      })}
    </>
  );
}

/** A row's PR: its number when it has one, else its worktree's mark; a click opens the review. */
function Pr({ r, onOpenPr }: { r: BarRow; onOpenPr: (r: BarRow) => void }) {
  const m = r.mark;
  if (m === undefined) return null;
  return (
    <span className="s3-arow-pr" data-tone={m.tone} role="button" aria-label={m.tip} {...tipAttrs(markTip(m, r.kind === 'orphan'))}
      onClick={(e) => {
        e.stopPropagation();
        onOpenPr(r);
      }} data-testid={`${floatId(r)}.pr`}>
      {m.pr !== undefined ? `#${String(m.pr)}` : m.g}
    </span>
  );
}

function AgentRow({ r, a, card, at, onOpen, onOpenPr, group }: { r: BarRow; a: Agent | undefined; card: Card | undefined; at: AnswerAt | null; onOpen: (r: BarRow) => void; onOpenPr: (r: BarRow) => void; group: string | undefined }) {
  const g = groupParts(group, r.name);
  const store = useStore();
  const menu = useEntityMenu({ kind: 'agent', project: r.project, agent: r.agent ?? '' });
  const asks = card !== undefined;
  const b = card === undefined ? null : askButtons(card);
  const failed = r.glyph === '✗';
  const id = floatId(r);
  return (
    <div className="s3-arow" data-asks={asks || undefined} data-group={r.group} onContextMenu={menu.onContextMenu} data-testid={id}>
      <Press look="s3-arow-open" aria-label={r.title} onClick={() => {
        onOpen(r);
      }} data-row="">
        <span className="s3-head s3-arow-head">
          <span className="s3-head-pic">
            <ThingPic thing={{ head: r.agent ?? '', main: a?.main === true }} px={ROW_HEAD_PX} tile="thread" />
          </span>
        </span>
        <span className="s3-arow-text">
          <span className="s3-arow-l1">
            <span className={`s3-arow-sign ${r.tone}`} {...tipAttrs(r.tips?.glyph)} data-testid={`${id}.sign`}>
              {r.glyph.startsWith('⌥') ? <span className="s3-arow-key">{r.glyph}</span> : <AgentSign mark={agentMark(r.glyph, r.working === true)} testId={`${id}.sign`} />}
            </span>
            <span className="s3-arow-name" data-testid={`${id}.name`}>{g.project !== '' && <span className="s3-group">{g.project}</span>}{g.name}</span>
            {r.cu !== undefined && (
              <span className={`app-cu ${r.cu.tone}`} {...tipAttrs(r.cu.title)} data-testid={`${id}.computer`}>
                {r.cu.g}
              </span>
            )}
            <span className="s3-arow-cols">
              <span className="s3-arow-time" {...tipAttrs(r.tips?.time)} data-testid={`${id}.time`}>{r.time ?? ''}</span>
              {r.ctx !== undefined && r.pct !== undefined && r.pct !== '' && (
                <span className="s3-arow-pct" {...tipAttrs(r.tips?.pct)} data-testid={`${id}.pct`}>
                  <Ring pct={r.ctx} testId={`${id}.ring`} />
                  {r.pct}
                </span>
              )}
              <Pr r={r} onOpenPr={onOpenPr} />
            </span>
          </span>
          <span className="s3-arow-l2" data-err={failed || undefined} data-testid={`${id}.role`}>{asks ? card.question : r.sub}</span>
        </span>
      </Press>
      {b !== null && card !== undefined && (
        <span className="s3-arow-acts">
          {b.opts.map((o) => (
            <Press key={o.n} look="s3-say-btn" onClick={() => store.do(pickIntent(card, o.n, at))} data-testid={`${id}.opt.${String(o.n)}`}>
              {o.label}
            </Press>
          ))}
          {b.words && (
            <Press look="s3-arow-answer" onClick={() => {
              askInbox({ project: card.project, card: card.id });
            }} data-testid={`${id}.answer`}>
              {side.answer}
            </Press>
          )}
        </span>
      )}
    </div>
  );
}

/** A worktree's head ('ψ auth-v2 · 2 agents', its PR) or an open PR with no agent. */
function HeadRow({ r, members, onOpen, onOpenPr }: { r: BarRow; members: number; onOpen: (r: BarRow) => void; onOpenPr: (r: BarRow) => void }) {
  const id = floatId(r);
  return (
    <Press look="s3-arow-group" aria-label={r.title} {...tipAttrs(r.title)} onClick={() => {
      onOpen(r);
    }} data-row="" data-orphan={r.kind === 'orphan' || undefined} data-testid={id}>
      <span className="s3-arow-g" aria-hidden="true">{r.kind === 'group' ? r.glyph : <AppIcon name="branch" size={14} />}</span>
      <span className="s3-arow-gname">{r.name}</span>
      {r.kind === 'group' && members > 0 && <span className="s3-arow-gn">{panel.tip_agents({ n: members })}</span>}
      <span className="s3-arow-cols">
        <Pr r={r} onOpenPr={onOpenPr} />
      </span>
    </Press>
  );
}

/** The foot's fold: '▸ 3 archived', open its rows (their sign, name and age), newest first. */
export function ArchivedFold({ rows, open, onToggle, onOpen }: { rows: readonly BarRow[]; open: boolean; onToggle: () => void; onOpen: (r: BarRow) => void }) {
  if (rows.length === 0) return null;
  return (
    <>
      <Press look="s3-fold" aria-expanded={open} onClick={onToggle} data-testid="app.flyout.agents.archived">
        <span className="s3-fold-tri" data-open={open || undefined} aria-hidden="true">▸</span>
        {side.archived({ n: rows.length })}
      </Press>
      {open && (
        <span className="s3-archived" data-testid="app.flyout.agents.archived.rows">
          {rows.map((r) => (
            <Press key={r.key} look="s3-arow-old" aria-label={r.title} {...tipAttrs(r.title)} onClick={() => {
              onOpen(r);
            }} data-row="" data-testid={floatId(r)}>
              <span className={`s3-arow-g ${r.tone}`} aria-hidden="true">{r.glyph}</span>
              <span className="s3-arow-gname">{r.name}</span>
              <span className="s3-arow-time">{r.end}</span>
            </Press>
          ))}
        </span>
      )}
    </>
  );
}
