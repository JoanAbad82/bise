// @vitest-environment happy-dom
// The tray menu's projects block (designer m_27872): which lines show, their tips, the built menu.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { SpotData, SpotProject } from '@/spotlight';
import { common } from '@/proto/words.gen';
import { panel } from '@/proto/words_panel.gen';
import { Capsule } from './Capsule';
import { MENU_PROJECTS, menuCounts, projectLines } from './projects';

afterEach(cleanup);

const P = (id: string, waits = 0, working = 0, more: Partial<SpotProject> = {}): SpotProject => ({ id, name: id, path: `/p/${id}`, branch: 'main', agents: 0, waits, working, ...more });

/** a normal day: bise + 4 projects */
const day: SpotData = {
  agents: [], cards: [],
  home: { waits: 1, working: 2 },
  projects: [P('harness', 1, 3), P('site', 0, 1), P('dotfiles'), P('notes', 0, 0, { missing: true, working: 2 })],
};

/** 9 projects, 2 live past the 6th */
const many: SpotData = {
  agents: [], cards: [], home: { waits: 0, working: 0 },
  projects: [P('a'), P('b', 0, 1), P('c'), P('d'), P('e'), P('f'), P('g', 2), P('h'), P('i', 0, 4)],
};

const menu = (spot: SpotData, onOpenWindow = vi.fn()) =>
  render(
    <Capsule
      view={{ kind: 'menu' }} spot={spot} answer={null} heard="" level={0}
      card={() => null} route={null} onRouteKeep={vi.fn()} onRouteTo={vi.fn()} onAsk={vi.fn()} onOpen={vi.fn()}
      onOpenWindow={onOpenWindow} onClose={vi.fn()} onQuit={null} onSize={vi.fn()}
    />,
  );

describe("the tray menu's projects (designer m_27872)", () => {
  it("bise's line first, then his projects in his order; the hub's counts; a gone folder is quiet", () => {
    const { lines, more } = projectLines(day);
    expect(lines.map((l) => [l.name, l.waits, l.working])).toEqual([['bise', 1, 2], ['harness', 1, 3], ['site', 0, 1], ['dotfiles', 0, 0], ['notes', 0, 2]]);
    expect(more).toBe(0);
    expect(lines.map((l) => l.route)).toEqual(['bise', 'project/harness', 'project/site', 'project/dotfiles', 'project/notes']);
    expect(lines[1]?.tip).toBe(['harness', common.waiting_for_you({ n: 1 }), common.agents_at_work({ n: 3 }), panel.tray_on_branch({ branch: 'main' })].join(' · '));
    expect(lines[3]?.tip).toBe(['dotfiles', common.all_quiet, panel.tray_on_branch({ branch: 'main' })].join(' · '));
    expect(lines[4]?.tip).toBe(['notes', common.all_quiet, panel.tray_on_branch({ branch: 'main' })].join(' · '));
    expect(lines[0]?.tip).toBe(['bise', common.waiting_for_you({ n: 1 }), common.agents_at_work({ n: 2 })].join(' · '));
  });

  it(`at most ${String(MENU_PROJECTS)} projects, never a live one hidden: quiet ones fill the rest, in his order`, () => {
    const { lines, more } = projectLines(many);
    expect(lines.map((l) => l.name)).toEqual(['bise', 'a', 'b', 'c', 'd', 'g', 'i']);
    expect(more).toBe(3);
    // more live than the cap: every live one, no quiet one
    const busy: SpotData = { agents: [], cards: [], projects: Array.from({ length: 8 }, (_, i) => P(`p${String(i)}`, 0, 1)) };
    expect(projectLines(busy)).toMatchObject({ more: 0 });
    expect(projectLines(busy).lines).toHaveLength(8);
    // no home known: no bise line
    expect(projectLines(busy).lines[0]?.name).toBe('p0');
  });

  it("the built menu: one row per line, the mark, the end '? n' then '∿ n' (none when quiet), the tip, a click opens it", () => {
    const onOpenWindow = vi.fn();
    const ui = menu(day, onOpenWindow);
    const block = ui.getByTestId('capsule.menu.projects');
    expect(block.textContent.startsWith(panel.projects)).toBe(true);
    expect(ui.getByTestId('capsule.menu.project.harness').textContent).toBe('?harness? 1∿ 3');
    expect(ui.getByTestId('capsule.menu.project.site').querySelector('.b-cap-pj-end')?.textContent).toBe('∿ 1');
    expect(ui.getByTestId('capsule.menu.project.dotfiles').querySelector('.b-cap-pj-end')).toBeNull();
    expect(ui.getByTestId('capsule.menu.project.notes').querySelector('.b-cap-pj-end')).toBeNull();
    expect(ui.getByTestId('capsule.menu.project.dotfiles.line').className).toBe('quiet');
    expect(ui.getByTestId('capsule.menu.project.harness.line').getAttribute('title')).toBe(projectLines(day).lines[1]?.tip);
    expect(ui.getByTestId('capsule.menu.project.bise').querySelector('.b-cap-pj-end')?.textContent).toBe('? 1∿ 2');
    expect(ui.queryByTestId('capsule.menu.projects.more')).toBeNull();
    // the head reads the same counts as the lines (designer m_27930): a gone folder's out
    expect(ui.getByTestId('capsule.menu.head').textContent).toBe('6 at work · 2 waiting for you');
    expect(menuCounts(day)).toEqual({ work: 6, waits: 2 });
    expect(menuCounts({ agents: [{ name: 'a', project: 'x', status: 'working', title: '' }], projects: [], cards: [] })).toEqual({ work: 1, waits: 0 });
    ui.getByTestId('capsule.menu.project.harness').click();
    ui.getByTestId('capsule.menu.project.bise').click();
    expect(onOpenWindow.mock.calls).toEqual([['project/harness'], ['bise']]);
  });

  it("the last row counts what's left out and opens bise; no project known, no block", () => {
    const onOpenWindow = vi.fn();
    const ui = menu(many, onOpenWindow);
    expect(ui.getByTestId('capsule.menu.projects.more').textContent).toBe(panel.tray_more({ n: 3 }));
    ui.getByTestId('capsule.menu.projects.more').click();
    expect(onOpenWindow).toHaveBeenCalledWith();
    ui.unmount();
    expect(menu({ agents: [], projects: [], cards: [] }).queryByTestId('capsule.menu.projects')).toBeNull();
  });
});
