// Where the driver writes the files its words carry (long-reply.md, code-reply.md, file-chips,
// attach37, rows25), and the check that their path names no world project (regress-25e5).
// bise's home hub routes his words by name (rust/switchboard/src/route.rs, 'named', 0.85): a path
// like ~/.bise/hubs/harness-3abb2bd8/agents/<a>/tmp/full/long-reply.md names 'harness' (a '/' and a
// '-' are word ends), so 'a long one please [[reply: <that path>]]' typed in bise's thread went to
// harness' main and came back folded (try-gate-25e5's runs, out dir under that agent's tmp; 37fb's
// out dir was ~/.bise/gate/real-shape/cand-37fb: green). Pure, no I/O.
import path from 'node:path';

/** `name` in `text` as a whole word, as route.rs names_in reads it (lowercase; a letter, a digit
 *  or '_' next to it makes it part of another word). */
export function namesIn(text: string, name: string) {
  const t = text.toLowerCase();
  const n = name.toLowerCase();
  if (n.length === 0) return false;
  const word = (ch: string | undefined) => ch !== undefined && /[\p{L}\p{N}_]/u.test(ch);
  for (let i = t.indexOf(n); i >= 0; i = t.indexOf(n, i + 1)) {
    if (!word(t[i - 1]) && !word(t[i + n.length])) return true;
  }
  return false;
}

/** The world projects' names (3+ characters, as route.rs names_of) that `dir` names. */
export function named(dir: string, names: string[]) {
  return names.filter((n) => n.length >= 3 && namesIn(dir, n));
}

/** The folder for the files the words carry: AS_HE_DOES_FX when set (cand.sh and run.sh put it
 *  under the world, ~/.bise/gate/real-shape/fx), else <out>. */
export function fxDir(out: string, env: NodeJS.ProcessEnv) {
  const fx = env.AS_HE_DOES_FX;
  return fx ? path.resolve(fx) : out;
}
