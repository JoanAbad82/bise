// The agent view's head (designer's desktop-screens v6 (1) and (3)): one row, 16 px sides. An
// agent: its name in 600, its role line, its state chip; at the right, quiet, its branch and
// files (opens the review), 'changes ⌘D', '⋯'. A project's bise: its 14 px pearl, 'bise ·
// storefront', the project's chip. Under 1000 px the name goes to the titlebar's crumb (amb-win's)
// and the head keeps the chip and the buttons. LiveLine: what it does now, at the thread's end.
// StartingLine: the empty thread's line. The words are head.ts's. Owner: amb-home.
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Agent } from '@/proto';
import { useAgents, useComputerLive, useDiff } from '@/store';
import { useNow } from '@/app/clock';
import { Breath, Gust, Pulse } from '@/working/Signs';
import { turnAge } from '@/working/gust';
import { useRouter } from '@/app/router';
import { BisePearl } from '@/app/BisePearl';
import { archivedFit, biseChip, branchLine, dropsFor, roleOf, stateChip, usageLine, workingRowShows, type StateChip } from './head';
import { waitingFor, waitsEvent } from './wake';
import { Button, Press } from '@/ds';

/** an agent whose wheel he took waits for him, like any agent that asks him */
const HELD: StateChip = { text: '? waiting for you', needs: true, live: false };

function Chip({ chip, testId }: { chip: StateChip; testId: string }) {
  return (
    <span className={chip.needs ? 'ah-chip needs' : chip.live ? 'ah-chip live' : 'ah-chip'} data-testid={testId} data-needs={chip.needs}>
      {chip.breath === true && (
        <>
          <Breath testId={`${testId}.breath`} />{' '}
        </>
      )}
      {chip.text}
    </span>
  );
}

function useHeadFit(ref: RefObject<HTMLDivElement | null>, words: string): 0 | 1 | 2 {
  const [drop, setDrop] = useState<0 | 1 | 2>(0);
  useLayoutEffect(() => {
    const head = ref.current;
    if (head === null) return;
    const measure = () => {
      const q = (id: string) => head.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      const nat = (e: HTMLElement | null) => (e === null ? 0 : Math.ceil(e.scrollWidth));
      const cs = getComputedStyle(head);
      const avail = head.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const name = q('thread.head.name');
      const role = q('thread.head.role');
      const who = nat(name) + (role === null ? 0 : 8 + nat(role));
      const end = head.querySelector<HTMLElement>('.ah-end');
      const endFixed = end === null ? 0 : [...end.children].filter((c) => !(c as HTMLElement).dataset['testid']?.startsWith('thread.head.branch') && !c.classList.contains('ah-gone')).reduce((n, c, i) => n + Math.ceil((c as HTMLElement).offsetWidth) + (i > 0 ? 6 : 0), 0);
      const voice = q('thread.voice');
      const next = dropsFor({ avail, who, chip: nat(q('thread.head.state')), notes: voice === null ? [] : [nat(voice)], usage: nat(q('thread.usage')), branch: nat(q('thread.head.branch')), end: endFixed });
      setDrop((d) => (d === next ? d : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(head);
    return () => {
      ro.disconnect();
    };
  }, [ref, words]);
  return drop;
}

/** a name cuts with '…' down to its first 12 chars, never shorter while something else can go */
const NAME_KEEP = 12;

/** An archived maker's head (designer m_21714): what it drops so restore always fits, and the width
 *  its name keeps (its first 12 chars; 0 once restore is the icon: then the name cuts further). */
function useArchivedFit(ref: RefObject<HTMLDivElement | null>, on: boolean, words: string): { stage: 0 | 1 | 2; nameMin: number } {
  const [fit, setFit] = useState<{ stage: 0 | 1 | 2; nameMin: number }>({ stage: 0, nameMin: 0 });
  useLayoutEffect(() => {
    const head = ref.current;
    if (head === null || !on) return;
    const measure = () => {
      const one = (sel: string) => head.querySelector<HTMLElement>(sel);
      const cs = getComputedStyle(head);
      const gap = parseFloat(cs.columnGap) || 0;
      const avail = head.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const name = one('[data-testid="thread.head.name"]');
      const chars = name === null ? 0 : name.textContent.length;
      const nat = name === null ? 0 : Math.ceil(name.scrollWidth);
      // its first 12 chars and the '…' (an average char's width: the name's own font)
      const nameMin = chars > NAME_KEEP ? Math.ceil((nat / chars) * (NAME_KEEP + 1)) : nat;
      const role = one('[data-testid="thread.head.role"]');
      const usage = one('[data-testid="thread.usage"]:not(.ah-gone)');
      const who = nameMin + (role === null ? 0 : gap) + (usage === null ? 0 : gap + Math.ceil(usage.offsetWidth));
      const width = (sel: string) => Math.ceil(one(sel)?.offsetWidth ?? 0);
      const stage = archivedFit({ avail, gap, who, chip: width('.ah-archived'), restore: width('.ah-restore-full') });
      const next = { stage, nameMin: stage === 2 ? 0 : nameMin };
      setFit((f) => (f.stage === next.stage && f.nameMin === next.nameMin ? f : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(head);
    return () => {
      ro.disconnect();
    };
  }, [ref, on, words]);
  return fit;
}

/** '↺ restore', or its 28 px '↺' when the head is short (designer m_21714); both drawn, one out of the
 *  flow and still measured ('ah-gone'), so the head knows the whole one's width */
function Restore({ icon, onRestore }: { icon: boolean; onRestore: () => void }) {
  return (
    <>
      <span className={icon ? 'ah-restore-full ah-gone' : 'ah-restore-full'} aria-hidden={icon || undefined}>
        <Button size="sm" onClick={onRestore} testId={icon ? undefined : 'thread.head.restore'}>
          ↺ restore
        </Button>
      </span>
      <span className={icon ? 'ah-icon' : 'ah-icon ah-gone'} aria-hidden={!icon || undefined}>
        <Button size="sm" onClick={onRestore} testId={icon ? 'thread.head.restore' : undefined} title="restore">
          ↺
        </Button>
      </span>
    </>
  );
}

/** An agent's head (`starting`: its thread has nothing of its own yet). `more` is the '⋯' button (rename, model; the screen owns its panel); `note` a quiet word after the chip ('voice mode'); its context gauge after it. */
export function AgentHead({ project, a, more, note, starting = false, restore }: { project: string; a: Agent; more?: ReactNode; note?: string | undefined; starting?: boolean; restore?: () => void }) {
  const usage = usageLine(a.usage?.words);
  const now = useNow();
  const router = useRouter();
  const diff = useDiff(project, a.name);
  const branch = branchLine(a.branch, diff?.files.length);
  // S29/L19: he took the wheel: it waits for him until he gives it back (amb-win, designer m_16663)
  const held = useComputerLive().some((r) => r.project === project && r.agent === a.name && r.kind === 'paused');
  const review = () => {
    router.go({ screen: 'review', project, agent: a.name });
  };
  const headRef = useRef<HTMLDivElement>(null);
  const words = `${a.name}|${roleOf(a)}|${usage}|${branch}|${note ?? ''}`;
  const drop = useHeadFit(headRef, words);
  const arch = useArchivedFit(headRef, restore !== undefined, words);
  return (
    <div className="ah" data-testid="thread.head" ref={headRef} data-drop={drop} data-arch={restore === undefined ? undefined : arch.stage}>
      <span className="ah-who">
        <b className="ah-name" data-testid="thread.head.name" title={restore === undefined ? undefined : a.name} style={restore === undefined ? undefined : { minWidth: arch.nameMin }}>
          {a.name}
        </b>
        {roleOf(a) !== '' && (
          <span className="ah-role" data-testid="thread.head.role">
            {roleOf(a)}
          </span>
        )}
      </span>
      {/* an archived maker beside its artifact (designer m_20525): the same one-line head, 'archived'
          where its state sits, '↺ restore' in place of 'changes ⌘D'; short, the chip goes, then
          restore turns to its icon (designer m_21714) */}
      {restore !== undefined ? (
        <span className={arch.stage >= 1 ? 'ah-chip ah-archived ah-gone' : 'ah-chip ah-archived'} data-testid="thread.head.state" aria-hidden={arch.stage >= 1 || undefined}>
          archived
        </span>
      ) : (
        <Chip chip={starting && a.waits === 0 ? { text: 'starting', needs: false, live: true } : held ? HELD : stateChip(a, now)} testId="thread.head.state" />
      )}
      {note !== undefined && (
        <span className="ah-note" data-testid="thread.voice">
          {note}
        </span>
      )}
      {/* its model, effort and approvals mode ('opus · high · auto') are not in the head (designer N1):
          they are in its tune panel (⋯) and the TUI's divider */}
      {/* its context gauge, the hub's words as sent (the TUI's divider: '42k · 17%') */}
      {usage !== '' && (
        <span className={drop >= 1 ? 'ah-note ah-gone' : 'ah-note'} data-testid="thread.usage" aria-hidden={drop >= 1 || undefined}>
          {usage}
        </span>
      )}
      <span className="ah-end">
        {restore !== undefined && <Restore icon={arch.stage === 2} onRestore={restore} />}
        {restore === undefined && branch !== '' && (
          <Press look={drop >= 2 ? 'ah-quiet ah-gone' : 'ah-quiet'} onClick={review} data-testid="thread.head.branch" title="its changes" tabIndex={drop >= 2 ? -1 : undefined} aria-hidden={drop >= 2 || undefined}>
            {branch}
          </Press>
        )}
        {restore === undefined && (
          <Press look="ah-btn" onClick={review} data-testid="thread.head.changes">
            changes <kbd>⌘D</kbd>
          </Press>
        )}
        {restore === undefined && more}
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
      <Press
        look="ah-chip-btn"
        onClick={() => {
          router.go({ screen: 'agents', project });
        }}
        data-testid="thread.agents"
      >
        <Chip chip={biseChip(agents)} testId="thread.head.state" />
      </Press>
      <span className="ah-end">{more}</span>
    </div>
  );
}

/**
 * The working row at the thread's end (designer's desktop-working page): the TUI's gust, then
 * '<agent> is working · <the core's action text> · <turn age>'; no action yet, the name and the
 * age alone (never invented words). The action cuts with … first, the rest stays whole. It sits
 * under the list, so it stays in view when he reads up; a click brings the thread to its end.
 * role=status: the gust and the age are aria-hidden, so only a new action is announced.
 * An agent waiting on an event keeps event-wake's '… waiting for …' row, no gust.
 */
export function LiveLine({ a, name, onJump }: { a: Agent | undefined; name?: string; onJump?: () => void }) {
  const now = useNow();
  // event-wake (designer's page): the thread ends on what it waits for, dim, never the accent
  if (a !== undefined && !a.archived && waitsEvent(a)) {
    return (
      <div className="th-live th-waiting" data-testid="thread.waiting" aria-live="polite">
        … {waitingFor(a.watching, now)}
      </div>
    );
  }
  // waiting on him (a question, an approval): the row goes, the card docks over the composer
  if (a === undefined || !workingRowShows(a)) return null;
  // one turn age with the head chip and the right bar (designer m_20461 (1)): the turn's, else since its start
  const age = a.turn_ms != null ? turnAge(a.turn_ms) : a.since_ms > 0 ? turnAge(now - a.since_ms) : '';
  return (
    <div className="th-live th-working" role="status" data-testid="thread.live" onClick={onJump}>
      <Gust testId="thread.live.gust" />
      <span className="th-live-words">
        <b className="th-live-name">{name ?? a.name}</b> is working
        {a.title !== '' && (
          <>
            <span className="th-live-dot"> · </span>
            <span className="th-live-act" data-testid="thread.live.act">
              {a.title}
            </span>
          </>
        )}
      </span>
      {age !== '' && (
        <span className="th-live-age" aria-hidden="true" data-testid="thread.live.age">
          {' · '}
          {age}
        </span>
      )}
    </div>
  );
}

/** The empty thread (v6 (5), the working page): '· checkout is starting · its own folder, sb/checkout', the '·' pulsing. */
export function StartingLine({ a }: { a: Agent }) {
  const where = a.branch != null && a.branch !== '' ? `its own folder, ${a.branch}` : "the project's folder";
  return (
    <div className="th-live th-starting" role="status" data-testid="thread.starting">
      <Pulse kind="starting" />
      <span className="th-live-words">
        <b className="th-live-name">{a.name}</b> is starting
        <span className="th-live-dot"> · </span>
        <span className="th-live-act">{where}</span>
      </span>
    </div>
  );
}
