// Bar S40/W3, tui-parity R10: the head says the agent's model, effort and approvals mode.
import { describe, expect, it } from 'vitest';
import type { Model } from '@/proto';
import { metaWords } from './meta';

const opus = { id: 'anthropic/claude-opus-4', label: 'Claude Opus 4', provider: 'anthropic', short: 'opus', context: 200000 } as Model;

describe("the head's run settings", () => {
  it("'opus · high · auto' from the catalog's short words, its effort and the approvals mode", () => {
    expect(metaWords([opus], 'anthropic/claude-opus-4', 'high', 'auto')).toBe('opus · high · auto');
  });
  it("a model the catalog doesn't know shows its id's last part; unknown parts are left out", () => {
    expect(metaWords([], 'mistral/mistral-small-latest', null, 'unknown')).toBe('mistral-small-latest');
    expect(metaWords([opus], null, null, 'yolo')).toBe('yolo');
    expect(metaWords([], undefined, undefined, undefined)).toBe('');
  });
});
