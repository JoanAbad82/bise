// His words that open with `@<agent>` (at-start, his ask): the hub's router reads a leading
// `@name text` as a message to that agent (router::parse, after spaces), never one in the thread he
// typed in. So the window reads it the same way: while his words open with a live agent's name
// and a space, the composer goes pink '↳ to <agent>', and the send goes to that agent's thread
// (its row there, his words without the `@name`), which the window opens. An `@name` anywhere
// else is plain words to the thread he is in. Pure. Owner: amb-win.
import type { Part } from '@/proto';
import type { Outgoing } from '@/composer/message';

/** The leading `@name` and the space after it, once spaces before it are skipped. */
const LEAD = /^\s*@(\S+)\s/u;

/**
 * The live agent his words open with: `@name` (after spaces) then a space or a line, `name` one of
 * `live` and not `here` (the agent he already writes to); null for anything else. Pure.
 */
export function leadAgent(text: string, live: readonly string[], here: string): string | null {
  const m = LEAD.exec(text);
  const name = m?.[1];
  if (name === undefined || name === here || !live.includes(name)) return null;
  return name;
}

/** His words without their leading `@name` and the spaces after it (none: as they are). Pure. */
export function dropLead(text: string, name: string): string {
  const m = LEAD.exec(text);
  if (m?.[1] !== name) return text;
  return text.slice(m[0].length).replace(/^\s+/u, '');
}

/**
 * His message for `name`'s thread: its words and its first text part without the leading
 * `@name`, the rest as typed. Null when its words are only the address (nothing to send). Pure.
 */
export function leadMessage(out: Outgoing, name: string): Outgoing | null {
  const text = dropLead(out.text, name);
  if (out.parts === undefined) return text.trim() === '' ? null : { text };
  const [first, ...rest] = out.parts;
  const words = first?.kind === 'text' ? dropLead(first.text, name) : null;
  const parts: Part[] = words === null ? [...out.parts] : [...(words === '' ? [] : [{ kind: 'text' as const, text: words }]), ...rest];
  if (parts.length === 0) return null;
  return { text, parts };
}
