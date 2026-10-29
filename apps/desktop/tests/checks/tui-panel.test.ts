import { describe, expect, it } from 'vitest';
import { tuiAgents } from './tui-panel';

// A panel as the TUI draws it in a tmux capture: the feed, then '│' and the panel, then '│'.
const screen = (panel: string[]): string => {
  const w = 31;
  const top = `╭─ bise ${'─'.repeat(40)}┬${'─'.repeat(w)}╮`;
  return [top, ...panel.map((p) => `│${' '.repeat(47)}│  ${p.padEnd(w - 2)}│`)].join('\n');
};

describe('tuiAgents', () => {
  it("reads past the '∿ N running' line under an agent (agents/new on 090684cfb read only main)", () => {
    const s = screen(['', 'agents', '', '0 ○ main :*            0%', '     ∿ 1 running · :5173', '1 ○ qa1 •          0%  ψ', '', 'inbox', '1 ? main  which window…']);
    expect(tuiAgents(s).map((a) => a.name)).toEqual(['main', 'qa1']);
  });
});
