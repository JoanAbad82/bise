// What a thread row shows of an entry (the hub folds the transcript; this
// only picks words and the ds part). Owner: amb-win. Pure.
import type { Entry } from '@/proto';

/** A row's key in the thread list: an entry by its pos, a send not confirmed by its cid. */
export const entryKey = (pos: number) => `e:${pos}`;
export const pendingKey = (cid: string) => `p:${cid}`;

/** The pos of an entry key, else undefined. */
export function posOfKey(key: string): number | undefined {
  if (!key.startsWith('e:')) return undefined;
  const n = Number(key.slice(2));
  return Number.isSafeInteger(n) ? n : undefined;
}

/** "14:05" in his time zone. */
export function clock(ms: number, tz?: string): string {
  if (ms <= 0) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(ms);
}

/**
 * A turn's time on hover (M14, the TUI's BISE-271): '14:05' today, '12 Oct 14:05' an
 * older day, '' without a time. Pure (`now` and `tz` given).
 */
export function whenOf(ms: number, now: number, tz?: string): string {
  if (ms <= 0) return '';
  const day = (t: number) => new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(t);
  if (day(ms) === day(now)) return clock(ms, tz);
  const d = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: tz }).format(ms);
  return `${d} ${clock(ms, tz)}`;
}

/** Who speaks in a message row: his words, the shown agent's (bise's pearl on bise's main), another agent's. */
export function whoOf(e: Entry, ctx: { agent: string; bise: boolean }): { from: 'you' | 'bise' | 'agent'; name: string; indent: boolean } {
  switch (e.kind) {
    case 'you':
      return { from: 'you', name: 'you', indent: false };
    case 'from_agent':
      // batch 3a: a message between two other agents says to whom ('perf → docs')
      return { from: 'agent', name: e.to != null && e.to !== '' && e.to !== ctx.agent ? `${e.from ?? 'an agent'} → ${e.to}` : (e.from ?? 'an agent'), indent: true };
    default:
      return ctx.bise && ctx.agent === 'main' ? { from: 'bise', name: 'bise', indent: false } : { from: 'agent', name: ctx.agent, indent: false };
  }
}

/** The text ⌘F searches in an entry: its words, plus a tools entry's steps and a card's options. */
export function findText(e: Entry): string {
  const parts = [e.text];
  if (e.tools) for (const t of e.tools.items) parts.push(t.text);
  if (e.card) {
    parts.push(e.card.question);
    for (const o of e.card.options) parts.push(o.label);
  }
  if (e.page) parts.push(e.page.title);
  return parts.join('\n');
}
