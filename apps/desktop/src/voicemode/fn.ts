// fn fn with bise's window in front: voice mode in this window (amb-mac's dba197c7 sends it here,
// window.bise.onFnVoice, instead of the capsule's hands-free talk; agreed m_16983/m_16984).
// A thread in view: it toggles voice mode with its agent like ctrl+r twice (on with another agent
// moves it here, on with this one ends it). No thread in view (home, settings, artifacts...): bise's
// own thread opens and voice mode starts there. Owner: amb-web.
import { useEffect } from 'react';
import type { Route } from '@/app/route';
import type { Router } from '@/app/router';
import type { Store, VoiceModeState } from '@/store';

/** What fn fn does on this route: where to go first (if anywhere) and the voice mode command. */
export interface FnVoice {
  readonly go?: Route;
  readonly project: string;
  readonly agent: string;
  readonly on: boolean;
}

/** Pure: fn fn on `route`, with bise's home project (undefined until the core says it) and voice
 *  mode as it is now. Null: no thread in view and no home known yet, so nothing to talk to. */
export function fnVoiceOf(route: Route, home: string | undefined, v: VoiceModeState | null): FnVoice | null {
  const at = route.screen === 'thread' ? { project: route.project, agent: route.agent } : route.screen === 'bise' && home !== undefined ? { project: home, agent: 'main' } : null;
  if (at === null) return home === undefined ? null : { go: { screen: 'bise' }, project: home, agent: 'main', on: true };
  const here = v !== null && v.on && v.project === at.project && v.agent === at.agent;
  return { ...at, on: !here };
}

/** In the shell: fn fn from the native side runs fnVoiceOf on the route he is on. */
export function useFnVoice(router: Router, store: Store): void {
  useEffect(() => {
    // the page outside Electron (a component test) has no preload
    const bise = (window as Partial<Window>).bise;
    if (bise === undefined) return;
    return bise.onFnVoice(() => {
      const d = fnVoiceOf(router.get(), store.projects().find((p) => p.home)?.project, store.voiceModeNow());
      if (d === null) return;
      if (d.go !== undefined) router.go(d.go);
      store.voiceMode(d.project, d.agent, d.on);
    });
  }, [router, store]);
}
