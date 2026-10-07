// Voice mode in the window (ambient's spec m_11632, the TUI's voicemode/pane.rs drawn in the
// window): its words and keys per state, pure. VoicePane.tsx draws them; the core
// (core/voice_mode.rs, amb-core 473d5757) holds the mic, the speaker and the turns. Owner: amb-home.
//
// The states are the core's: listening, hearing, sending, thinking, speaking, muted, typing,
// failed. Keys (focus sits on the pane, so space and m never type): space tapped sends now
// (listening, hearing); space held while it speaks cuts in; m mutes / unmutes; tab types (the
// composer comes back, the mic waits); esc leaves (in typing: back to voice); ⏎ in failed tries
// again.

export type VoiceState = 'listening' | 'hearing' | 'sending' | 'thinking' | 'speaking' | 'muted' | 'typing' | 'failed';

const STATES: readonly VoiceState[] = ['listening', 'hearing', 'sending', 'thinking', 'speaking', 'muted', 'typing', 'failed'];

/** The core's state word as ours (an unknown one reads as listening). */
export function stateOf(s: string): VoiceState {
  return STATES.find((x) => x === s) ?? 'listening';
}

/** The agent's name as the pane says it: main is bise. */
export const nameOf = (agent: string): string => (agent === 'main' ? 'bise' : agent);

/** The label line over the frame. */
export function labelOf(agent: string): string {
  return `you ⇄ ${nameOf(agent)} · voice mode`;
}

/** What fn says while voice mode is on here (the label line, 3 s). */
export const FN_WAITS = 'fn waits: voice mode is on here';
export const FN_WAITS_MS = 3000;

/** It's his turn: his bars in the accent. */
export function yourTurn(s: VoiceState): boolean {
  return s === 'listening' || s === 'hearing';
}

/** A key pair under the frame: the key, its words, what it does. */
export interface Pair {
  readonly key: string;
  readonly words: string;
  readonly act: Act;
}

export type Act = 'send' | 'think' | 'cut' | 'mute' | 'unmute' | 'type' | 'voice' | 'leave' | 'retry';

/** The key line per state (the signed words). */
export function pairsOf(s: VoiceState): readonly Pair[] {
  const leave: Pair = { key: 'esc', words: 'leave', act: 'leave' };
  switch (s) {
    case 'listening':
    case 'hearing':
      return [
        { key: 'space', words: 'send now', act: 'send' },
        { key: 'hold space', words: "i'm thinking", act: 'think' },
        { key: 'm', words: 'mute', act: 'mute' },
        { key: 'tab', words: 'type', act: 'type' },
        leave,
      ];
    case 'speaking':
      return [{ key: 'hold space', words: 'cut in', act: 'cut' }, { key: 'm', words: 'mute', act: 'mute' }, leave];
    case 'thinking':
    case 'sending':
      return [{ key: 'm', words: 'mute', act: 'mute' }, leave];
    case 'muted':
      return [{ key: 'm', words: 'unmute', act: 'unmute' }, leave];
    case 'typing':
      return [{ key: 'esc', words: 'back to voice', act: 'voice' }];
    case 'failed':
      return [{ key: '⏎', words: 'try again', act: 'retry' }, { key: 'tab', words: 'type', act: 'type' }, leave];
  }
}

/** The words line: the kind of line and its text. */
export interface Words {
  readonly kind: 'listening' | 'heard' | 'sending' | 'thinking' | 'said' | 'muted' | 'typing' | 'failed';
  readonly text: string;
}

export function wordsOf(s: VoiceState, heard: string | null | undefined, said: string | null | undefined, fail: string | null | undefined): Words {
  switch (s) {
    case 'listening':
      return { kind: 'listening', text: 'listening' };
    case 'hearing':
      return { kind: 'heard', text: heard ?? '' };
    case 'sending':
      return { kind: 'sending', text: 'sending…' };
    case 'thinking':
      return { kind: 'thinking', text: 'thinking' };
    case 'speaking':
      return { kind: 'said', text: said ?? '' };
    case 'muted':
      return { kind: 'muted', text: 'muted' };
    case 'typing':
      return { kind: 'typing', text: 'typing: the mic waits' };
    case 'failed':
      return { kind: 'failed', text: fail ?? 'voice mode failed' };
  }
}

/** Space held this long is a hold (think, cut in), shorter a tap (send now). */
export const HOLD_MS = 350;

export interface KeyLike {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
}

/** A key down on the pane: its act, or none (space waits for its up: tap or hold). */
export function keyAct(e: KeyLike, s: VoiceState): Act | 'space' | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  const has = (a: Act) => pairsOf(s).some((p) => p.act === a);
  switch (e.key) {
    case 'Escape':
      return s === 'typing' ? 'voice' : 'leave';
    case ' ':
      return has('send') || has('cut') ? 'space' : null;
    case 'm':
    case 'M':
      return has('mute') ? 'mute' : has('unmute') ? 'unmute' : null;
    case 'Tab':
      return has('type') ? 'type' : null;
    case 'Enter':
      return has('retry') ? 'retry' : null;
  }
  return null;
}

/** Space came up after `ms`: a tap sends now (his turn), a hold while it speaks was a cut-in. */
export function spaceUp(ms: number, s: VoiceState): Act | null {
  if (ms < HOLD_MS) return yourTurn(s) ? 'send' : null;
  return null;
}

/** Space held past HOLD_MS: while it speaks, cut in (at once, not on the up). */
export function spaceHeld(s: VoiceState): Act | null {
  return s === 'speaking' ? 'cut' : null;
}

/** The ctrl+r double press (the TUI's DOUBLE_CTRL_R): a second ctrl+r this soon is voice mode. */
export const DOUBLE_CTRL_R_MS = 400;
