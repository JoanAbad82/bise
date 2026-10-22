// A message about an artifact (art-target): the lead his words carry when he writes in an open
// artifact's composer, `about [its title](its url): his words`, and how his bubble draws it back
// (about-chip, his « du markdown pas rendu correctement »): the lead's link is the artifact's chip
// (ArtName, a click opens it), never the markdown link nor its path. The text sent and stored is
// the lead as written; only the drawing changes. The terminal draws it the same
// (rust/tui/src/attach.rs about_lead). Owner: amb-win.
import type { Artifact, Part } from '@/proto';

/** A message about an artifact: `about [its title](its url): his words` (the chip's own link form). Pure. */
export function aboutText(a: { title: string; url: string }, text: string): string {
  return `about [${a.title.replace(/[[\]]/gu, '')}](${a.url}): ${text}`;
}

/** The same lead on typed parts: after his quotes (the hub renders them in front anyway), before his words. Pure. */
export function aboutParts(a: { title: string; url: string }, parts: readonly Part[]): Part[] {
  const lead: Part = { kind: 'text', text: aboutText(a, '') };
  const i = parts.findIndex((p) => p.kind !== 'quote');
  const at = i < 0 ? parts.length : i;
  const next = parts[at];
  // joined with his first words when they are words (parts as a composer makes them: adjacent texts joined)
  if (next?.kind === 'text') return [...parts.slice(0, at), { kind: 'text', text: lead.text + next.text }, ...parts.slice(at + 1)];
  return [...parts.slice(0, at), lead, ...parts.slice(at)];
}

/** What of an artifact names it by a link or a path. */
export type ArtUrls = Pick<Artifact, 'id' | 'url' | 'frame_url' | 'path' | 'target' | 'copy' | 'keys' | 'versions'>;

/** An artifact's url as a lead may hold it (any version's: a v2 copy after a v3 came) by its shape:
 *  the store's copy `…/artifacts/<id>/v<n>/…`, the page server's `/a/<id>/<n>/…` and `/p/<id>`. */
const SHAPE = /\/artifacts\/([^/]+)\/v\d+\/|\/a\/([^/]+)\/\d+\/|\/p\/([^/?#]+)\/?(?:[?#]|$)/u;

/** The artifact a lead's url names: one whose link or path (any version's) it is, else the id its
 *  shape names when the project has it; undefined for none. Pure. */
export function artOfUrl(url: string, arts: readonly ArtUrls[]): string | undefined {
  const exact = arts.find((a) => [a.url, a.frame_url, a.path, a.target, a.copy, ...(a.keys ?? []), ...(a.versions ?? []).flatMap((v) => [v.target, v.copy, v.frame_url])].includes(url));
  if (exact !== undefined) return exact.id;
  const m = SHAPE.exec(url);
  const id = m === null ? undefined : (m[1] ?? m[2] ?? m[3]);
  return id !== undefined && arts.some((a) => a.id === id) ? id : undefined;
}

/** The lead at the start of his words, after the chips of his quotes (aboutParts puts it there). */
const LEAD = /^((?:\uE000\d+\uE001[ \t]*)*)about \[([^[\]\n]*)\]\(/u;

/** A title as markdown words: its marks are letters. Pure. */
const mdWords = (s: string): string => s.replace(/[\\`*_~<>|!#]/gu, (c) => `\\${c}`);

/**
 * His words' markdown with the 'about' lead's link as the artifact's chip: `about [title](artifact:<id>): …`
 * (Markdown draws an `artifact:` link as ArtName), its title alone when no artifact of the project
 * is the url's; any other words come back as they were. Pure.
 */
export function aboutChipMd(md: string, arts: readonly ArtUrls[]): string {
  const m = LEAD.exec(md);
  if (m === null) return md;
  const from = m[0].length;
  // the url ends at the lead's own '): ' (a path may hold spaces and parens; the message may end there)
  const end = /\):(?=[ \t\n]|$)/u.exec(md.slice(from));
  if (end === null) return md;
  const url = md.slice(from, from + end.index);
  if (url.includes('\n')) return md;
  const id = artOfUrl(url, arts);
  const title = mdWords(m[2] ?? '');
  const name = id === undefined ? title : `[${title === '' ? mdWords(id) : title}](artifact:${id})`;
  return `${m[1] ?? ''}about ${name}:${md.slice(from + end.index + 2)}`;
}
