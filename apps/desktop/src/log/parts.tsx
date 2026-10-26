// /debug's shared bits (designer debug-views v3): the key line's keys, the find field with its
// count, the foot of a cut body (show more / show less, whole.ts), and the screen's keys on
// window. Both tabs (LogScreen.tsx's history, Completion.tsx)
// use them. Owner: debug-cmd.
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import type { BodyOf, LogBody } from "@/proto";
import { Input, Press } from "@/ds";
import { debug } from "@/proto/words_debug.gen";
import { bytesOf, findCount, shortBytes } from "./model";
import { keyOf, type WholeApi } from "./whole";

export function K({
  k,
  esc = false,
  children,
}: {
  k: string;
  esc?: boolean;
  children: string;
}) {
  return (
    <span className={esc ? "lg-k esc" : "lg-k"}>
      <kbd>{k}</kbd> {children}
    </span>
  );
}

/**
 * The screen's keys on window in the capture phase, as the thread's: they run before
 * type-anywhere (composer/grab.ts, on document), so the screen's letters never send the focus
 * to the composer. Only while the focus is in `root`.
 */
export function useScreenKeys(
  root: RefObject<HTMLElement | null>,
  onKey: (e: KeyboardEvent) => void,
): void {
  const keyRef = useRef(onKey);
  useLayoutEffect(() => {
    keyRef.current = onKey;
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = root.current;
      if (el !== null && el.contains(document.activeElement)) keyRef.current(e);
    };
    window.addEventListener("keydown", h, true);
    return () => {
      window.removeEventListener("keydown", h, true);
    };
  }, [root]);
}

/**
 * Under a body the hub cut at 4 KB (debug-more): 'cut at 4 KB · show more'; reading it whole;
 * shown whole: 'show less' (and '1.0 MB of 3.2 MB shown' when the hub cut it again at its cap); a
 * failed read: the hub's words and show more again. Nothing under a whole body.
 */
export function CutFoot({ of, body, whole, id }: { of: BodyOf; body: LogBody; whole: WholeApi; id: string }) {
  if (body.cut !== true) return null;
  const w = whole.ws.get(keyOf(of));
  const button = (less: boolean) => (
    <Press
      look="lg-more"
      data-testid={`${id}.${less ? "less" : "more"}`}
      onClick={(e) => {
        e.stopPropagation();
        if (less) whole.less(of);
        else whole.more(of);
      }}
    >
      {less ? debug.show_less : debug.show_more}
    </Press>
  );
  return (
    <div className="lg-cut" data-testid={`${id}.cut`}>
      {w?.state === "reading" ? (
        <span className="meta">{debug.reading_whole}</span>
      ) : w?.state === "shown" ? (
        <>
          {w.cut && <span className="meta">{debug.whole_cut({ shown: shortBytes(bytesOf(w.text)), total: shortBytes(w.total) })}</span>}
          {button(true)}
        </>
      ) : (
        <>
          <span className="meta">{w?.state === "error" ? w.text : debug.cut_at}</span>
          {button(false)}
        </>
      )}
    </div>
  );
}

/** The find field ('⌕ hero', '3 of 27'): ⏎ next, ⇧⏎ previous, esc closes. */
export function FindLine({
  field,
  needle,
  at,
  of,
  busy,
  onNeedle,
  onStep,
  onClose,
}: {
  field: RefObject<HTMLInputElement | null>;
  needle: string;
  at: number;
  of: number;
  busy: boolean;
  onNeedle: (n: string) => void;
  onStep: (by: number) => void;
  onClose: () => void;
}) {
  return (
    <span className="lg-find">
      <span className="w">⌕</span>
      <Input
        ref={field}
        data-testid="log.find"
        value={needle}
        placeholder="find in the whole history"
        onChange={(e) => {
          onNeedle(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          } else if (e.key === "Enter") {
            e.preventDefault();
            onStep(e.shiftKey ? -1 : 1);
          }
        }}
      />
      {needle.trim() !== "" && (
        <span className="lg-count" data-testid="log.count">
          {busy ? "finding…" : findCount(at, of)}
        </span>
      )}
    </span>
  );
}
