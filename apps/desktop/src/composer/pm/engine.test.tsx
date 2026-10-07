// @vitest-environment happy-dom
// The TipTap engine against the Lexical one (architect m_11500):
//   (1) the wire: the same content gives byte-identical text and files on both paths (Lexical's
//       $readSegments vs pmtext's segmentsOf, then message.ts's buildMessage). GOLDEN holds the
//       expected sends: it stays as the fixture when Lexical goes (slice 4);
//   (2) old drafts: a real Lexical editor-state JSON (draft, history, queue; every chip kind)
//       reads back as the same segments; one that doesn't read keeps its raw JSON aside;
//   (3) a draft saved and a send made while dictation is live hold none of its words.
import { act, cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getRoot, createEditor } from 'lexical';
import { getSchema } from '@tiptap/core';
import type { Node as PmNode } from '@tiptap/pm/model';
import { $createChipNode, ChipNode as LexicalChip } from '../ChipNode';
import { $readSegments } from '../read';
import { buildMessage, type Outgoing } from '../message';
import { entryOf, entrySegments, lexicalJsonOf } from '../entry';
import { load, type Store } from '../drafts';
import type { ComposerActions } from '../Brain';
import type { ComposerSources, DictateState } from '../sources';
import { NO_SOURCES } from '../sources';
import { FIELD_NODES } from './schema';
import { CASES, img, paste, quote, type Content } from './golden';
import { nodeType, segmentsOf } from './pmtext';
import { PmField } from './PmField';

afterEach(cleanup);

const schema = getSchema(FIELD_NODES);

/** The content in a headless Lexical editor (the old engine's nodes), and its editor-state JSON. */
function lexical(content: Content): { out: Outgoing; json: string } {
  const editor = createEditor({ nodes: [LexicalChip], onError: (e) => { throw e; } });
  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      for (const para of content) {
        const p = $createParagraphNode();
        for (const part of para) {
          if (typeof part !== 'string') {
            p.append($createChipNode(part));
            continue;
          }
          part.split('\n').forEach((line, i) => {
            if (i > 0) p.append($createLineBreakNode());
            if (line !== '') p.append($createTextNode(line));
          });
        }
        root.append(p);
      }
    },
    { discrete: true },
  );
  const segs = editor.getEditorState().read(() => $readSegments());
  return { out: buildMessage(segs), json: JSON.stringify(editor.getEditorState().toJSON()) };
}

/** The content as the TipTap field's doc (one paragraph: paragraphs as hard breaks). */
function pm(content: Content): PmNode {
  const kids: PmNode[] = [];
  content.forEach((para, pi) => {
    if (pi > 0) kids.push(nodeType(schema, 'hardBreak').create());
    for (const part of para) {
      if (typeof part !== 'string') {
        kids.push(nodeType(schema, 'chip').create({ chip: part }));
        continue;
      }
      part.split('\n').forEach((line, i) => {
        if (i > 0) kids.push(nodeType(schema, 'hardBreak').create());
        if (line !== '') kids.push(schema.text(line));
      });
    }
  });
  return nodeType(schema, 'doc').create(null, nodeType(schema, 'paragraph').create(null, kids));
}

describe('(1) the wire: Lexical and TipTap send the same bytes', () => {
  for (const c of CASES) {
    it(c.name, () => {
      expect(lexical(c.content).out).toEqual(c.golden);
      expect(buildMessage(segmentsOf(pm(c.content)))).toEqual(c.golden);
    });
  }
});

const memStore = (): Store & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('(2) old drafts: nothing he typed is lost', () => {
  it("a real Lexical entry reads back as the same segments and the same send (every chip kind)", () => {
    for (const c of CASES) {
      const { out, json } = lexical(c.content);
      const segs = entrySegments(json);
      expect(segs, c.name).not.toBeNull();
      expect(buildMessage(segs ?? []), c.name).toEqual(out);
      // and back: the new entry, and the Lexical JSON the old engine reads while the flag switches
      expect(entrySegments(entryOf(segs ?? [])), c.name).toEqual(segs);
      expect(entrySegments(lexicalJsonOf(segs ?? [])), c.name).toEqual(segs);
    }
  });

  it('the saved Lexical entries (fixtures/lexical-entries.json, made by the old engine) read back and send the golden bytes', () => {
    const saved = JSON.parse(readFileSync(join(__dirname, 'fixtures/lexical-entries.json'), 'utf8')) as Record<string, string>;
    for (const c of CASES) {
      const entry = saved[c.name];
      expect(entry, c.name).toBeDefined();
      expect(buildMessage(entrySegments(entry ?? '') ?? []), c.name).toEqual(c.golden);
    }
  });

  it('draft, history and queue saved by the Lexical engine come back in the new field; ↑ brings the history', async () => {
    const store = memStore();
    const draft = lexical([['half ', quote, ' thought']]).json;
    const sent = lexical([['old ', img]]).json;
    const queued = lexical([['later ', paste]]).json;
    store.setItem('bise.composer.v1.p/main', JSON.stringify({ draft, history: [sent], queue: [queued] }));
    const { getByTestId, a, onSend } = await mount({ store });
    expect(getByTestId('composer.field').textContent).toBe('half ❝ 3 thought');
    await act(async () => {
      a.submit();
      await Promise.resolve();
    });
    expect(onSend).toHaveBeenLastCalledWith(buildMessage(entrySegments(draft) ?? []));
    // the queue and the history kept their old entries untouched
    expect(load(store, 'p/main').queue).toEqual([queued]);
    expect(load(store, 'p/main').history[1]).toBe(sent);
  });

  it("a draft that doesn't read keeps its raw JSON aside, never dropped", async () => {
    const store = memStore();
    const raw = '{"some":"future format"}';
    store.setItem('bise.composer.v1.p/main', JSON.stringify({ draft: raw, history: [], queue: [] }));
    const { getByTestId } = await mount({ store });
    expect(getByTestId('composer.field').textContent).toBe('');
    expect(JSON.parse(store.getItem('bise.composer.v1.p/main.unread') ?? '[]')).toEqual([raw]);
  });
});

/** A fake mic: start/stop/cancel recorded, its state set by the test. */
function testMic() {
  const st = new Map<string, DictateState>();
  const subs = new Map<string, () => void>();
  let n = 0;
  return {
    port: {
      start: () => {
        n += 1;
        const id = `d${n}`;
        st.set(id, { text: '', final: false, cancelled: false, error: null });
        return id;
      },
      stop: () => undefined,
      cancel: (id: string) => {
        st.set(id, { text: '', final: true, cancelled: true, error: null });
        subs.get(id)?.();
      },
      read: (id: string) => st.get(id) ?? null,
      subscribe: (id: string, fn: () => void) => {
        subs.set(id, fn);
        return () => subs.delete(id);
      },
    },
    say(id: string, s: Partial<DictateState>) {
      const prev = st.get(id) ?? { text: '', final: false, cancelled: false, error: null };
      st.set(id, { ...prev, ...s });
      subs.get(id)?.();
    },
  };
}

async function mount(extra: { store?: Store; sources?: ComposerSources } = {}) {
  const got: { a: ComposerActions | null } = { a: null };
  const onSend = vi.fn();
  const store = extra.store ?? memStore();
  const ui = render(
    <PmField
      target="p/main"
      busy={false}
      sources={extra.sources ?? NO_SOURCES}
      store={store}
      testId="composer"
      placeholder="write to bise"
      send={onSend}
      command={() => undefined}
      onCanSend={() => undefined}
      onStrip={() => undefined}
      onBar={() => undefined}
      onActions={(x) => (got.a = x)}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  if (got.a === null) throw new Error('field not ready');
  return { ...ui, onSend, store, a: got.a };
}

describe('(3) the live dictation is in nothing he keeps or sends', () => {
  it('a draft saved and a send made while he talks hold his typed words only; the last words come in after', async () => {
    const mic = testMic();
    const store = memStore();
    const { getByTestId, a, onSend, unmount } = await mount({ store, sources: { ...NO_SOURCES, dictate: mic.port } });
    await act(async () => {
      a.insertText('note:');
      a.dictate();
      mic.say('d1', { text: 'on garde la file' });
      await Promise.resolve();
    });
    // he sees the words live, in the field
    expect(getByTestId('composer.dictation').textContent).toBe(' on garde la file');
    expect(getByTestId('composer.field').textContent).toBe('note: on garde la file');
    // the screen goes mid-dictation: the draft holds only what he typed
    unmount();
    expect(entrySegments(load(store, 'p/main').draft ?? '')).toEqual([{ kind: 'text', text: 'note:' }]);
    // a send while he talks: only his typed words (the dictation is not his message yet)
    const again = await mount({ store, sources: { ...NO_SOURCES, dictate: mic.port } });
    await act(async () => {
      again.a.dictate();
      mic.say('d2', { text: 'pas encore' });
      again.a.submit();
      await Promise.resolve();
    });
    expect(again.onSend).toHaveBeenLastCalledWith({ text: 'note:', files: [] });
    expect(onSend).not.toHaveBeenCalled();
  });
});
