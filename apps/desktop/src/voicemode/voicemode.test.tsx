// @vitest-environment happy-dom
// Voice mode in the window, to designer's voice-window page (1): the label line, the words and
// keys per state, the bar's buttons, the failed line, the said time, the lit split, and the bar
// on keys and clicks.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { buttonsOf, failedPairs, failOf, keyAct, labelOf, modelOf, pairsOf, saidFor, spaceHeld, spaceUp, splitLit, stateOf, typingLabelOf, wordsOf, HOLD_MS, type Act } from './model';
import { forgetSaid, noteSaid, saidMs } from './said';
import { VoicePane } from './VoicePane';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  forgetSaid();
});

const k = (key: string) => ({ key, metaKey: false, ctrlKey: false, altKey: false });
const line = (s: Parameters<typeof pairsOf>[0]) => pairsOf(s).map((p) => `${p.key} ${p.words}`).join('   ');

describe("voice mode, designer's voice-window page (1)", () => {
  it('the label line: who he talks to (main is bise), the voice model; typing says voice paused', () => {
    expect(labelOf('perf')).toBe('voice mode · with perf');
    expect(labelOf('main')).toBe('voice mode · with bise');
    expect(typingLabelOf('perf')).toBe('to perf · voice paused');
    expect(modelOf('mistral/voxtral-mini-latest')).toBe('Voxtral · Mistral');
    expect(modelOf('')).toBe('');
    expect(stateOf('nope')).toBe('listening');
  });

  it("the key line per state: only the keys that do something now, the page's words", () => {
    expect(line('listening')).toBe('space send   hold space keep the floor   m mute   tab type   esc leave');
    expect(line('hearing')).toBe('space send now   hold space keep the floor   m mute   tab type   esc leave');
    expect(line('thinking')).toBe('space cut in   m mute   tab type   esc leave');
    expect(line('speaking')).toBe('hold space cut in   m mute   tab type   esc leave');
    expect(line('muted')).toBe('m unmute   tab type   esc leave');
    expect(line('typing')).toBe('⏎ send   tab back to voice   esc leave');
    expect(line('failed')).toBe('⏎ try again   tab type   esc leave');
    expect(failedPairs(failOf('microphone access denied')).map((p) => `${p.key} ${p.words}`).join('   ')).toBe('tab type instead   esc leave');
  });

  it('the words per state: his live words in ink, the rest dim; muted while it spoke', () => {
    expect(wordsOf('listening', 'perf', null)).toEqual({ kind: 'dim', text: '● listening' });
    expect(wordsOf('hearing', 'perf', 'why is it slow')).toEqual({ kind: 'heard', text: 'why is it slow' });
    expect(wordsOf('thinking', 'perf', null)).toEqual({ kind: 'dim', text: '∿ perf is on it' });
    expect(wordsOf('thinking', 'main', null).text).toBe('∿ bise is on it');
    expect(wordsOf('speaking', 'perf', null).text).toBe('speaking');
    expect(wordsOf('muted', 'perf', null, { speaking: true }).text).toBe('speaking · ○ muted');
    expect(wordsOf('muted', 'perf', null).text).toBe('○ muted');
  });

  it('the bar right: mute or unmute and leave; a refused mic fails with where to allow it and open settings', () => {
    expect(buttonsOf('listening', null).map((p) => `${p.words} ${p.key}`)).toEqual(['mute m', 'leave esc']);
    expect(buttonsOf('muted', null).map((p) => `${p.words} ${p.key}`)).toEqual(['unmute m', 'leave esc']);
    const mic = failOf('microphone access denied');
    expect(mic).toEqual({ words: "▲ bise can't hear you: the mic is off for bise.", hint: 'System Settings › Privacy › Microphone', settings: true });
    expect(buttonsOf('failed', mic).map((p) => p.act)).toEqual(['settings', 'leave']);
    const down = failOf("▲ Voxtral didn't answer. try again or tab to type");
    expect(down).toEqual({ words: "▲ Voxtral didn't answer. try again or tab to type", hint: '', settings: false });
    expect(buttonsOf('failed', down).map((p) => p.act)).toEqual(['leave']);
    expect(failOf('the mic is busy.').settings).toBe(false);
  });

  it('keys: esc leaves (typing too), tab types and goes back to voice, m mutes, space waits for its up', () => {
    expect(keyAct(k('Escape'), 'listening')).toBe('leave');
    expect(keyAct(k('Escape'), 'typing')).toBe('leave');
    expect(keyAct(k('Tab'), 'thinking')).toBe('type');
    expect(keyAct(k('Tab'), 'typing')).toBe('voice');
    expect(keyAct(k('m'), 'hearing')).toBe('mute');
    expect(keyAct(k('m'), 'muted')).toBe('unmute');
    expect(keyAct(k('Enter'), 'failed')).toBe('retry');
    expect(keyAct(k(' '), 'listening')).toBe('space');
    expect(keyAct(k(' '), 'thinking')).toBe('space');
    expect(keyAct(k(' '), 'muted')).toBeNull();
    expect(keyAct({ ...k('m'), metaKey: true }, 'hearing')).toBeNull();
    expect(spaceUp(100, 'hearing')).toBe('send');
    expect(spaceUp(100, 'thinking')).toBe('cut');
    expect(spaceUp(HOLD_MS + 1, 'hearing')).toBeNull();
    expect(spaceHeld('speaking')).toBe('cut');
    expect(spaceHeld('hearing')).toBe('think');
  });

  it("his voice turn: 'said · 0:06', found by its words whatever their spaces", () => {
    expect(saidFor(6200)).toBe('said · 0:06');
    expect(saidFor(75_000)).toBe('said · 1:15');
    noteSaid('p', 'perf', 'show me  both', 6000);
    expect(saidMs('p', 'perf', 'Show me both')).toBe(6000);
    expect(saidMs('p', 'main', 'show me both')).toBeNull();
    expect(saidMs('p', 'perf', 'typed')).toBeNull();
  });

  it('the lit answer: its said part counted in UTF-16 code units, a pair never split', () => {
    expect(splitLit('done 🎉 for the tablets', 7)).toEqual(['done 🎉', ' for the tablets']);
    // a count inside the pair takes the whole emoji
    expect(splitLit('done 🎉 for the tablets', 6)).toEqual(['done 🎉', ' for the tablets']);
    expect(splitLit('done 🎉 for the tablets', 5)).toEqual(['done ', '🎉 for the tablets']);
    expect(splitLit('abc', 9)).toEqual(['abc', '']);
  });

  it('the bar: heard words in ink, a tap of space sends, a hold while it speaks cuts in, buttons click', () => {
    vi.useFakeTimers();
    const acts: Act[] = [];
    const { rerender } = render(<VoicePane state="hearing" agent="perf" heard="why is the cold bench slow" model="Voxtral · Mistral" you={0.4} them={0} onAct={(a) => acts.push(a)} />);
    expect(screen.getByTestId('voice.label').textContent).toBe('voice mode · with perf');
    expect(screen.getByTestId('voice.model').textContent).toBe('Voxtral · Mistral');
    expect(screen.getByTestId('voice.words').textContent).toBe('why is the cold bench slow …');
    const pane = screen.getByTestId('voice.pane');
    fireEvent.keyDown(pane, { key: ' ', timeStamp: 10 });
    fireEvent.keyUp(pane, { key: ' ', timeStamp: 60 });
    expect(acts).toEqual(['send']);
    rerender(<VoicePane state="speaking" agent="perf" you={0} them={0.6} onAct={(a) => acts.push(a)} />);
    fireEvent.keyDown(pane, { key: ' ', timeStamp: 100 });
    act(() => {
      vi.advanceTimersByTime(HOLD_MS);
    });
    expect(acts).toEqual(['send', 'cut']);
    fireEvent.keyUp(pane, { key: ' ', timeStamp: 100 + HOLD_MS + 50 });
    fireEvent.click(screen.getByTestId('voice.btn.mute'));
    fireEvent.click(screen.getByTestId('voice.key.type'));
    expect(acts).toEqual(['send', 'cut', 'mute', 'type']);
    rerender(<VoicePane state="failed" agent="perf" fail="microphone permission denied" you={0} them={0} onAct={(a) => acts.push(a)} />);
    expect(screen.getByTestId('voice.words').textContent).toBe("▲ bise can't hear you: the mic is off for bise. System Settings › Privacy › Microphone");
    fireEvent.click(screen.getByTestId('voice.btn.settings'));
    expect(acts.at(-1)).toBe('settings');
    rerender(<VoicePane state="listening" agent="main" you={0} them={0} label="fn talks to bise again when you leave voice mode" onAct={(a) => acts.push(a)} />);
    expect(screen.getByTestId('voice.label').textContent).toBe('fn talks to bise again when you leave voice mode');
  });
});
