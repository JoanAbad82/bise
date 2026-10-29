// @vitest-environment happy-dom
// at-steady, a slow core (as-he-does dcsteady, gone 69 of 72 frames): a key typed right after the
// '@', before the core's first file answer came, with no agent matching it, closed the list until
// the answer came; it opened again as a new node. The rows it showed stay while this '@'s answer is
// on its way; an answer with no row still closes it.
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { ComposerActions } from "../actions";
import type { Store } from "../drafts";
import type { PickFile } from "../sources";
import { NO_SOURCES } from "../sources";
import { PmField } from "./PmField";

afterEach(cleanup);

const memStore = (): Store => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
};

it("a key typed before the first file answer keeps the @ list, the same node, until the answer", async () => {
  // each query's answer waits for the test
  const asked = new Map<string, (files: readonly PickFile[]) => void>();
  const files = (q: string) =>
    new Promise<readonly PickFile[]>((resolve) => {
      asked.set(q, resolve);
    });
  const got: { a: ComposerActions | null } = { a: null };
  const { queryByTestId } = render(
    <PmField
      target="p/main"
      busy={false}
      sources={{ ...NO_SOURCES, agents: [{ name: "zqbench" }], files }}
      store={memStore()}
      testId="composer"
      placeholder="write to bise"
      send={() => undefined}
      queue={() => undefined}
      editNewest={() => false}
      command={() => undefined}
      onCanSend={() => undefined}
      onStrip={() => undefined}
      onBar={() => undefined}
      onActions={(x) => (got.a = x)}
    />,
  );
  const type = async (s: string) => {
    await act(async () => {
      got.a?.insertText(s);
      await Promise.resolve();
    });
  };
  const answer = async (q: string, items: readonly PickFile[]) => {
    await act(async () => {
      asked.get(q)?.(items);
      await Promise.resolve();
    });
  };
  await type("@");
  const first = queryByTestId("composer.pick");
  expect(first, "'@' opens the list on its agent").not.toBeNull();
  expect(queryByTestId("composer.pick.agent.zqbench")).not.toBeNull();
  // 'd': no agent matches, the answer for '' and 'd' still on their way
  await type("d");
  expect(queryByTestId("composer.pick"), "the same list, still there").toBe(first);
  await answer("d", [{ path: "dcsteady.md", dir: false }]);
  expect(queryByTestId("composer.pick"), "the same list, with the file").toBe(first);
  expect(queryByTestId("composer.pick.file.dcsteady.md")).not.toBeNull();
  // an answer with no row closes it, as before
  await type("zz");
  await answer("dzz", []);
  expect(queryByTestId("composer.pick"), "no row: closed").toBeNull();
});
