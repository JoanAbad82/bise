// @vitest-environment happy-dom
// A file dropped anywhere in the window is the composer's (paste.ts useDropAnywhere): a Finder file
// becomes a file chip by its path. A spring-loaded project's row leaves its drop to the window
// (app/spring.ts, designer m_47585), so after the spring the drop lands here, in the opened
// project's field. On a real editor state; main's window.bise.filePath faked.
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { getSchema } from '@tiptap/core';
import { EditorState, type Transaction } from '@tiptap/pm/state';
import { useDropAnywhere, type PasteCtx } from './paste';
import { FIELD_NODES } from './schema';
import { chipsOf, nodeType } from './pmtext';
import type { ComposerSources } from '../sources';

const schema = getSchema(FIELD_NODES);

afterEach(() => {
  cleanup();
  delete (globalThis as { bise?: unknown }).bise;
});

function Field({ ctx }: { ctx: PasteCtx }) {
  useDropAnywhere(ctx);
  return <div data-testid="field" />;
}

describe('useDropAnywhere', () => {
  it("a Finder file dropped outside the field becomes a file chip in it", async () => {
    (globalThis as { bise?: unknown }).bise = { filePath: (f: File) => `/Users/g/Desktop/${f.name}` };
    let st = EditorState.create({ doc: nodeType(schema, 'doc').create(null, nodeType(schema, 'paragraph').create()) });
    const ctx: PasteCtx = {
      sources: () => ({}) as ComposerSources,
      state: () => st,
      dispatch: (tr: Transaction | null) => {
        if (tr !== null) st = st.apply(tr);
        return true;
      },
      view: () => null,
    };
    render(<Field ctx={ctx} />);
    const file = new File(['x'], 'deck.pptx');
    const drop = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(drop, 'dataTransfer', { value: { files: [file], types: ['Files'] } });
    await act(async () => {
      document.body.dispatchEvent(drop);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(drop.defaultPrevented).toBe(true);
    expect(chipsOf(st.doc)).toEqual([{ kind: 'file', n: 1, path: '/Users/g/Desktop/deck.pptx', bytes: 1 }]);
  });
});
