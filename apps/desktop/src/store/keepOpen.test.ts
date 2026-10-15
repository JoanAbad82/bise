// notif-artifact (designer m_26776, architect m_26835): a page's item stays open across the views. The
// store keeps which one (a view slice): the block that opens the page beside, or unmounts with it
// open, sets it; the block that mounts reads it and clears it once its list holds the item.
import { describe, expect, it } from "vitest";
import { Store } from "./store";

describe("keepOpen: a page's item kept open across the views", () => {
  it("is empty at first, holds the last item set, and clears", () => {
    const s = new Store({ send: () => undefined }, { now: () => 7 });
    expect(s.keptOpen()).toBeUndefined();
    s.keepOpen({ project: "shop", card: 3 });
    s.keepOpen({ project: "shop", card: 4 });
    expect(s.keptOpen()).toEqual({ project: "shop", card: 4 });
    // read without taking: a block whose list lacks it leaves it for the next one
    expect(s.keptOpen()).toEqual({ project: "shop", card: 4 });
    s.keepOpen(undefined);
    expect(s.keptOpen()).toBeUndefined();
  });

  it("is the window's own: it sends nothing to the core", () => {
    const sent: unknown[] = [];
    const s = new Store({ send: (c) => sent.push(c) }, { now: () => 7 });
    s.keepOpen({ project: "shop", card: 3 });
    expect(sent).toEqual([]);
  });
});
