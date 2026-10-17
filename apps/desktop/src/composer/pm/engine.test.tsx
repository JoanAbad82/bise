// @vitest-environment happy-dom
// The TipTap engine's laws from architect m_11500, kept after the Lexical engine went (slice 4):
//   (1) the wire: each content of golden.ts sends exactly its golden text and parts (the table
//       was proven byte-identical to the Lexical engine's sends before it went, b04dd6b3);
//   (2) old drafts: the saved entries read back and send the same; a draft, history and queue
//       saved come back in the field; an entry that doesn't read (an old Lexical one too: its
//       reader went in issue 31) keeps its raw JSON aside;
//   (3) a draft saved and a send made while dictation is live hold none of its words.
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSchema } from "@tiptap/core";
import type { Node as PmNode } from "@tiptap/pm/model";
import { buildMessage } from "../message";
import { entryOf, entrySegments } from "../entry";
import { load, type Store } from "../drafts";
import type { ComposerActions } from "../actions";
import type { ComposerSources, DictateState } from "../sources";
import { NO_SOURCES } from "../sources";
import { FIELD_NODES } from "./schema";
import { CASES, type Content } from "./golden";
import { nodeType, segmentsOf } from "./pmtext";
import { PmField } from "./PmField";

afterEach(cleanup);

const schema = getSchema(FIELD_NODES);

/** A golden content as the field saves it (`{"v":2,"segs":[…]}`). */
const saved = (name: string): string => {
  const c = CASES.find((k) => k.name === name);
  if (c === undefined) throw new Error(`no golden content ${name}`);
  return entryOf(segmentsOf(pm(c.content)));
};

/** The content as the TipTap field's doc (one paragraph: paragraphs as hard breaks). */
function pm(content: Content): PmNode {
  const kids: PmNode[] = [];
  content.forEach((para, pi) => {
    if (pi > 0) kids.push(nodeType(schema, "hardBreak").create());
    for (const part of para) {
      if (typeof part !== "string") {
        kids.push(nodeType(schema, "chip").create({ chip: part }));
        continue;
      }
      part.split("\n").forEach((line, i) => {
        if (i > 0) kids.push(nodeType(schema, "hardBreak").create());
        if (line !== "") kids.push(schema.text(line));
      });
    }
  });
  return nodeType(schema, "doc").create(
    null,
    nodeType(schema, "paragraph").create(null, kids),
  );
}

describe("(1) the wire: each content sends its golden bytes", () => {
  for (const c of CASES) {
    it(c.name, () => {
      expect(buildMessage(segmentsOf(pm(c.content)))).toEqual(c.golden);
    });
  }
});

const memStore = (): Store & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
};

describe("(2) old drafts: nothing he typed is lost", () => {
  it("an entry goes both ways: the new format reads back as the segments it was made of", () => {
    for (const c of CASES) {
      const segs = entrySegments(saved(c.name));
      expect(segs, c.name).not.toBeNull();
      expect(entrySegments(entryOf(segs ?? [])), c.name).toEqual(segs);
    }
  });

  it("the saved entries read back and send the golden bytes", () => {
    for (const c of CASES) {
      expect(buildMessage(entrySegments(saved(c.name)) ?? []), c.name).toEqual(c.golden);
    }
  });

  it("a saved draft, history and queue come back in the field; ↑ brings the history", async () => {
    const store = memStore();
    const draft = saved("a quote of diff lines");
    const sent = saved("an image");
    const queued = saved("a long paste");
    store.setItem(
      "bise.composer.v1.p/main",
      JSON.stringify({ draft, history: [sent], queue: [queued] }),
    );
    const { getByTestId, a, onSend, onQueue } = await mount({ store });
    expect(getByTestId("composer.field").textContent).toBe(
      "❝ 3why this order?",
    );
    await act(async () => {
      a.submit();
      await Promise.resolve();
    });
    expect(onSend).toHaveBeenLastCalledWith(
      buildMessage(entrySegments(draft) ?? []),
    );
    // the old queue went to the hub's queue once (issue 23), the history kept its old entries
    expect(onQueue).toHaveBeenCalledTimes(1);
    expect(onQueue).toHaveBeenCalledWith(buildMessage(entrySegments(queued) ?? []));
    expect(store.getItem("bise.composer.v1.p/main") ?? "").not.toContain('"queue"');
    expect(load(store, "p/main").history[1]).toBe(sent);
  });

  it("a draft that doesn't read keeps its raw JSON aside, never dropped (an old Lexical entry too)", async () => {
    // the Lexical engine's editor state: its reader went in issue 31
    const lexical = '{"root":{"children":[{"children":[{"text":"ça va","type":"text"}],"type":"paragraph"}],"type":"root"}}';
    expect(entrySegments(lexical)).toBeNull();
    for (const raw of ['{"some":"future format"}', lexical]) {
      cleanup();
      const store = memStore();
      store.setItem(
        "bise.composer.v1.p/main",
        JSON.stringify({ draft: raw, history: [], queue: [] }),
      );
      const { getByTestId } = await mount({ store });
      expect(getByTestId("composer.field").textContent).toBe("");
      expect(
        JSON.parse(store.getItem("bise.composer.v1.p/main.unread") ?? "[]"),
      ).toEqual([raw]);
    }
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
        st.set(id, { text: "", final: false, cancelled: false, error: null });
        return id;
      },
      stop: () => undefined,
      cancel: (id: string) => {
        st.set(id, { text: "", final: true, cancelled: true, error: null });
        subs.get(id)?.();
      },
      read: (id: string) => st.get(id) ?? null,
      subscribe: (id: string, fn: () => void) => {
        subs.set(id, fn);
        return () => subs.delete(id);
      },
    },
    say(id: string, s: Partial<DictateState>) {
      const prev = st.get(id) ?? {
        text: "",
        final: false,
        cancelled: false,
        error: null,
      };
      st.set(id, { ...prev, ...s });
      subs.get(id)?.();
    },
  };
}

async function mount(extra: { store?: Store; sources?: ComposerSources } = {}) {
  const got: { a: ComposerActions | null } = { a: null };
  const onSend = vi.fn();
  const onQueue = vi.fn();
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
      queue={onQueue}
      editNewest={() => false}
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
  if (got.a === null) throw new Error("field not ready");
  return { ...ui, onSend, onQueue, store, a: got.a };
}

describe("(3) the live dictation is in nothing he keeps or sends", () => {
  it("a draft saved and a send made while he talks hold his typed words only; the last words come in after", async () => {
    const mic = testMic();
    const store = memStore();
    const { getByTestId, a, onSend, unmount } = await mount({
      store,
      sources: { ...NO_SOURCES, dictate: mic.port },
    });
    await act(async () => {
      a.insertText("note:");
      a.dictate();
      mic.say("d1", { text: "on garde la file" });
      await Promise.resolve();
    });
    // he sees the words live, in the field
    // (its lead, then the take's chip, then the words; the chip has no text)
    expect(getByTestId("composer.dictation").textContent).toBe(
      " on garde la file",
    );
    expect(getByTestId("composer.field").textContent).toBe(
      "note: on garde la file",
    );
    // the screen goes mid-dictation: the draft holds only what he typed
    unmount();
    expect(entrySegments(load(store, "p/main").draft ?? "")).toEqual([
      { kind: "text", text: "note:" },
    ]);
    // a send while he talks: only his typed words (the dictation is not his message yet)
    const again = await mount({
      store,
      sources: { ...NO_SOURCES, dictate: mic.port },
    });
    await act(async () => {
      again.a.dictate();
      mic.say("d2", { text: "pas encore" });
      again.a.submit();
      await Promise.resolve();
    });
    expect(again.onSend).toHaveBeenLastCalledWith({ text: "note:" });
    expect(onSend).not.toHaveBeenCalled();
  });
});

describe("(4) a draft key of its own (an inbox card, amb-home m_20065)", () => {
  it("the card's half answer and the thread's draft swap with the key, both kept; the send still goes to the target", async () => {
    const store = memStore();
    const got: { a: ComposerActions | null } = { a: null };
    const onSend = vi.fn();
    const field = (draftKey?: string) => (
      <PmField
        target="p/main"
        draftKey={draftKey}
        busy={false}
        sources={NO_SOURCES}
        store={store}
        testId="composer"
        placeholder="write to bise"
        send={onSend}
        queue={() => undefined}
        editNewest={() => false}
        command={() => undefined}
        onCanSend={() => undefined}
        onStrip={() => undefined}
        onBar={() => undefined}
        onActions={(x) => (got.a = x)}
      />
    );
    const { getByTestId, rerender } = render(field());
    const text = () => getByTestId("composer.field").textContent;
    const type = async (s: string) => {
      await act(async () => {
        got.a?.insertText(s);
        await Promise.resolve();
      });
    };
    const key = async (k?: string) => {
      await act(async () => {
        rerender(field(k));
        await Promise.resolve();
      });
    };
    await type("thread words");
    await key("p/main#card:7");
    expect(text(), "the card opens on its own blank draft").toBe("");
    expect(
      load(store, "p/main").draft,
      "the thread's draft was written at once",
    ).not.toBeNull();
    await type("half an answer");
    await key(undefined);
    expect(text(), "the thread's draft is back").toBe("thread words");
    await key("p/main#card:7");
    expect(text(), "the card's half answer is back").toBe("half an answer");
    expect(
      load(store, "p/main#card:7").history,
      "history stays the target’s",
    ).toEqual([]);
    await act(async () => {
      got.a?.submit();
      await Promise.resolve();
    });
    expect(onSend).toHaveBeenLastCalledWith({
      text: "half an answer",
    });
    expect(
      load(store, "p/main#card:7").draft,
      "sent: the card key is blank",
    ).toBeNull();
    expect(
      load(store, "p/main").history[0],
      "the send is in the target's history",
    ).toBeDefined();
    await key(undefined);
    expect(text(), "the thread's draft never moved").toBe("thread words");
  });
});
