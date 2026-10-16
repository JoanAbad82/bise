// What a notification is about (card-links, architect m_27431): one link for
// any artifact, a page or a site or a file, drawn as one chip ('↗ <title> ·
// <kind> · v<n>') and opened the way an artifact chip opens (the act an
// option's --open takes, optAct.ts). The hub's `artifact`; an older hub sends
// a page's `page` alone, read here as the same link. Pure. Owner: amb-home.
import type { Card, OptAct } from '@/proto';
import type { ArtLink, CardPage } from '@/proto/rows';
import { inbox } from '@/proto/words_inbox.gen';

/** A page's link as an artifact link: kind page, its item or block as the anchor. */
export function pageLink(p: CardPage): ArtLink {
  const at = p.item ?? p.block ?? null;
  return { id: p.id, kind: 'page', title: p.title ?? p.id, v: p.v ?? null, url: p.url === '' ? null : p.url, at: at == null ? null : { kind: 'block', block: at } };
}

/** What the card is about, or null: no link. */
export function aboutOf(c: Pick<Card, 'artifact' | 'page'>): ArtLink | null {
  if (c.artifact != null) return c.artifact;
  return c.page != null ? pageLink(c.page) : null;
}

/** The block or item it opens at on a page; null for any other anchor. */
export function blockOf(a: ArtLink): string | null {
  return a.at != null && a.at.kind === 'block' ? a.at.block : null;
}

/** Its kind as the chip says it, the artifacts list's words (designer m_27435): 'deck' for slides,
 * 'file' for none, 'PR', else the kind (bise_proto ArtLink::kind_word). */
export function kindWord(kind: string): string {
  if (kind === 'page') return inbox.page_noun;
  if (kind === 'slides') return 'deck';
  if (kind === '') return 'file';
  return kind.toLowerCase() === 'pr' ? 'PR' : kind;
}

/** The chip's words: '<title>' and '<kind> · v4'; a link has no version to him: 'link' alone. */
export function aboutWords(a: ArtLink): { title: string; meta: string } {
  const v = a.v == null || a.kind === 'link' ? '' : `v${String(a.v)}`;
  return { title: a.title !== '' ? a.title : a.id, meta: [kindWord(a.kind), v].filter(Boolean).join(' · ') };
}

/** The act that opens it: in the app beside the thread at its block, else its url. */
export function openAct(a: ArtLink): OptAct {
  return { act: 'open', artifact: a.id, at: blockOf(a), url: a.url ?? null };
}
