// What the capsule says when the core ends his fn talk without a send (amb-core m_21857: his fn
// stuck on 'bise is thinking…'), from the core's events. Pure: CapsuleRoot dispatches the result.

import { W } from "./Capsule";
import type { CapEvent } from "./machine";

/** the 'over' line of a card his words answered stays this long, then the capsule goes */
export const OVER_FADE_MS = 1500;

/**
 * The core's own errors the capsule says in the app's words (designer m_21945: the capsule isn't
 * the terminal, and in the app the global main IS bise); every other error passes through.
 */
const REWORDED: Readonly<Record<string, Omit<Extract<CapEvent, { ev: "talk_over" }>, "ev">>> = {
  "voice needs a key. /voice picks one.": { said: W.needsVoiceKey, link: { label: W.voiceSettings, route: "settings/voice" } },
  "main didn't get it: bise isn't reachable. try again in a moment.": { said: W.notReached },
};

type TalkOver = Extract<CapEvent, { ev: "talk_over" }>;

/** a final 'heard' with no words ends the talk: nothing heard */
export function heardOver(text: string, final: boolean): TalkOver | null {
  return final && text.trim() === "" ? { ev: "talk_over", said: W.heardNothing } : null;
}

/** his words answered a card of `name` (voice_answer): said, then the capsule goes */
export function answeredOver(name: string): TalkOver {
  return { ev: "talk_over", said: W.answered(name), fades: true };
}

/** an `error` with no project (the core's own, a talk's failure) ends the talk with its reason */
export function errorOver(project: string | null | undefined, cmd: string | null | undefined, text: string): TalkOver | null {
  if (project != null || (cmd != null && cmd !== "talk_start")) return null;
  return { ev: "talk_over", ...(REWORDED[text] ?? { said: text }) };
}
