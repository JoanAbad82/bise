import { describe, expect, it } from 'vitest';
import type { SwitchRow } from '@/proto';
import { hub_ev } from '@/proto/fixtures.gen';
import { Store } from '@/store';
import { FOLD_MS, SHOW_DONE_MS, reloadView } from './ReloadLine';

const AT = 1_791_824_938_149;
const row = (phase: SwitchRow['phase'], extra: Partial<SwitchRow> = {}): SwitchRow => ({ phase, to: 'f7178b72', from: '2065c746', at_ms: AT, ...extra });

describe('reloadView: the switch row as the status line, in Rust switch_line words', () => {
  it('says nothing with no switch or an unknown phase', () => {
    expect(reloadView(null, AT)).toBeNull();
    expect(reloadView(row('unknown'), AT)).toBeNull();
  });
  it("'reloading' runs, however old", () => {
    expect(reloadView(row('reloading'), AT + 60_000)).toEqual({ text: 'reloading bise on f7178b72', tone: 'running', fold: false });
  });
  it("'up' and 'passed' show 3 s from at_ms, fold, then go", () => {
    for (const p of ['up', 'passed'] as const) {
      expect(reloadView(row(p), AT + 100)).toEqual({ text: '✓ reloaded on f7178b72', tone: 'done', fold: false });
      expect(reloadView(row(p), AT + SHOW_DONE_MS)?.fold).toBe(true);
      expect(reloadView(row(p), AT + SHOW_DONE_MS + FOLD_MS)).toBeNull();
    }
  });
  it('a stale done row at hello (an old at_ms) never shows as new', () => {
    expect(reloadView(row('up'), AT + 10 * 60_000)).toBeNull();
  });
  it("'rolled_back' stays, with the hub's why", () => {
    expect(reloadView(row('rolled_back', { reason: 'the hub died during its probation' }), AT + 3_600_000)).toEqual({
      text: "▲ couldn't reload: the hub died during its probation",
      tone: 'failed',
      fold: false,
    });
    expect(reloadView(row('rolled_back'), AT)?.text).toBe("▲ couldn't reload: the new version failed");
  });
});

describe('the store keeps the hub switch row per project', () => {
  it('applies the fixtures and the last one wins; an empty one clears it', () => {
    const s = new Store(null, { now: () => AT });
    const sw = hub_ev.filter((e) => e.ev === 'switch');
    expect(sw.length).toBeGreaterThan(0);
    for (const e of sw) s.apply(e);
    const last = sw[sw.length - 1];
    expect(s.switchRow(last?.project ?? '')).toEqual(last?.switch);
    s.apply({ ev: 'switch', project: last?.project ?? '' });
    expect(s.switchRow(last?.project ?? '')).toBeNull();
  });
});
