// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { formatRoute, parseRoute } from '@/app/route';
import { ahead, endsWords, nextRunWords, ordinal, runsWords, ScheduledView, type ScheduledTask, type Task } from './index';

afterEach(cleanup);

const NOW = new Date(2026, 9, 3, 14, 0).getTime();
const at = (days: number, h: number, m: number) => new Date(2026, 9, 3 + days, h, m).getTime();
const task = (id: number, extra: Partial<ScheduledTask> = {}): ScheduledTask => ({
  id, agent: 'deploy-watch', by: 'main', words: 'check the deploy of storefront\nsay so only when it fails', every: '5m', done: 6, times: 24, next_ms: at(0, 14, 22), ...extra,
});
const T = (t: ScheduledTask, project = 'shop-1', projectName = 'storefront'): Task => ({ project, projectName, t });

describe('scheduled words', () => {
  it("says times, runs and ends as the TUI's screen", () => {
    expect([1, 2, 3, 4, 11, 22].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '22nd']);
    expect(ahead(at(0, 14, 22), NOW)).toBe('14:22');
    expect(ahead(at(1, 7, 30), NOW)).toBe('tomorrow 07:30');
    expect(ahead(at(6, 7, 30), NOW)).toBe('the 9th, 07:30');
    expect(runsWords(task(4))).toBe('6 of 24');
    expect(runsWords(task(4, { times: null, done: 1 }))).toBe('1 run so far');
    expect(nextRunWords(task(4), NOW)).toBe('the 7th of 24 · 14:22');
    expect(endsWords(task(4), NOW)).toBe('after its 24th run');
    expect(endsWords(task(4, { times: null, until_ms: at(0, 18, 0) }), NOW)).toBe('at 18:00');
    expect(endsWords(task(4, { times: null }), NOW)).toBe("when it's stopped");
  });

  it("the route is 'scheduled'", () => {
    expect(parseRoute('scheduled')).toEqual({ screen: 'scheduled' });
    expect(formatRoute({ screen: 'scheduled' })).toBe('scheduled');
  });
});

describe('the scheduled screen', () => {
  it('lists the tasks soonest first; ⏎ opens one in the pane; x asks in place, then stops it', () => {
    const stopped: string[] = [];
    const tasks = [T(task(9, { words: 'the morning digest', agent: 'main', every: 'day 07:30', next_ms: at(1, 7, 30), times: null, done: 2 }), 'home', 'bise'), T(task(4))];
    render(<ScheduledView tasks={tasks} ports={{ stop: (p, id) => stopped.push(`${p}#${String(id)}`) }} now={NOW} />);
    const rows = screen.getByTestId('scheduled.list').querySelectorAll('[role=option]');
    expect([...rows].map((r) => r.getAttribute('data-testid'))).toEqual(['scheduled.row.4', 'scheduled.row.9']);
    expect(rows[0]?.textContent).toContain('deploy-watch · storefront');
    expect(rows[0]?.textContent).toContain('every 5m · 6 of 24');
    expect(screen.getByTestId('scheduled.count').textContent).toBe('active · 2');
    const root = screen.getByTestId('scheduled.screen');
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(screen.getByTestId('scheduled.pane').textContent).toContain('scheduled task #4 · deploy-watch');
    expect(screen.getByTestId('scheduled.pane').textContent).toContain('the 7th of 24 · 14:22');
    expect(screen.getByTestId('scheduled.pane.words').textContent).toContain('say so only when it fails');
    expect(screen.queryByTestId('scheduled.run')).toBeNull();
    fireEvent.keyDown(root, { key: 'x' });
    expect(screen.getByTestId('scheduled.ask').textContent).toContain("stop this scheduled task? it won't wake deploy-watch again.");
    fireEvent.keyDown(root, { key: 'Escape' });
    expect(stopped).toEqual([]);
    fireEvent.click(screen.getByTestId('scheduled.stop'));
    fireEvent.click(screen.getByTestId('scheduled.ask.stop'));
    expect(stopped).toEqual(['shop-1#4']);
  });

  it('nothing scheduled says how one comes', () => {
    render(<ScheduledView tasks={[]} ports={{ stop: () => undefined }} now={NOW} />);
    expect(screen.getByTestId('scheduled.empty').textContent).toBe('nothing scheduled. agents set them with sb every; tell one “check the build every 5m”.');
  });
});
