// src/app/side3d · the agents card (page native-mac §7, mockup 12): the project's live agents in
// the hub's rank (model inRank), each its 3D head (40, --c-sunken and a rule, its bim's outfit as
// in the world; '?' 16 in the accent when it asks) with its name under it, and its comic bubble
// (max 252, padding 8 12, r 12) from its typed state (model speechOf): it talks (a tail 6 at 14),
// thinks (the dots 6 and 4, italic text-2), asks (--c-accent-soft and the accent's rule, its
// card's first options as buttons of 24 that grow to 2 lines then clamp, the full words in the tip
// (OptButton, designer m_45875), 'answer…' on one line when words answer it). An option answers for real
// through the store's own pick, the inbox's path (store.do, model pickIntent); 'answer…' opens the
// card in the inbox (askInbox, ⌘I's door). Keyed by name: a state change redraws its bubble in
// place, no flicker. A click on a head or a bubble opens the agent's thread. Owner: nm-side.
import { useLayoutEffect, useRef, useState } from 'react';
import type { Agent, Card } from '@/proto';
import { Press, tipAttrs } from '@/ds';
import { shownName } from '@/agents/model';
import { useStore } from '@/store';
import type { AnswerAt } from '@/store/answered';
import { side } from '@/proto/words_side.gen';
import { askInbox } from '../inboxAsk';
import { useEntityMenu } from '../menus/use';
import { askButtons, pickIntent, speechOf, speechWord, type Speech } from './model';
import { ThingPic } from './Bubbles';
import { groupParts } from './lists';

/** a head in the card, css px */
export const HEAD_PX = 40;

function Head({ project, a, asks }: { project: string; a: Agent; asks: boolean }) {
  return (
    <span className="s3-head">
      <span className="s3-head-pic">
        <ThingPic thing={{ head: a.name, main: a.main }} px={HEAD_PX} tile="thread" />
      </span>
      {asks && (
        <span className="s3-head-q" {...tipAttrs(side.asks_tip({ agent: shownName(a.name) }))} data-testid={`app.flyout.agents.${project}.${a.name}.asks`}>
          ?
        </span>
      )}
    </span>
  );
}

/** An ask's option: its words clamped at 2 lines (side3d.css .s3-say-btn-w), the full words in its tip only when the clamp cuts them, below it first (above would cover the question it answers, designer m_45938). */
export function OptButton({ label, onPick, testId }: { label: string; onPick: () => void; testId: string }) {
  const w = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  useLayoutEffect(() => {
    const el = w.current;
    if (el !== null) setCut(el.scrollHeight > el.clientHeight);
  }, [label]);
  return (
    <Press look="s3-say-btn" onClick={onPick} data-testid={testId} {...(cut ? tipAttrs(label, undefined, 'below') : {})}>
      <span ref={w} className="s3-say-btn-w">{label}</span>
    </Press>
  );
}

function Words({ project, a, s, at, onOpen }: { project: string; a: Agent; s: Speech; at: AnswerAt | null; onOpen: () => void }) {
  const store = useStore();
  const who = (
    <span className="s3-say-who">
      {shownName(a.name)} · {speechWord(s)}
    </span>
  );
  const id = `app.flyout.agents.${project}.${a.name}`;
  if (s.k !== 'asks') {
    return (
      <Press look="s3-say" data-k={s.k} onClick={onOpen} data-testid={`${id}.say`}>
        {who}
        <span className="s3-say-text">{s.text}</span>
      </Press>
    );
  }
  const card: Card = s.card;
  const b = askButtons(card);
  return (
    <div className="s3-say" data-k="asks" data-testid={`${id}.say`}>
      <Press look="s3-say-open" onClick={onOpen}>
        {who}
        <span className="s3-say-text">{card.question}</span>
      </Press>
      <span className="s3-say-acts">
        {b.opts.map((o) => (
          <OptButton key={o.n} label={o.label} onPick={() => store.do(pickIntent(card, o.n, at))} testId={`${id}.opt.${String(o.n)}`} />
        ))}
        {b.words && (
          <Press look="s3-say-btn" data-one="" onClick={() => {
            askInbox({ project: card.project, card: card.id });
          }} data-testid={`${id}.answer`}>
            {side.answer}
          </Press>
        )}
      </span>
    </div>
  );
}

export interface AgentLineProps {
  readonly project: string;
  readonly a: Agent;
  /** the project's open cards */
  readonly cards: readonly Card[];
  /** where an answer is made from (the thread in view) */
  readonly at: AnswerAt | null;
  readonly onOpen: (agent: string) => void;
  /** its project's name on bise's own screen (designer m_45706: 'acme › perf'); none in a project */
  readonly group?: string;
}

/** One agent: its bubble, then its head and its name. */
export function AgentLine({ project, a, cards, at, onOpen, group }: AgentLineProps) {
  const s = speechOf(a, cards);
  const g = groupParts(group, shownName(a.name));
  const menu = useEntityMenu({ kind: 'agent', project, agent: a.name });
  const open = () => {
    onOpen(a.name);
  };
  return (
    <div className="s3-agent" data-k={s.k} onContextMenu={menu.onContextMenu} data-testid={`app.flyout.agents.${project}.${a.name}`}>
      <Words project={project} a={a} s={s} at={at} onOpen={open} />
      <Press look="s3-agent-who" aria-label={shownName(a.name)} onClick={open} data-row=""
        {...tipAttrs(`${shownName(a.name)} · ${speechWord(s)}`)}>
        <Head project={project} a={a} asks={s.k === 'asks'} />
        <span className="s3-agent-name" data-testid={`app.flyout.agents.${project}.${a.name}.name`}>{g.project !== '' && <span className="s3-group">{g.project}</span>}{g.name}</span>
      </Press>
    </div>
  );
}
