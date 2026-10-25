// The rail (bise fait mac, page native-mac §6, mockup 1): always there, 56 wide, transparent on the
// window's vibrancy, under the bar. bise's ':*' (mono 15/600: its thread), inbox, scheduled,
// artifacts, plugins; settings at the bottom. Buttons 36 × 36 r 8, 4 apart, 8 from the top and 16
// from the bottom; the line icons 18 (ds AppIcon); the current place --c-active and --c-text, the
// others text-2; inbox's accent dot (8, at 6/6) only while something waits on him; each button a
// tip with its key. It replaces the old 'rail under 1200 px with an artifact open'. Owner: nm-frame.
import type { ReactNode } from 'react';
import { AppIcon, type AppIconName, Press } from '@/ds';
import { frame } from '@/proto/words_frame.gen';
import { panel } from '@/proto/words_panel.gen';
import type { Route } from './route';
import { useRoute, useRouter } from './router';
import { useWaitingTotal } from './Sidebar';
import { waitsTip } from './tipwords';

/** A rail place: the route it goes to and the key that does too. */
export type RailPlace = 'bise' | 'inbox' | 'scheduled' | 'artifacts' | 'plugins' | 'settings';

/** Which rail place a route sits in: the pages are theirs, every thread and project screen bise's. Pure. */
export function railPlaceOf(route: Route): RailPlace {
  switch (route.screen) {
    case 'inbox':
    case 'scheduled':
    case 'artifacts':
    case 'plugins':
    case 'settings':
      return route.screen;
    default:
      return 'bise';
  }
}

const GO: Record<RailPlace, Route> = {
  bise: { screen: 'bise' },
  inbox: { screen: 'inbox' },
  scheduled: { screen: 'scheduled' },
  artifacts: { screen: 'artifacts', project: '' },
  plugins: { screen: 'plugins' },
  settings: { screen: 'settings' },
};

/** Each place's key, shown in its tip ('' when it has none). */
export const RAIL_KEYS: Record<RailPlace, string> = { bise: '⌘0', inbox: '⌘I', scheduled: '', artifacts: '⌘⇧A', plugins: '', settings: '⌘,' };

const NAMES: Record<RailPlace, string> = {
  bise: panel.bise,
  inbox: panel.inbox,
  scheduled: panel.scheduled,
  artifacts: panel.artifacts,
  plugins: panel.plugins,
  settings: frame.settings,
};

/** A place's tip: its name and its key ('inbox · ⌘I'). Pure. */
export const railTip = (p: RailPlace): string => (RAIL_KEYS[p] === '' ? NAMES[p] : frame.tip_key({ what: NAMES[p], key: RAIL_KEYS[p] }));

function RailButton({ place, on, children, dot, tip }: { place: RailPlace; on: boolean; children: ReactNode; dot?: boolean; tip?: string }) {
  const router = useRouter();
  return (
    <Press
      look={on ? 'app-rail-b on' : 'app-rail-b'}
      aria-label={NAMES[place]}
      aria-current={on ? 'page' : undefined}
      data-tip={tip ?? railTip(place)}
      onClick={() => {
        router.go(GO[place]);
      }}
      data-testid={`app.rail.${place}`}
    >
      {children}
      {dot === true && <span className="app-rail-dot" data-testid={`app.rail.${place}.dot`} />}
    </Press>
  );
}

const ICON: Record<Exclude<RailPlace, 'bise'>, AppIconName> = {
  inbox: 'inbox',
  scheduled: 'scheduled',
  artifacts: 'artifacts',
  plugins: 'plugins',
  settings: 'settings',
};

export function SideRail() {
  const at = railPlaceOf(useRoute());
  const waits = useWaitingTotal();
  return (
    <nav className="app-rail" aria-label={frame.places} data-testid="app.rail">
      <RailButton place="bise" on={at === 'bise'}>
        <span className="app-rail-mark" aria-hidden="true">
          :*
        </span>
      </RailButton>
      {(['inbox', 'scheduled', 'artifacts', 'plugins'] as const).map((p) => (
        <RailButton key={p} place={p} on={at === p} {...(p === 'inbox' ? { dot: waits > 0, tip: waits > 0 ? `${railTip(p)} · ${waitsTip(waits, true)}` : railTip(p) } : {})}>
          <AppIcon name={ICON[p]} size={18} />
        </RailButton>
      ))}
      <span className="app-rail-gap" />
      <RailButton place="settings" on={at === 'settings'}>
        <AppIcon name="settings" size={18} />
      </RailButton>
    </nav>
  );
}
