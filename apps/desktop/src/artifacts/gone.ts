// An artifact opened by id that the project's list doesn't have (a deleted page, an old link, a
// typo in a notification's --open): the centre is never blank, it shows the project's main, and
// the panel says so with a way on (designer m_46415, ui-review m_46410 (b)): 'this artifact isn't
// in the list any more.', then 'it may be archived · show archived ›' when the project has archived
// artifacts, else 'open the library ›'. Before the project's list came, both wait. Pure: the
// route's centre (app/ArtifactView.tsx) and the panel's view (Open.tsx) read it. Owner: notif-sidebar.
import type { Route } from '@/app/route';

/** What the centre shows beside an artifact's tab: its maker's thread, the project's main (the artifact is gone), or nothing yet. */
export type ArtCentre = { readonly c: 'maker'; readonly agent: string } | { readonly c: 'main' } | { readonly c: 'wait' };

/** `came`: the project's list came (store.artifactsCame); `a`: the artifact in it, if any. */
export function centreOf(came: boolean, a: { readonly agent: string } | undefined): ArtCentre {
  if (a !== undefined) return { c: 'maker', agent: a.agent };
  return came ? { c: 'main' } : { c: 'wait' };
}

/** Where the gone panel's link goes: the library's archived list when the project has any, else the library. */
export type GoneLink = 'archived' | 'library';

export function goneLinkOf(listed: readonly { readonly archived_at?: number | null }[]): GoneLink {
  return listed.some((a) => a.archived_at != null) ? 'archived' : 'library';
}

/** The route the link opens: the project's library, at its archived place for 'archived'. */
export function goneRoute(project: string, link: GoneLink): Route {
  return link === 'archived' ? { screen: 'artifacts', project, at: 'archived' } : { screen: 'artifacts', project };
}
