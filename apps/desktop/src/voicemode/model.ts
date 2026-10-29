// Voice mode in the window (designer's voice-window page (1), ambient's spec m_11632, the TUI's
// voicemode/pane.rs): its words and keys per state, pure. VoicePane.tsx draws them in the
// composer's box; screen.tsx feeds it from the core (core/voice_mode.rs holds the mic, the
// speaker and the turns). Owner: amb-home (the page's v2: amb-web).
//
// The states are the core's: listening, hearing, sending, thinking, speaking, muted, typing,
// failed. Keys (focus sits on the bar, so space and m never type): space tapped sends now (his
// turn) or cuts in (the agent works); space held keeps the floor (his turn) or cuts in (it speaks);
// m mutes / unmutes; tab types (the composer comes back, the mic waits) and, while he types, goes
// back to voice; esc leaves; ⏎ in failed tries again (designer m_16835; a refused mic: not offered).

export type VoiceState = 'listening' | 'hearing' | 'sending' | 'thinking' | 'speaking' | 'muted' | 'typing' | 'failed';

const STATES: readonly VoiceState[] = ['listening', 'hearing', 'sending', 'thinking', 'speaking', 'muted', 'typing', 'failed'];

/** The core's state word as ours (an unknown one reads as listening). */
export function stateOf(s: string): VoiceState {
  return STATES.find((x) => x === s) ?? 'listening';
}

/** The agent's name as the bar says it: main is bise. */
export const nameOf = (agent: string): string => (agent === 'main' ? 'bise' : agent);

/** The label line over the bar: who he talks to (its right end: the voice model, modelOf). */
export function labelOf(agent: string): string {
  return `voice mode · with ${nameOf(agent)}`;
}

/** The label line while he types (its right end: 'tab back to voice'). */
export function typingLabelOf(agent: string): string {
  return `to ${nameOf(agent)} · voice paused`;
}
export const TYPING_END = 'tab back to voice';

/** The voice role's model as the label line's end: 'mistral/voxtral-mini-latest' -> 'Voxtral · Mistral'. */
export function modelOf(model: string | null | undefined): string {
  if (model == null || model === '') return '';
  const cap = (w: string) => (w === '' ? '' : `${w.charAt(0).toUpperCase()}${w.slice(1)}`);
  const slash = model.indexOf('/');
  const provider = slash < 0 ? '' : model.slice(0, slash);
  const name = (slash < 0 ? model : model.slice(slash + 1)).split(/[-_:.]/u)[0] ?? '';
  return [cap(name), cap(provider)].filter((w) => w !== '').join(' · ');
}

/** What fn says while voice mode is on here (the label line, 3 s). */
export const FN_WAITS = 'fn talks to bise again when you leave voice mode';
export const FN_WAITS_MS = 3000;

/** It's his turn: he talks. */
export function yourTurn(s: VoiceState): boolean {
  return s === 'listening' || s === 'hearing';
}

/** The agent works on his turn: a tap of space cuts in. */
export function agentWorks(s: VoiceState): boolean {
  return s === 'sending' || s === 'thinking';
}

/** A key pair under the bar: the key, its words, what it does. */
export interface Pair {
  readonly key: string;
  readonly words: string;
  readonly act: Act;
}

export type Act = 'send' | 'think' | 'cut' | 'mute' | 'unmute' | 'type' | 'voice' | 'leave' | 'retry' | 'settings';

const MUTE: Pair = { key: 'm', words: 'mute', act: 'mute' };
const TYPE: Pair = { key: 'tab', words: 'type', act: 'type' };
const LEAVE: Pair = { key: 'esc', words: 'leave', act: 'leave' };

/** The key line per state: only the keys that do something now (the page's words). */
export function pairsOf(s: VoiceState): readonly Pair[] {
  switch (s) {
    case 'listening':
    case 'hearing':
      return [{ key: 'space', words: s === 'hearing' ? 'send now' : 'send', act: 'send' }, { key: 'hold space', words: 'keep the floor', act: 'think' }, MUTE, TYPE, LEAVE];
    case 'sending':
    case 'thinking':
      return [{ key: 'space', words: 'cut in', act: 'cut' }, MUTE, TYPE, LEAVE];
    case 'speaking':
      return [{ key: 'hold space', words: 'cut in', act: 'cut' }, MUTE, TYPE, LEAVE];
    case 'muted':
      return [{ key: 'm', words: 'unmute', act: 'unmute' }, TYPE, LEAVE];
    case 'typing':
      return [{ key: '⏎', words: 'send', act: 'send' }, { key: 'tab', words: 'back to voice', act: 'voice' }, LEAVE];
    case 'failed':
      return [{ key: '⏎', words: 'try again', act: 'retry' }, TYPE, LEAVE];
  }
}

/** The key line when the mic is refused: nothing to try again until he allows it (the page's). */
export function failedPairs(fail: Fail | null): readonly Pair[] {
  return fail?.settings === true ? [{ key: 'tab', words: 'type instead', act: 'type' }, LEAVE] : pairsOf('failed');
}

/** The bar's buttons on its right: mute (or unmute) and leave; failed: open settings (a mic
 *  refused) and leave. */
export function buttonsOf(s: VoiceState, fail: Fail | null): readonly Pair[] {
  const leave: Pair = { key: 'esc', words: 'leave', act: 'leave' };
  if (s === 'failed') return fail?.settings === true ? [{ key: '', words: 'open settings', act: 'settings' }, leave] : [leave];
  if (s === 'muted') return [{ key: 'm', words: 'unmute', act: 'unmute' }, leave];
  return [{ key: 'm', words: 'mute', act: 'mute' }, leave];
}

/** How many pairs the key line can drop when it doesn't fit on one line (designer m_16975). */
export const KEY_TRIMS = 2;

/** The key line with its first `n` trims gone: 'tab type' first, then 'm mute' (both are buttons
 *  or obvious); 'esc leave' always stays, last. The keys still work: only their words go. */
export function trimPairs(pairs: readonly Pair[], n: number): readonly Pair[] {
  const order: readonly (readonly Act[])[] = [['type'], ['mute', 'unmute']];
  const gone = new Set<Act>(order.slice(0, Math.max(0, n)).flat());
  return pairs.filter((p) => !gone.has(p.act));
}

/** A failure's line (in --c-err); `settings`: the mic is refused (its 'open settings' button
 *  says where to allow it, so the line carries no hint: designer m_16975). */
export interface Fail {
  readonly words: string;
  readonly settings: boolean;
}

/** The core's fail words as the bar's line. The mic refused by macOS reads the page's words with
 *  an 'open settings' button; any other failure is its own words. */
export function failOf(fail: string | null | undefined): Fail {
  const raw = (fail ?? '').trim();
  const mic = /\b(mic|microphone)\b/iu.test(raw) && /(denied|refused|permission|not allowed|privacy|is off|authori[sz])/iu.test(raw);
  if (mic) return { words: "▲ bise can't hear you: the mic is off for bise.", settings: true };
  const words = raw === '' ? 'voice mode failed.' : raw;
  return { words: words.startsWith('▲') ? words : `▲ ${words}`, settings: false };
}

/** The words in the middle of the bar: the kind of line and its text. */
export interface Words {
  readonly kind: 'dim' | 'heard' | 'failed';
  readonly text: string;
}

/** The bar's words per state (the page's): his live words in ink while he talks, the rest dim.
 *  `speaking`: the agent spoke when he muted (its voice goes on: 'speaking · ○ muted'). */
export function wordsOf(s: VoiceState, agent: string, heard: string | null | undefined, opts: { speaking?: boolean } = {}): Words {
  switch (s) {
    case 'listening':
      return { kind: 'dim', text: '● listening' };
    case 'hearing':
      return heard != null && heard.trim() !== '' ? { kind: 'heard', text: heard } : { kind: 'dim', text: '● listening' };
    case 'sending':
      return { kind: 'dim', text: 'sending…' };
    case 'thinking':
      return { kind: 'dim', text: `∿ ${nameOf(agent)} is on it` };
    case 'speaking':
      return { kind: 'dim', text: 'speaking' };
    case 'muted':
      return { kind: 'dim', text: opts.speaking === true ? 'speaking · ○ muted' : '○ muted' };
    case 'typing':
      return { kind: 'dim', text: '' };
    case 'failed':
      return { kind: 'failed', text: '' };
  }
}

/** The pearl's pose per state (the live shader's moods): it listens, works, speaks; grey when muted,
 *  typing or failed. */
export function poseOf(s: VoiceState): 'listen' | 'work' | 'speak' | 'still' {
  switch (s) {
    case 'listening':
    case 'hearing':
      return 'listen';
    case 'sending':
    case 'thinking':
      return 'work';
    case 'speaking':
      return 'speak';
    case 'muted':
    case 'typing':
    case 'failed':
      return 'still';
  }
}

/** Space held this long is a hold (keep the floor, cut in), shorter a tap (send now, cut in). */
export const HOLD_MS = 350;

export interface KeyLike {
  readonly key: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
}

/** A key down on the bar: its act, or none (space waits for its up: tap or hold). */
export function keyAct(e: KeyLike, s: VoiceState): Act | 'space' | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  const has = (a: Act) => pairsOf(s).some((p) => p.act === a);
  switch (e.key) {
    case 'Escape':
      return 'leave';
    case ' ':
      return has('send') || has('cut') ? 'space' : null;
    case 'm':
    case 'M':
      return has('mute') ? 'mute' : has('unmute') ? 'unmute' : null;
    case 'Tab':
      return s === 'typing' ? 'voice' : has('type') ? 'type' : null;
    case 'Enter':
      return s === 'failed' ? 'retry' : null;
  }
  return null;
}

/** Space came up after `ms`: a tap sends now (his turn) or cuts in (the agent works). */
export function spaceUp(ms: number, s: VoiceState): Act | null {
  if (ms >= HOLD_MS) return null;
  if (yourTurn(s)) return 'send';
  if (agentWorks(s)) return 'cut';
  return null;
}

/** Space held past HOLD_MS: while it speaks, cut in (at once, not on the up); his turn: keep the floor. */
export function spaceHeld(s: VoiceState): Act | null {
  if (s === 'speaking') return 'cut';
  if (yourTurn(s)) return 'think';
  return null;
}

/** The ctrl+r double press (the TUI's DOUBLE_CTRL_R): a second ctrl+r this soon is voice mode. */
export const DOUBLE_CTRL_R_MS = 400;

/** Under his voice turn's bubble: 'said · 0:06' (how long he talked). */
export function saidFor(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `said · ${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, '0')}`;
}


/** An answer's text split where the voice is: [said, unsaid] (said counted in UTF-16 code units,
 *  architect m_16910 / amb-core 5d21b8a1: JS's own string index). A count that falls inside a
 *  surrogate pair takes the whole pair (never half an emoji). */
export function splitLit(text: string, said: number): [string, string] {
  let n = Math.max(0, Math.min(text.length, Math.floor(said)));
  const before = text.charCodeAt(n - 1);
  if (n > 0 && n < text.length && before >= 0xd800 && before <= 0xdbff) n += 1;
  return [text.slice(0, n), text.slice(n)];
}
