// The spotlight's words, as ambient signed them for the old web capsule (its words.js `spot`,
// m_9164, m_9196). Pure.

export const W = {
  ph: 'ask bise, or find an agent',
  to: 'to bise',
  holdFn: 'hold fn to talk',
  waiting: 'waiting for you',
  atWork: 'at work',
  envs: 'environments',
  found: 'found',
  askBise: 'ask bise',
  openInBise: 'open in bise',
  close: 'close',
  inFront: (what: string): string => (what ? `in front: ${what}` : 'in front'),
  envSub: (branch: string, n: number): string => `${branch} · ${n} agent${n === 1 ? '' : 's'}`,
  sendQ: (q: string): string => `send “${q}” to bise`,
  keysEmpty: '⏎ open in bise   esc close',
  keysAsk: '⏎ send to bise   ↑↓ move   esc close',
  answerMore: 'the rest in bise   ⏎ open',
  // the routing hold (bar ⛔3, lead m_9855): bise picked the project, he has 2 s to change it;
  // the same words as the thread's hold (lead m_11564, e298b066: main is 'bise')
  routeTo: (name: string, s: number): string => (s > 0 ? `→ bise · ${name} · ${s} s to change` : `→ bise · ${name} · sending`),
  keepWithBise: 'keep it with bise',
  anotherProject: 'another project',
  keysRoute: 'esc keep it with bise   ↑↓ ⏎ another project',
  // A.1: '/new …' or 'start an agent: …' starts an agent in bise's home with that brief
  startAgent: 'start an agent',
  keysNew: '⏎ start it   esc close',
} as const;

/**
 * The brief of '/new <brief>' or 'start an agent: <brief>' (the colon optional, any case), else
 * undefined: the TUI's /new with its brief, typed in the spotlight (bar A.1). Pure.
 */
export function newBrief(q: string): string | undefined {
  const m = /^\s*(?:\/new|start an agent\s*:?)(?:\s+|$)([\s\S]*)$/iu.exec(q);
  if (m === null) return undefined;
  const brief = (m[1] ?? '').trim();
  return brief === '' ? undefined : brief;
}

/** One line of text: tags out, whitespace runs as one space, cut at a word past `max` with `…`. */
export function oneLine(text: string, max = 90): string {
  const t = text.replace(/<\/?[a-z][\w-]*(?:\s[^<>]*)?\/?>/giu, ' ').replace(/\s+/gu, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1).replace(/\s+\S*$/u, '').replace(/[\s·,;:]+$/u, '');
  return `${cut === '' ? t.slice(0, max - 1) : cut}…`;
}

/**
 * An approval's row (ambient m_9164): its first line, then what the second adds without the names
 * the first already said ('tryme is ready to try · 1 commit · +3 −0'), cut with … past max.
 */
export function cardLine(text: string, max = 64): string {
  const lines = text.split('\n').map((l) => oneLine(l, 400)).filter((l) => l !== '');
  const [head, next] = lines;
  if (head === undefined) return '';
  const toks = (l: string): string[] => l.split(/\s+/u).filter((x) => x !== '');
  const key = (t: string): string => t.toLowerCase().replace(/[^\p{L}\p{N}_./-]/gu, '');
  const named = new Set(toks(head).filter((t, i) => i === 0 || /[-_./\d]/u.test(t)).map(key).filter((k) => k !== ''));
  const out: string[] = [];
  for (const t of toks(next ?? '')) {
    if (named.has(key(t))) {
      if (/^(on|in|at|of|for|to|from)$/iu.test(out.at(-1) ?? '')) out.pop();
      continue;
    }
    out.push(t);
  }
  const second = out.join(' ').replace(/·(\s*·)+/gu, '·').replace(/^[\s·]+|[\s·]+$/gu, '');
  const s = [head, second].filter((x) => x !== '').join(' · ');
  return s.length > max ? `${s.slice(0, max - 1).replace(/\s+\S*$/u, '').replace(/[\s·]+$/u, '')}…` : s;
}

/** A path as he reads it: his home as ~, a long one cut in the middle keeping the last folders. */
export function shortPath(p: string, max = 32): string {
  const s = p.replace(/^\/(?:Users|home)\/[^/]+(?=\/|$)/u, '~');
  if (s.length <= max) return s;
  const parts = s.split('/');
  const head = parts[0] ?? '';
  let tail = parts.at(-1) ?? '';
  for (let i = parts.length - 2; i > 0 && `${head}/…/${parts[i] ?? ''}/${tail}`.length <= max; i -= 1) tail = `${parts[i] ?? ''}/${tail}`;
  return `${head}/…/${tail}`;
}

/** The host of a URL, or ''. */
export const hostOf = (url: string): string => /^[a-z]+:\/\/([^/:]+)/iu.exec(url)?.[1] ?? '';

/** Words of a text, lowercase, letters and digits (and _ -). */
export const words = (s: string): string[] => s.toLowerCase().split(/[^\p{L}\p{N}_-]+/u).filter((w) => w !== '');
