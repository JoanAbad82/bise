// The agent view's head (designer's desktop-screens v6 (1) and (3)): one row, 16 px sides. An
// agent: its name in 600, its role line, its state chip; at the right, quiet, its branch and
// files (opens the review), 'changes ⌘D', '⋯'. A project's bise: its 14 px pearl, 'bise ·
// storefront', the project's chip. Under 1000 px the name goes to the titlebar's crumb (amb-win's)
// and the head keeps the chip and the buttons. LiveLine: what it does now, at the thread's end.
// StartingLine: the empty thread's line. The words are head.ts's. Owner: amb-home.
import type { ReactNode } from 'react';
import type { Agent } from '@/proto';
import { useAgents, useApprovals, useDiff, useModels } from '@/store';
import { useNow } from '@/app/clock';
import { ago } from '@/agents/model';
import { useRouter } from '@/app/router';
import { BisePearl } from '@/app/BisePearl';
import { metaWords } from './meta';
import { biseChip, branchLine, roleOf, stateChip, type StateChip } from './head';

function Chip({ chip, testId }: { chip: StateChip; testId: string }) {
  return (
    <span className={chip.needs ? 'ah-chip needs' : chip.live ? 'ah-chip live' : 'ah-chip'} data-testid={testId} data-needs={chip.needs}>
      {chip.text}
    </span>
  );
}

/** An agent's head (`starting`: its thread has nothing of its own yet). `more` is the '⋯' button (rename, model; the screen owns its panel); `note` a quiet word after the chip ('voice mode'); its context gauge after it. */
export function AgentHead({ project, a, more, note, starting = false }: { project: string; a: Agent; more?: ReactNode; note?: string | undefined; starting?: boolean }) {
  const models = useModels(project);
  const mode = useApprovals(project)?.mode;
  const meta = metaWords(models, a.model, a.effort, mode);
  const now = useNow();
  const router = useRouter();
  const diff = useDiff(project, a.name);
  const branch = branchLine(a.branch, diff?.files.length);
  const review = () => {
    router.go({ screen: 'review', project, agent: a.name });
  };
  return (
    <div className="ah" data-testid="thread.head">
      <span className="ah-who">
        <b className="ah-name" data-testid="thread.head.name">
          {a.name}
        </b>
        {roleOf(a) !== '' && (
          <span className="ah-role" data-testid="thread.head.role">
            {roleOf(a)}
          </span>
        )}
      </span>
      <Chip chip={starting && a.waits === 0 ? { text: 'starting', needs: false, live: true } : stateChip(a, now)} testId="thread.head.state" />
      {note !== undefined && (
        <span className="ah-note" data-testid="thread.voice">
          {note}
        </span>
      )}
      {/* its model, effort and the approvals mode, as the TUI's divider (S40/W3, R10): 'opus · high · auto' */}
      {meta !== '' && (
        <span className="ah-note" data-testid="thread.meta">
          {meta}
        </span>
      )}
      {/* its context gauge, the hub's words as sent (the TUI's divider: '42k · 17%') */}
      {a.usage?.words != null && a.usage.words !== '' && (
        <span className="ah-note" data-testid="thread.usage">
          {a.usage.words}
        </span>
      )}
      <span className="ah-end">
        {branch !== '' && (
          <button type="button" className="ah-quiet" onClick={review} data-testid="thread.head.branch" title="its changes">
            {branch}
          </button>
        )}
        <button type="button" className="ah-btn" onClick={review} data-testid="thread.head.changes">
          changes <kbd>⌘D</kbd>
        </button>
        {more}
      </span>
    </div>
  );
}

/** A project's bise: 'bise · storefront' and what its agents do. */
export function BiseHead({ project, name, more }: { project: string; name: string; more?: ReactNode }) {
  const agents = useAgents(project);
  const router = useRouter();
  return (
    <div className="ah ah-bise" data-testid="thread.head">
      <span className="ah-who">
        {/* ink at rest, pink only while bise waits on him (ambient's thread spec f, designer m_12127) */}
        <BisePearl size={14} />
        <b className="ah-name" data-testid="thread.head.name">
          bise<span className="ah-project"> · {name}</span>
        </b>
      </span>
      <button
        type="button"
        className="ah-chip-btn"
        onClick={() => {
          router.go({ screen: 'agents', project });
        }}
        data-testid="thread.agents"
      >
        <Chip chip={biseChip(agents)} testId="thread.head.state" />
      </button>
      <span className="ah-end">{more}</span>
    </div>
  );
}

/** The live line at the thread's end while it works (v6 (2)): '∿ running the bench three more times · 1 min'. */
export function LiveLine({ a }: { a: Agent | undefined }) {
  const now = useNow();
  if (a === undefined || a.archived || a.status !== 'working' || a.title === '') return null;
  const t = ago(a.since_ms, now);
  return (
    <div className="th-live" data-testid="thread.live" aria-live="polite">
      ∿ {a.title}
      {t !== 'now' ? ` · ${t}` : ''}
    </div>
  );
}

/** The empty thread (v6 (5)): under his first message, '· checkout is starting: its own folder, sb/checkout'. */
export function StartingLine({ a }: { a: Agent }) {
  const where = a.branch != null && a.branch !== '' ? `its own folder, ${a.branch}` : "the project's folder";
  return (
    <div className="th-starting" data-testid="thread.starting">
      · {a.name} is starting: {where}
    </div>
  );
}
