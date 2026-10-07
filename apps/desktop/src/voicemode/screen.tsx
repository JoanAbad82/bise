// Voice mode as the thread mounts it (ambient's spec m_11632): useVoiceHere says whether this
// thread's composer gives its place to the pane ('pane'), comes back under the typing line
// ('typing'), or stays ('off'); ThreadVoice draws the pane fed by the store (useVoiceMode, the
// levels) and runs its acts (store.voiceMute / voiceType / voiceSend / voiceCut / voiceMode).
// While it is on here, fn's talk is refused by the core (its error on talk_start): the label line
// says 'fn waits: voice mode is on here' for 3 s. Owner: amb-home.
import { useEffect, useState } from 'react';
import { useLevel, useStore, useVoiceMode } from '@/store';
import { VoicePane } from './VoicePane';
import { FN_WAITS, FN_WAITS_MS, stateOf, type Act } from './model';

export type VoiceHere = 'off' | 'pane' | 'typing';

/** Voice mode on this agent's thread: the pane, the composer back while he types, or off. */
export function useVoiceHere(project: string, agent: string): VoiceHere {
  const v = useVoiceMode();
  if (v === null || !v.on || v.project !== project || v.agent !== agent) return 'off';
  return v.state === 'typing' ? 'typing' : 'pane';
}

/** The pane in the composer's place (or, while he types, the line over the composer). */
export function ThreadVoice({ project, agent }: { project: string; agent: string }) {
  const store = useStore();
  const v = useVoiceMode();
  const you = useLevel('you');
  const them = useLevel('agent');
  const [waits, setWaits] = useState(false);
  const here = v !== null && v.on && v.project === project && v.agent === agent;

  // fn pressed while it is on: the core refuses the talk; the label says so for 3 s
  useEffect(() => {
    if (!here) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const off = store.onEvent((ev) => {
      if (ev.ev !== 'error' || !('cmd' in ev) || ev.cmd !== 'talk_start') return;
      setWaits(true);
      if (t !== null) clearTimeout(t);
      t = setTimeout(() => {
        setWaits(false);
      }, FN_WAITS_MS);
    });
    return () => {
      off();
      if (t !== null) clearTimeout(t);
    };
  }, [store, here]);

  if (!here) return null;
  const state = stateOf(v.state);
  if (state === 'typing') {
    return (
      <p className="vm-typing" data-testid="voice.typing">
        {waits ? FN_WAITS : 'typing: the mic waits · esc back to voice'}
      </p>
    );
  }
  const act = (a: Act) => {
    switch (a) {
      case 'send':
        store.voiceSend();
        return;
      case 'cut':
        store.voiceCut();
        return;
      case 'mute':
        store.voiceMute(true);
        return;
      case 'unmute':
        store.voiceMute(false);
        return;
      case 'type':
        store.voiceType(true);
        return;
      case 'voice':
        store.voiceType(false);
        return;
      case 'leave':
        store.voiceMode(project, agent, false);
        return;
      case 'retry':
        store.voiceMode(project, agent, true);
        return;
      case 'think':
        // a hold while it is his turn: the core waits (no send); nothing to tell it
        return;
    }
  };
  return (
    <VoicePane
      state={state}
      agent={agent}
      heard={v.heard ?? null}
      said={v.said ?? null}
      fail={v.fail ?? null}
      you={you}
      them={them}
      label={waits ? FN_WAITS : null}
      onAct={act}
    />
  );
}
