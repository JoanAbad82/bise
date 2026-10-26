// The bar title's rename (the '…' menu's Rename, Rename.tsx): what his words send.
import { describe, expect, it } from 'vitest';
import type { Agent } from '@/proto';
import { renameTo } from './Rename';

const ag = (name: string): Agent => ({ name, dir: name, main: name === 'main', status: 'idle', archived: false, title: '', purpose: '', since_ms: 1, waits: 0, watching: [] });
const agents = [ag('main'), ag('perf'), ag('docs')];

describe("the title's rename", () => {
  it('sends a new good name, trimmed', () => {
    expect(renameTo('  perf-2 ', 'perf', agents)).toBe('perf-2');
  });
  it("sends nothing for esc, an empty field, the same name, a taken one, 'main' or a bad one", () => {
    expect(renameTo(null, 'perf', agents)).toBeNull();
    expect(renameTo('  ', 'perf', agents)).toBeNull();
    expect(renameTo('perf', 'perf', agents)).toBeNull();
    expect(renameTo('docs', 'perf', agents)).toBeNull();
    expect(renameTo('main', 'perf', agents)).toBeNull();
    expect(renameTo('perf two', 'perf', agents)).toBeNull();
  });
});
