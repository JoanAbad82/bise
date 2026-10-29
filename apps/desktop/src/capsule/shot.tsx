// The front window's still on a fn talk (designer m_21903, contract ambient-lead m_21911): its
// row under his words while he talks (the signed image chip: 16 px thumb, 'Safari · stripe.com',
// ✕ on hover; fn ⌫ drops it too), and the one-time ask for Screen Recording under the words.
// The core owns the shot ({ev:'shot', file, app, title}; {cmd:'shot_drop'}), amb-mac the
// permission and the pref (prefs.context.shot: absent = never asked).
import type { JSX } from "react";
import { Button, Chip, Press } from "@/ds";
import { fileUrl } from "@/thread/rows";
import type { Grant } from "@/proto";

/** The talk's still as the core stored it: its file in the image store, the window's app and title. */
export interface TalkShot {
  readonly file: string;
  /** the core's number for it: a spotlight send names it, its close drops only it (spot-shot) */
  readonly id?: number;
  readonly app: string;
  readonly title: string;
}

export const SHOT_W = {
  drop: "no screenshot",
  dropKeys: "fn ⌫",
  dropTitle: "don't send this window",
  ask: "bise can see the window you're on when you talk. it needs Screen Recording for that.",
  open: "open System Settings",
  later: "not now",
} as const;

/** The longest title the chip shows before its '…' (the app always whole). */
const TITLE_MAX = 32;

/** The chip's words: 'Safari · stripe.com', the title cut with '…'; the app alone without one. Pure. */
export function shotName(s: Pick<TalkShot, "app" | "title">): string {
  const t = s.title.trim();
  const chars = Array.from(t);
  const cut = chars.length > TITLE_MAX ? `${chars.slice(0, TITLE_MAX - 1).join("").replace(/[\s,;:·-]+$/u, "")}…` : t;
  return cut === "" ? s.app : s.app === "" ? cut : `${s.app} · ${cut}`;
}

/** The core's shot event read: a stored still, or none (dropped, sent, forgotten). Pure. */
export function shotOf(ev: { readonly file?: string | null; readonly id?: number | null; readonly app?: string | null; readonly title?: string | null }): TalkShot | null {
  if (ev.file == null || ev.file === "") return null;
  return { file: ev.file, ...(ev.id == null ? {} : { id: ev.id }), app: ev.app ?? "", title: ev.title ?? "" };
}

/**
 * The ask shows on a talk when the still would need Screen Recording he hasn't given, and he was
 * never asked (prefs.context.shot absent: 'not now' sets it false, a grant or onboarding true). Pure.
 */
export function asksForScreen(screen: Grant | undefined, pref: boolean | undefined): boolean {
  return pref === undefined && (screen === "ask" || screen === "denied");
}

/** His pref for the still: prefs.context.shot, undefined when absent. Pure. */
export function shotPref(prefs: unknown): boolean | undefined {
  if (typeof prefs !== "object" || prefs === null) return undefined;
  const c = (prefs as { context?: unknown }).context;
  if (typeof c !== "object" || c === null) return undefined;
  const v = (c as { shot?: unknown }).shot;
  return typeof v === "boolean" ? v : undefined;
}

/** The still's row under his words, and the keys line under it (only while he talks). */
export function ShotRow({ shot, listening, onDrop }: { shot: TalkShot; listening: boolean; onDrop: () => void }): JSX.Element {
  const name = shotName(shot);
  return (
    <>
      <div className="b-cap-shot" data-testid="capsule.shot">
        <span className="b-cap-shot-chip">
          <Chip kind="part" of="image" title={`${shot.app} · ${shot.title}`} thumb={<img className="thumb" src={fileUrl(shot.file)} alt="" />} testId="capsule.shot.chip">
            {name}
          </Chip>
          {listening && (
            <Press look="x" title={SHOT_W.dropTitle} aria-label={SHOT_W.dropTitle} onClick={onDrop} data-testid="capsule.shot.drop">
              ✕
            </Press>
          )}
        </span>
      </div>
      {listening && (
        <div className="b-cap-keys" data-testid="capsule.keys">
          <span className="k">{SHOT_W.dropKeys}</span> {SHOT_W.drop}
        </div>
      )}
    </>
  );
}

/** The one-time ask under his words: the talk went as words alone. */
export function ScreenAsk({ onOpen, onLater }: { onOpen: () => void; onLater: () => void }): JSX.Element {
  return (
    <div className="b-cap-ask" data-testid="capsule.ask">
      <div className="t">{SHOT_W.ask}</div>
      <div className="acts">
        <Button kind="pri" size="sm" onClick={onOpen} testId="capsule.ask.open">
          {SHOT_W.open}
        </Button>
        <Button size="sm" onClick={onLater} testId="capsule.ask.later">
          {SHOT_W.later}
        </Button>
      </div>
    </div>
  );
}
