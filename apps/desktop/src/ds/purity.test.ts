// src/ds purity (architect m_26213): a ds file that reaches the store, the app or holds its own
// state outside hooks.ts goes red; hooks.ts may hold state, never the app.
import { describe, expect, it } from "vitest";
import { purityFaults } from "./purity.mts";

const faults = (files: Record<string, string>): string[] => purityFaults(files);

describe("ds purity", () => {
  it("is green for a pure component and for hooks.ts's state", () => {
    expect(faults({ "row.tsx": 'import { useOverflow } from "./hooks";\nexport const Row = () => null;', "hooks.ts": 'import { useState } from "react";\nnew ResizeObserver(() => {});' })).toEqual([]);
  });

  it("goes red for a ds file that imports the store or the app, even hooks.ts", () => {
    expect(faults({ "row.tsx": 'import { useStore } from "@/store";' })).toEqual(['row.tsx reaches the app: from "@/store']);
    expect(faults({ "hooks.ts": "import { keep } from '@/app/keep';" })).toEqual(["hooks.ts reaches the app: from '@/app"]);
    expect(faults({ "x.tsx": "window.bise.send()" })).toContain("x.tsx reaches the app: window.bise");
  });

  it("goes red for state, effects or a size watch outside hooks.ts", () => {
    expect(faults({ "row.tsx": "const [a, b] = useState(0); new ResizeObserver(f);" })).toEqual(["row.tsx uses useState outside hooks.ts", "row.tsx uses ResizeObserver outside hooks.ts"]);
  });
});
