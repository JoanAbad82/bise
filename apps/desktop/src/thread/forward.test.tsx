// @vitest-environment happy-dom
// A forwarded message in the receiver's thread (msg-forward, designer m_41546): its note, the '↪'
// line from the 'forwarded' part (the id in its tip), the original quoted with its chips, never the
// header the model reads or a tag; an older window (no 'forwarded' kind) draws the text.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CorePort } from '@/shared/api';
import type { Part } from '@/proto';
import { thread } from '@/proto/words.gen';
import { Store, StoreProvider, replay, threadKey } from '@/store';
import { AgentNote } from './rows-cards';
import type { RowCtx } from './rows';
import { clock } from './entry';
import { forwardLine, forwardOf, utcMs } from './forward';

const P = 'acme-1a2b3c4d';
const ctx: RowCtx = { tkey: threadKey(P, 't1'), project: P, agent: 't1', bise: false, onLink: () => undefined, onArtifact: () => undefined };
const FWD: Extract<Part, { kind: 'forwarded' }> = { kind: 'forwarded', id: 3, from: 'user', to: 'main', at: '2026-10-25 12:26 UTC', by: 'main' };
const PARTS: Part[] = [
  { kind: 'text', text: 'please look\n\n' },
  FWD,
  { kind: 'quote', from: 't1', text: 'the quoted line' },
  { kind: 'text', text: 'look at this ' },
  { kind: 'image', name: '[Image #1]', source: '/x/shot.png', mime: 'image/png', b64_file: '/x/1.b64' },
  { kind: 'text', text: ' and ' },
  { kind: 'file', path: '/x/notes.csv', name: '[File #1]' },
  { kind: 'paste', n: 1, text: 'pasted line 1\npasted line 2' },
];
// the header and tags the model reads (bise_proto::parts::render), never drawn
const TEXT =
  'please look\n\n[forwarded m_3 · from the user to main · 2026-10-25 12:26 UTC · forwarded by main · its place: sb show m_3]\n<selection from="t1">\nthe quoted line\n</selection>\nlook at this <image name="[Image #1]" path="/x/shot.png" mime="image/png" b64="/x/1.b64"> and <file name="[File #1]" path="/x/notes.csv"><pasted n="1" lines="2">\npasted line 1\npasted line 2\n</pasted>';

function note(parts: Part[] | undefined) {
  const port: CorePort = { send: () => undefined, onEvent: () => () => undefined, onState: () => () => undefined, state: () => Promise.resolve('up') };
  const store = new Store(port);
  replay(store);
  return render(
    <StoreProvider store={store}>
      <AgentNote pos={8} from="main" to="t1" text={TEXT} {...(parts === undefined ? {} : { parts })} ctx={ctx} testId="thread.from.8" />
    </StoreProvider>,
  );
}

afterEach(cleanup);

describe('a forwarded message', () => {
  it('draws its note, its line and the original quoted with its chips', () => {
    const v = note(PARTS);
    const line = v.getByTestId('thread.from.8.fwd.line');
    expect(line.textContent).toBe(thread.forwarded_from({ from: thread.forwarded_you, to: 'main', at: clock(utcMs('2026-10-25 12:26 UTC') ?? 0) }));
    expect(line.getAttribute('title')).toBe(thread.forwarded_tip({ by: 'main', to: 't1', id: 'm_3' }));
    expect(v.getByTestId('thread.from.8.text').textContent).toContain('please look');
    const orig = v.getByTestId('thread.from.8.fwd.original');
    expect(orig.textContent).toContain('❝ the quoted line');
    // each chip keeps its place in the words, one space apart (designer m_41661)
    expect(v.getByTestId('thread.from.8.fwd.words').textContent).toContain(`look at this ▣ ${thread.image_n({ n: 1 })} and ▯ notes.csv ▤ 1`);
    expect(v.getByTestId('thread.fwd.8.image.1')).toBeTruthy();
    expect(v.getByTestId('thread.fwd.8.paste.1')).toBeTruthy();
    const all = v.container.textContent;
    for (const raw of ['[forwarded m_3', 'sb show', '<selection', '<pasted', '<image', '<file']) expect(all).not.toContain(raw);
  });

  it('opens whole from its chip', () => {
    const v = note([FWD, { kind: 'text', text: 'one\ntwo\nthree\nfour' }]);
    expect(v.getByTestId('thread.from.8.fwd.words').textContent).not.toContain('four');
    fireEvent.click(v.getByTestId('thread.from.8.chip'));
    expect(v.getByTestId('thread.from.8.fwd.words').textContent).toContain('four');
  });

  it('is plain text in a window that does not know the kind', () => {
    const v = note(undefined);
    expect(v.queryByTestId('thread.from.8.fwd')).toBeNull();
  });

  it('says no time it cannot read, and only a forwarded part makes one', () => {
    expect(forwardLine({ ...FWD, at: '' }, () => 'never')).toBe(thread.forwarded_from_untimed({ from: thread.forwarded_you, to: 'main' }));
    expect(forwardOf(PARTS.filter((p) => p.kind !== 'forwarded'))).toBeNull();
    expect(utcMs('2026-10-25 12:26 UTC')).toBe(Date.UTC(2026, 9, 25, 12, 26));
  });
});
