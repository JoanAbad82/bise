// A link pasted over selected words keeps them as its label: [words](url) (Benjamin's ask, Gabriel
// « Oui ! », page ben-feedback), as Slack, Notion and GitHub do. Only one http(s) URL over a
// selection of words on one line; anything else pastes as before (paste.ts). The TUI's
// paste_link.rs keeps the same rule; both read rust/proto/fixtures/paste_link.json.

/** The text that replaces the selection, and the caret's offset in it (UTF-16, after the ')'). */
export interface LinkPaste {
  readonly text: string;
  readonly caret: number;
}

/** One http(s) URL with a host, nothing around it but blanks; no whitespace, no '<' or '>'. */
const URL_RE = /^https?:\/\/[^\s/?#<>]+[^\s<>]*$/iu;

const isUrl = (s: string): boolean => URL_RE.test(s);

/** Every '(' closed in order: a destination markdown reads bare; else it goes in <...>. */
function balanced(url: string): boolean {
  let depth = 0;
  for (const c of url) {
    if (c === "(") depth++;
    else if (c === ")" && --depth < 0) return false;
  }
  return depth === 0;
}

/** `[selected](pasted)` when `pasted` is one URL and `selected` words on one line, not a URL
 *  themselves; the spaces and tabs around the words stay outside the link. Null: paste as before.
 *  Pure. */
export function linkPaste(selected: string, pasted: string): LinkPaste | null {
  const url = pasted.trim();
  if (!isUrl(url)) return null;
  if (selected.includes("\n") || selected.includes("\r")) return null;
  const words = selected.replace(/^[ \t]+|[ \t]+$/gu, "");
  if (words === "" || isUrl(words)) return null;
  const lead = selected.slice(0, selected.indexOf(words));
  const trail = selected.slice(lead.length + words.length);
  const label = words.replace(/[\\[\]]/gu, (c) => `\\${c}`);
  const dest = balanced(url) ? url : `<${url}>`;
  const link = `${lead}[${label}](${dest})`;
  return { text: link + trail, caret: link.length };
}
