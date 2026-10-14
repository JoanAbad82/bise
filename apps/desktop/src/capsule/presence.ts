// bise's presence in the capsule (designer's bise-presence v10): the ':*' where the pearl stood,
// its state from the view and the store. Pure, for the checks; Capsule.tsx draws it (src/ds's
// BiseMark). Listening: the eyes follow his voice. Thinking: the star turns in steps. Answering:
// the star beats with each chunk of the answer. Something waits on him: the star in the accent,
// the two kisses on each new wait. The star is the team (1b): one branch per running agent (a
// waiting one's in the accent), none the plain star. Its tip says it in words (law 6).
import type { MarkArm } from '@/ds';
import { MAX_ARMS } from '@/shared/mark';
import type { SpotData } from '@/spotlight';
import type { View } from './machine';

export interface Presence {
  readonly listening: boolean;
  readonly working: boolean;
  readonly speaking: boolean;
  readonly waits: boolean;
  /** the newest wait: a new one gives the two kisses */
  readonly kiss: string;
  readonly arms: readonly MarkArm[] | undefined;
  readonly tip: string;
}

/** The agents at work or waiting on him, one branch each, the waiting ones first in the accent; none: the plain star. Pure. */
export function teamArms(d: SpotData): readonly MarkArm[] | undefined {
  const live = d.agents.filter((a) => a.archived !== true);
  const waiting = new Set(d.cards.map((c) => `${c.project}/${c.agent}`));
  const arms: MarkArm[] = live.flatMap((a) => (waiting.has(`${a.project}/${a.name}`) ? ['wait'] : a.status === 'working' ? ['run'] : []));
  return arms.length === 0 ? undefined : arms.slice(0, MAX_ARMS);
}

/** The capsule's ':*' for a view. Pure. */
export function presenceOf(v: View, d: SpotData, answering: boolean): Presence {
  const listening = v.kind === 'talk' && v.phase === 'listen';
  const working = v.kind === 'talk' && v.phase === 'think';
  const speaking = v.kind === 'answer' && answering;
  const waits = d.cards.length > 0;
  const running = d.agents.filter((a) => a.archived !== true && a.status === 'working').length;
  const tip = listening
    ? 'bise: listening'
    : waits
      ? d.cards.length === 1
        ? 'bise: 1 thing waits for you'
        : `bise: ${String(d.cards.length)} things wait for you`
      : running > 0
        ? `bise: working with ${String(running)} agent${running === 1 ? '' : 's'}`
        : 'bise: all quiet';
  return { listening, working, speaking, waits, kiss: d.cards[0]?.id ?? '', arms: teamArms(d), tip };
}

/** One beat per this many characters of the answer as it streams in. */
export const BEAT_CHARS = 24;
/** The answer's beat counter: a new value per chunk while it streams. Pure. */
export const beatOf = (text: string): number => Math.floor(text.length / BEAT_CHARS);
