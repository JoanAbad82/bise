import { describe, expect, it } from 'vitest';
import type { Model } from '@/proto';
import { modeWords, modelWords } from './tools';

describe("the composer box's row words (designer's composer-strip A)", () => {
  it("the mode: 'yolo', or 'approvals' for the hub's auto", () => {
    expect(modeWords('yolo')).toBe('yolo');
    expect(modeWords('auto')).toBe('approvals');
    expect(modeWords(undefined)).toBe('yolo');
  });
  it("the model as the catalog names it, else its id's last part; its effort", () => {
    const models = [{ id: 'anthropic/claude-opus-5-5', label: 'opus 5.5', provider: 'anthropic' }] as unknown as Model[];
    expect(modelWords(models, 'anthropic/claude-opus-5-5', 'high')).toEqual({ model: 'opus 5.5', effort: 'high' });
    expect(modelWords(models, 'openai/gpt-6', null)).toEqual({ model: 'gpt-6', effort: '' });
    expect(modelWords(models, null, 'high')).toEqual({ model: '', effort: 'high' });
  });
});
