// The Overview's agent marks (r2-launcher #8, r2-img7): the pre-native-mac row glyph as a ds line
// mark, never the glowing ball: at work the turning arc, asking '?' in the accent, failed the
// alert, done the check, idle or stopped nothing.
import { describe, expect, it } from 'vitest';
import { agentMark } from './RightBar';

describe("Overview's agent marks", () => {
  it('maps the row glyph and its work to a line mark', () => {
    expect(agentMark('?', true)).toBe('works');
    expect(agentMark('?', false)).toBe('asks');
    expect(agentMark('✗', false)).toBe('failed');
    expect(agentMark('✓', false)).toBe('done');
    expect(agentMark('·', false)).toBe('none');
    expect(agentMark('', false)).toBe('none');
  });
});
