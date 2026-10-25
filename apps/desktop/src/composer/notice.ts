// The composer's one-off notice (Composer `line`, his m_29126: a refused '/bime' stayed in a box
// under the composer for many messages and pushed it up; designer m_29135), shown at the right of
// the context strip since the key bar went (bise fait mac): its words in sans, its commands and
// paths in mono, cut after a whole word with one glued '…'; and the keys that end it. Pure.
// Owner: nm-composer.

/** A notice: an error ('✗' in the error color) or a note ('·'), words text-2. */
export interface Notice {
  readonly level: "err" | "info";
  readonly text: string;
  /** its test id (the screen's: what said it) */
  readonly testId: string;
}

/** A run of the line's words: `mono` for a command ('/bime') or a path ('src/a.ts', '~/x'). */
export interface Run {
  readonly text: string;
  readonly mono: boolean;
}

// a word that is a command or a path: '/word…', '~/…', or a relative file 'src/a.ts' (a '/' inside,
// an extension at its end: 'and/or' stays a word)
const CODE = /^(?:\/[\w./-]*[\w-]|~\/\S*|[\w.-]+\/[\w./-]*\.\w+)$/u;

/** The line's runs, in order, spaces kept: a command or a path alone in mono (its trailing ')' ',' '.' not). */
export function monoRuns(text: string): Run[] {
  const out: Run[] = [];
  const push = (t: string, mono: boolean) => {
    if (t === "") return;
    const last = out.at(-1);
    if (last !== undefined && last.mono === mono) out[out.length - 1] = { text: last.text + t, mono };
    else out.push({ text: t, mono });
  };
  for (const part of text.split(/(\s+)/u)) {
    // its wrapping punctuation stays in the words: '(see', '/help', ')'
    const m = /^([("'“]*)(.*?)([)"'”,.;:!?]*)$/u.exec(part);
    const [lead, core, tail] = m === null ? ["", part, ""] : [m[1] ?? "", m[2] ?? "", m[3] ?? ""];
    if (core !== "" && CODE.test(core)) {
      push(lead, false);
      push(core, true);
      push(tail, false);
    } else push(part, false);
  }
  return out;
}

/** A key that ends the line: any but a lone modifier (⌘ held to look at the keys keeps it). */
export function endsLine(key: string): boolean {
  return key !== "Shift" && key !== "Control" && key !== "Alt" && key !== "Meta" && key !== "CapsLock" && key !== "Fn";
}
