// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { keyAct, labelOf, pairsOf, spaceUp, stateOf, wordsOf, HOLD_MS, type Act } from './model';
import { VoicePane } from './VoicePane';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const k = (key: string) => ({ key, metaKey: false, ctrlKey: false, altKey: false });

describe('voice mode (ambient m_11632)', () => {
  it("the label, main as bise; the key line per state, the signed words", () => {
    expect(labelOf('perf')).toBe('you ⇄ perf · voice mode');
    expect(labelOf('main')).toBe('you ⇄ bise · voice mode');
    const line = (s: Parameters<typeof pairsOf>[0]) => pairsOf(s).map((p) => `${p.key} ${p.words}`).join('   ');
    expect(line('listening')).toBe("space send now   hold space i'm thinking   m mute   tab type   esc leave");
    expect(line('speaking')).toBe('hold space cut in   m mute   esc leave');
    expect(line('thinking')).toBe('m mute   esc leave');
    expect(line('muted')).toBe('m unmute   esc leave');
    expect(line('failed')).toBe('⏎ try again   tab type   esc leave');
    expect(stateOf('nope')).toBe('listening');
  });

  it('the words per state', () => {
    expect(wordsOf('hearing', 'why is it slow', null, null)).toEqual({ kind: 'heard', text: 'why is it slow' });
    expect(wordsOf('speaking', null, 'the cold bench', null)).toEqual({ kind: 'said', text: 'the cold bench' });
    expect(wordsOf('failed', null, null, 'the mic is busy.')).toEqual({ kind: 'failed', text: 'the mic is busy.' });
  });

  it('keys: esc leaves (back to voice while typing), m mutes, tab types, ⏎ retries a failure, space waits for its up', () => {
    expect(keyAct(k('Escape'), 'listening')).toBe('leave');
    expect(keyAct(k('Escape'), 'typing')).toBe('voice');
    expect(keyAct(k('m'), 'hearing')).toBe('mute');
    expect(keyAct(k('m'), 'muted')).toBe('unmute');
    expect(keyAct(k('Tab'), 'thinking')).toBeNull();
    expect(keyAct(k('Enter'), 'failed')).toBe('retry');
    expect(keyAct(k(' '), 'listening')).toBe('space');
    expect(keyAct(k(' '), 'thinking')).toBeNull();
    expect(spaceUp(100, 'hearing')).toBe('send');
    expect(spaceUp(HOLD_MS + 1, 'hearing')).toBeNull();
  });

  it('the pane: heard words, a tap of space sends, a hold while it speaks cuts in, a key pair clicks', () => {
    vi.useFakeTimers();
    const acts: Act[] = [];
    const { rerender } = render(<VoicePane state="hearing" agent="perf" heard="why is the cold bench slow" you={0.4} them={0} onAct={(a) => acts.push(a)} />);
    expect(screen.getByTestId('voice.label').textContent).toBe('you ⇄ perf · voice mode');
    expect(screen.getByTestId('voice.words').textContent).toContain('why is the cold bench slow');
    const pane = screen.getByTestId('voice.pane');
    fireEvent.keyDown(pane, { key: ' ', timeStamp: 10 });
    fireEvent.keyUp(pane, { key: ' ', timeStamp: 60 });
    expect(acts).toEqual(['send']);
    rerender(<VoicePane state="speaking" agent="perf" said="the cold bench" you={0} them={0.6} onAct={(a) => acts.push(a)} />);
    fireEvent.keyDown(pane, { key: ' ', timeStamp: 100 });
    act(() => {
      vi.advanceTimersByTime(HOLD_MS);
    });
    expect(acts).toEqual(['send', 'cut']);
    fireEvent.keyUp(pane, { key: ' ', timeStamp: 100 + HOLD_MS + 50 });
    fireEvent.click(screen.getByTestId('voice.key.mute'));
    expect(acts).toEqual(['send', 'cut', 'mute']);
    rerender(<VoicePane state="listening" agent="main" you={0} them={0} label="fn waits: voice mode is on here" onAct={(a) => acts.push(a)} />);
    expect(screen.getByTestId('voice.label').textContent).toBe('fn waits: voice mode is on here');
  });
});
