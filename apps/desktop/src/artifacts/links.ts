// A link in the open artifact's page that names another artifact (art-links; architect m_26370):
// the shell's guard sees it (main's framelink.ts: an artifact:<id>[@vN], the pages server's
// /a/<id>/… or /p/<id>) and tells this window; the panel opens that artifact the way a click in
// the artifacts list does (useGoArtifact), at the version the link names. An id the hub doesn't
// know gets the open view's 'this artifact isn't in the list any more.', never a blank panel.
// A web link never comes here: the guard opens his browser. Owner: art-links.
import { useEffect } from 'react';
import type { ArtifactLink } from '@/shared/api';
import { useGoArtifact } from './leave';

// a link at a version (artifact:<id>@vN): the next open of that artifact shows it (one open, then it's spent)
let versionFor: { key: string; v: number } | null = null;
/** The next open of this artifact ('project/id') shows version `v`. */
export function openAtVersion(key: string, v: number): void {
  versionFor = { key, v };
}
/** The version the next open of 'project/id' shows, else null; spent. */
export function takeVersion(key: string): number | null {
  const v = versionFor?.key === key ? versionFor.v : null;
  versionFor = null;
  return v;
}

type LinkBridge = { onArtifactLink?: (l: (link: ArtifactLink) => void) => () => void };

/** While the open view shows an artifact of `project`: another artifact a link in it names opens in its place. */
export function useArtifactLinks(project: string): void {
  const go = useGoArtifact();
  useEffect(() => {
    const on = (globalThis as { bise?: LinkBridge }).bise?.onArtifactLink;
    if (on === undefined) return;
    return on((link) => {
      if (link.v !== undefined) openAtVersion(`${project}/${link.id}`, link.v);
      go(project, link.id);
    });
  }, [go, project]);
}
