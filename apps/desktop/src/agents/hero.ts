// The agents screens' hero facts (designer's page-hero, m_39021): the live list's '4 working · 1
// waits for you' (the waiting part his: the accent) and the archived list's '23 archived · the
// newest 2 h ago'. Pure.
import type { Agent } from '@/proto';
import { hero } from '@/proto/words_hero.gen';
import { age } from '@/inbox/InboxCard';

export function liveFacts(live: readonly Pick<Agent, 'status' | 'waits'>[]): { rest: string; wait?: string } {
  const rest = hero.working({ n: live.filter((a) => a.status === 'working').length });
  const waits = live.filter((a) => a.waits > 0).length;
  return waits === 0 ? { rest } : { rest, wait: hero.wait_for_you({ n: waits }) };
}

export function archivedFacts(archived: readonly Pick<Agent, 'since_ms'>[], now: number): string {
  const n = hero.archived({ n: archived.length });
  if (archived.length === 0) return n;
  return `${n} · ${hero.newest({ age: age(now - Math.max(...archived.map((a) => a.since_ms))) })}`;
}
