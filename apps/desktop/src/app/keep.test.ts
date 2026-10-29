// The keep's laws (ambient-lead m_11756, m_11763): his text until sent or emptied, the view with
// no age, the short bits 10 minutes, unreadable words read as empty.
import { describe, expect, it } from 'vitest';
import { createKeep, KEEP_KEY, parseKeep, WRITE_MS, type KeepStore } from './keep';
import { cardDraftKey, pruneCardDrafts } from '@/inbox/drafts';

function mem(): KeepStore & { data: Map<string, string>; writes: number } {
  const data = new Map<string, string>();
  const m = {
    data,
    writes: 0,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.writes += 1;
      data.set(k, v);
    },
  };
  return m;
}

/** A hand clock and a hand timer: run() fires what is due. */
function clock() {
  let t = 1_000_000;
  let due: { at: number; f: () => void } | null = null;
  return {
    now: () => t,
    later: (f: () => void, ms: number) => {
      due = { at: t + ms, f };
      return () => {
        due = null;
      };
    },
    tick(ms: number) {
      t += ms;
      if (due !== null && due.at <= t) {
        const { f } = due;
        due = null;
        f();
      }
    },
  };
}

describe('the keep', () => {
  it('keeps his text per field, writes 300 ms after his last change (never per key), and a new keep reads it back', () => {
    const s = mem();
    const c = clock();
    const k = createKeep(s, c.now, c.later);
    k.setText('find:acme/perf', 'p');
    c.tick(100);
    k.setText('find:acme/perf', 'p9');
    c.tick(100);
    k.setText('find:acme/perf', 'p99');
    expect(s.writes).toBe(0);
    c.tick(WRITE_MS);
    expect(s.writes).toBe(1);
    expect(createKeep(s, c.now, c.later).text('find:acme/perf')).toBe('p99');
  });

  it('drops a field when it is emptied (later) or sent / cancelled (at once)', () => {
    const s = mem();
    const c = clock();
    const k = createKeep(s, c.now, c.later);
    k.setText('a', 'one');
    k.setText('b', 'two');
    c.tick(WRITE_MS);
    k.dropText('a');
    expect(createKeep(s, c.now, c.later).text('a')).toBe('');
    k.setText('b', '');
    c.tick(WRITE_MS);
    expect(createKeep(s, c.now, c.later).text('b')).toBe('');
    expect(JSON.parse(s.data.get(KEEP_KEY) ?? '{}')).toEqual({ v: 1, fields: {}, view: {} });
  });

  it('prunes the fields of cards that are no longer open', () => {
    const s = mem();
    const c = clock();
    const k = createKeep(s, c.now, c.later);
    k.setText('card:shop/1', 'yes');
    k.setText('card:shop/2', 'no');
    k.setText('card:acme/1', 'later');
    k.pruneTexts('card:shop/', (id) => id === 'card:shop/2');
    expect([k.text('card:shop/1'), k.text('card:shop/2'), k.text('card:acme/1')]).toEqual(['', 'no', 'later']);
  });

  it('the route, panels and folds have no age; a scroll, a focus or a mode lives 10 minutes', () => {
    const s = mem();
    const c = clock();
    const k = createKeep(s, c.now, c.later);
    k.setView('route', { screen: 'thread', project: 'acme', agent: 'perf' });
    k.setView('scroll:acme/perf', 42, true);
    k.flush();
    c.tick(10 * 60_000 - 1);
    const again = createKeep(s, c.now, c.later);
    expect(again.view('scroll:acme/perf')).toBe(42);
    c.tick(2);
    expect(again.view('scroll:acme/perf')).toBeUndefined();
    c.tick(24 * 3600_000);
    const tomorrow = createKeep(s, c.now, c.later);
    expect(tomorrow.view('route')).toEqual({ screen: 'thread', project: 'acme', agent: 'perf' });
    expect(tomorrow.view('scroll:acme/perf')).toBeUndefined();
    tomorrow.setView('route', undefined);
    expect(tomorrow.view('route')).toBeUndefined();
  });

  it("a card's half answer lives in the keep: back after a reload, gone with its card; an empty prune (the store refilling) drops nothing", () => {
    const s = mem();
    const c = clock();
    const at = (k: string) => `ls:bise.composer.v1.${k}`;
    const shop1 = at(cardDraftKey({ project: 'shop', card: 1 }));
    const acme2 = at(cardDraftKey({ project: 'acme', card: 2 }));
    const d = createKeep(s, c.now, c.later);
    d.setText(shop1, 'only at checkout');
    d.setText(acme2, 'v2');
    d.setText(`${acme2}.unread`, '["{}"]');
    d.setText(at('acme/main'), "the thread's own");
    c.tick(WRITE_MS);
    const again = createKeep(s, c.now, c.later);
    expect(again.text(shop1)).toBe('only at checkout');
    pruneCardDrafts(again, new Set());
    expect(again.text(acme2)).toBe('v2');
    // a list with only shop's cards (acme's hub not back yet after the reload) keeps acme's draft
    pruneCardDrafts(again, new Set(['shop-1']));
    expect(again.text(acme2)).toBe('v2');
    // acme's cards are in, and its card 2 is not: its draft goes; what is set aside and the thread's stay
    pruneCardDrafts(again, new Set(['shop-1', 'acme-3']));
    expect(again.text(acme2)).toBe('');
    expect(again.text(`${acme2}.unread`)).toBe('["{}"]');
    expect(again.text(at('acme/main'))).toBe("the thread's own");
    expect(again.text(shop1)).toBe('only at checkout');
    c.tick(WRITE_MS);
    expect(createKeep(s, c.now, c.later).text(acme2)).toBe('');
  });

  it('anything unreadable reads as empty, never throws; a broken store keeps the text in memory', () => {
    expect(parseKeep('{nope', 0)).toEqual({ v: 1, fields: {}, view: {} });
    expect(parseKeep(JSON.stringify({ v: 2, fields: { a: { text: 'x' } } }), 0).fields).toEqual({});
    expect(parseKeep(JSON.stringify({ v: 1, fields: { a: { text: 3 }, b: { text: '' }, c: { text: 'ok', at: 5 } } }), 0).fields).toEqual({ c: { text: 'ok', at: 5 } });
    const broken: KeepStore = {
      getItem: () => {
        throw new Error('gone');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    const k = createKeep(broken);
    k.setText('a', 'still here');
    k.flush();
    expect(k.text('a')).toBe('still here');
  });
});
