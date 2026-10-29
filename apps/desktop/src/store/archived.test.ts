import { describe, expect, it } from 'vitest';
import type { Agent, ArchivedAgent } from '@/proto';
import { mergeArchived } from './archived';
import FX from '../../../../rust/proto/fixtures/archived_merge.json';

type Step = { what: string; ev: { agents: Agent[]; archived?: ArchivedAgent[] }; rows: unknown[] };

// agents-light (architect m_37220): the Rust merge (rows::Archived, tests/archived_merge.rs)
// reads the same fixture: one rule in both clients.
describe('the archived light list', () => {
  it('merges as the fixture says, step by step', () => {
    let kept: readonly ArchivedAgent[] = [];
    for (const step of FX.steps as unknown as Step[]) {
      const m = mergeArchived(step.ev.agents, step.ev.archived, kept);
      kept = m.kept;
      expect(m.rows, step.what).toEqual(step.rows);
    }
  });
});
