// A md or txt card's picture, drawn from its text (artifacts-gallery v7, `kinds`: « its title and
// first lines, drawn from the text, sharp in both themes »): its title and first lines as plain
// words, the markdown marks left out. Never Quick Look (it draws them dark and tiny). Pure.
// Owner: art-thumbs.

/** What the card draws: a title (maybe '') and up to `max` lines. */
export interface TextThumb {
  readonly title: string;
  readonly lines: readonly string[];
}

/** One line's words without its markdown marks ('- **a** [b](c)' → 'a b'). Pure. */
export function plainLine(line: string): string {
  return line
    .replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/u, '')
    .replace(/^\s{0,3}>\s?/u, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/(\*\*|__|~~)(.+?)\1/gu, '$2')
    .replace(/(^|[^\w*])[*_](\S(?:.*?\S)?)[*_](?=[^\w*]|$)/gu, '$1$2')
    .replace(/`([^`]*)`/gu, '$1')
    .replace(/<[^>]+>/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

const HEADING = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/u;
const RULE = /^\s{0,3}(?:[-*_]\s*){3,}$/u;
const FENCE = /^\s{0,3}(```|~~~)/u;
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/u;

/**
 * The title and first lines of a text: a md's first heading (or a front matter's `title:`) is the
 * title; for a txt, or a md without one, its first line. Fences, rules, table rules, html comments
 * and blank lines are left out; a table row reads as its cells. Pure.
 */
export function textThumb(src: string, isMd: boolean, max = 8): TextThumb {
  let rows = src.replace(/\r\n?/gu, '\n').split('\n');
  let title = '';
  if (isMd && rows[0]?.trim() === '---') {
    const end = rows.findIndex((r, i) => i > 0 && r.trim() === '---');
    if (end > 0) {
      const t = rows.slice(1, end).find((r) => /^title\s*:/iu.test(r));
      if (t !== undefined) title = t.replace(/^title\s*:\s*/iu, '').replace(/^["']|["']$/gu, '').trim();
      rows = rows.slice(end + 1);
    }
  }
  const lines: string[] = [];
  let fenced = false;
  let comment = false;
  for (const raw of rows) {
    if (lines.length >= max) break;
    if (isMd) {
      if (FENCE.test(raw)) {
        fenced = !fenced;
        continue;
      }
      if (fenced) continue;
      if (comment || raw.trimStart().startsWith('<!--')) {
        comment = !raw.includes('-->');
        continue;
      }
      if (RULE.test(raw) || TABLE_RULE.test(raw)) continue;
      const h = HEADING.exec(raw);
      if (h !== null) {
        const words = plainLine(h[1] ?? '');
        if (title === '' && lines.length === 0) title = words;
        else if (words !== '') lines.push(words);
        continue;
      }
    }
    const cells = isMd && raw.trim().startsWith('|') ? raw.split('|').map((c) => c.trim()).filter((c) => c !== '').join(' ') : raw;
    const words = isMd ? plainLine(cells) : cells.replace(/\s+/gu, ' ').trim();
    if (words === '') continue;
    if (title === '' && lines.length === 0 && !isMd) title = words;
    else lines.push(words);
  }
  return { title, lines };
}
