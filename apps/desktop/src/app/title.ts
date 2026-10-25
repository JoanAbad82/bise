// What the window's bar and title say (bise fait mac, page native-mac §6, mockup 1): the title is
// what he looks at, 13/600 ('perf', 'inbox'), its subtitle 13/400 text-2 says where it sits
// ('profiling the hub · acme': the agent's title, then its project), and the window's own title
// (macOS's Window menu, Mission Control) is that title, never 'bise' alone but on bise's own thread.
// Built on the crumb (side.ts crumbOf, crumbGoOf): the crumb's last part is the title, the earlier
// ones, nearest first, the subtitle, each still a way back where crumbGoOf gives one. Pure.
// Owner: nm-frame.
import type { Route } from './route';
import { crumbGoOf, crumbOf, type PlaceCrumb } from './side';

/** One part of the subtitle: its words, and where a click goes (none: plain). */
export interface SubPart {
  readonly c: string;
  readonly go?: Route;
}

export interface BarTitle {
  readonly title: string;
  readonly sub: readonly SubPart[];
}

/**
 * The bar's title and subtitle for a route. `what`: the thread's agent's own title ('profiling the
 * hub'), first in the subtitle. Pure.
 */
export function barTitleOf(route: Route, name: (project: string) => string, place: PlaceCrumb = () => [], what = ''): BarTitle {
  const crumb = crumbOf(route, name, place);
  const title = crumb[crumb.length - 1] ?? '';
  const earlier = crumbGoOf(route, name, place).reverse();
  const sub: SubPart[] = [...(what === '' ? [] : [{ c: what }]), ...earlier.map((p) => (p.go === undefined ? { c: p.c } : { c: p.c, go: p.go }))];
  return { title, sub };
}

/** The window's title: the bar's title (macOS shows it in the Window menu and Mission Control). Pure. */
export const windowTitleOf = (t: BarTitle): string => t.title;
