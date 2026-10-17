// The app's edge for the store's machine (fast-try p4, architect m_29189/m_29867): the one place
// that runs its effects. The machine decides (store/machine/), this only executes: a window move
// (an artifact's view beside the thread, at its block) through the router, a window.bise call
// (typed from BiseApi, preload.ts's API) as the effect names it. Mounted once inside the router
// (App.tsx); a test mounts it the same way, or records the effects with store.onEffect.
// Owner: amb-core.
import { useEffect } from 'react';
import { openAtAnchor } from '@/artifacts/Open';
import { useStore } from '@/store';
import type { Effect, FxName } from '@/store/machine/types';
import type { BiseApi } from '@/shared/api';
import { useRouter, type Router } from './router';

/** Runs one effect: a move through `router`, a call on `bise` (none: a test with no window.bise). */
export function runEffect(e: Effect, router: Router, bise: Pick<BiseApi, FxName> | undefined): void {
  switch (e.out) {
    case 'nav':
      if (e.to.at !== null) openAtAnchor(`${e.to.project}/${e.to.artifact}`, e.to.at);
      router.go({ screen: 'artifacts', project: e.to.project, id: e.to.artifact });
      return;
    case 'fx':
      void bise?.[e.fx.fx](...e.fx.args);
      return;
  }
}

/** The edge, mounted inside the router: every effect of the store's machine runs here. */
export function StoreEdge(): null {
  const store = useStore();
  const router = useRouter();
  useEffect(
    () =>
      store.onEffect((e) => {
        runEffect(e, router, (globalThis as { bise?: BiseApi }).bise);
      }),
    [store, router],
  );
  return null;
}
