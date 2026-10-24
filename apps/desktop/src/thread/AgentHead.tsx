// The agent view's head (designer's desktop-screens v6 (1) and (3), desktop-delight v2): one row,
// 16 px sides. An agent: its role line (its name is the titlebar's crumb), its state chip (none at
// rest); at the right '± 3 files' when it changed some (opens the review, ⌘D), '⋯'. Its context
// and its branch are the composer's tab's (designer m_24325). A project's bise: its ':*', 'bise ·
// storefront', the project's chip. LiveLine: what it does now, at the thread's end.
// StartingLine: the empty thread's line. The words are head.ts's. Owner: amb-home.
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { Agent } from '@/proto';
import { thread } from '@/proto/words.gen';
import { useAgents, useComputerLive, useDiff } from '@/store';
import { useNowFor } from '@/app/clock';
import { pauseInSeconds } from './wake';
import { Breath, Pulse } from '@/working/Signs';
import { useRouter } from '@/app/router';
import { LiveBiseMark } from '@/app/Marks';
import { archivedFit, biseChip, roleOf, stateChip, type StateChip } from './head';
import { Button, Press } from '@/ds';

/** an agent whose wheel he took waits for him, like any agent that asks him */
const HELD: StateChip = { text: thread.chip_waits, needs: true, live: false };

function Chip({ chip, testId }: { chip: StateChip; testId: string }) {
  if (chip.text === '') return null;
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
      const who = nameMin + (role === null ? 0 : gap);
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
          ↺ {thread.restore}
        </Button>
      </span>
      <span className={icon ? 'ah-icon' : 'ah-icon ah-gone'} aria-hidden={!icon || undefined}>
        <Button size="sm" onClick={onRestore} testId={icon ? 'thread.head.restore' : undefined} title={thread.restore}>
          ↺
        </Button>
      </span>
    </>
  );
}

/** An agent's head (`starting`: its thread has nothing of its own yet). `more` is the '⋯' button (rename, model; the screen owns its panel); `note` a quiet word after the chip ('voice mode'); `named`: the crumb doesn't name it (beside its artifact), so the head does. */
export function AgentHead({ project, a, more, note, starting = false, restore, named = false }: { project: string; a: Agent; more?: ReactNode; note?: string | undefined; starting?: boolean; restore?: () => void; named?: boolean }) {
  // its chip's pause under a minute reads in seconds: the second clock
  const now = useNowFor((t) => pauseInSeconds(a, t));
  const router = useRouter();
  const diff = useDiff(project, a.name);
  // its changes, only when there are some, and how many (desktop-delight v2): '± 3 files'
  const files = diff?.files.length ?? 0;
  // S29/L19: he took the wheel: it waits for him until he gives it back (amb-win, designer m_16663)
  const held = useComputerLive().some((r) => r.project === project && r.agent === a.name && r.kind === 'paused');
  const review = () => {
    router.go({ screen: 'review', project, agent: a.name });
  };
  const headRef = useRef<HTMLDivElement>(null);
  const words = `${a.name}|${roleOf(a)}|${note ?? ''}`;
  const arch = useArchivedFit(headRef, restore !== undefined, words);
  return (
    <div className="ah" data-testid="thread.head" ref={headRef} data-arch={restore === undefined ? undefined : arch.stage}>
      <span className="ah-who">
        {/* its name is the crumb's (desktop-delight v2): the head keeps its role; the head names it
            wherever the crumb doesn't: a maker beside its artifact, live or archived, at 1400 and in
            the 800 slide-over (crumb 'storefront › artifacts'; designer m_27230) */}
        {(restore !== undefined || named) && (
          // only an archived maker's name cuts (to its first 12 chars, useArchivedFit); a live one
          // keeps its whole width and the role cuts with '…' after it: a min-width of 0 here let it
          // shrink under its own text, drawn over the role (Gabriel, art-gallery's head)
          // its tip says the role too: on a short row the role goes whole (designer m_39925)
          <b className="ah-name" data-testid="thread.head.name" title={roleOf(a) === '' ? a.name : `${a.name} · ${roleOf(a)}`} style={restore === undefined ? undefined : { minWidth: arch.nameMin }}>
            {a.name}
          </b>
        )}
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
          {thread.chip_archived}
        </span>
      ) : (
        <Chip chip={starting && a.waits === 0 ? { text: thread.chip_starting, needs: false, live: true } : held ? HELD : stateChip(a, now)} testId="thread.head.state" />
      )}
      {note !== undefined && (
        <span className="ah-note" data-testid="thread.voice">
          {note}
        </span>
      )}
      {/* its model, effort, context and place are not in the head (designer N1, composer-strip A
          m_24325: one place per fact): the composer's tab and its row say them */}
      <span className="ah-end">
        {restore !== undefined && <Restore icon={arch.stage === 2} onRestore={restore} />}
        {restore === undefined && files > 0 && (
          <Press look="ah-btn" onClick={review} data-testid="thread.head.changes" data-tip={`${String(files)} ${files === 1 ? 'file' : 'files'} changed: its review · ⌘D`}>
            ± {String(files)} {files === 1 ? 'file' : 'files'}
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
        {/* bise's ':*': text-3 at rest, the accent while something waits on him (desktop-delight v2) */}
        <LiveBiseMark testId="thread.head.mark" />
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

/** The empty thread (v6 (5), the working page): '· checkout is starting · its own folder, sb/checkout', the '·' pulsing. */
export function StartingLine({ a }: { a: Agent }) {
  const where = a.branch != null && a.branch !== '' ? thread.own_folder({ branch: a.branch }) : thread.project_folder;
  return (
    <div className="th-live th-starting" role="status" data-testid="thread.starting">
      <Pulse kind="starting" />
      <span className="th-live-words">
        <b className="th-live-name">{a.name}</b> {thread.is_starting}
        <span className="th-live-dot"> · </span>
        <span className="th-live-act">{where}</span>
      </span>
    </div>
  );
}
