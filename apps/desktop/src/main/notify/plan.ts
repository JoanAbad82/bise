// macOS notifications for the questions bise asks (the user's decision 2026-10-09, card #476: « b +
// la notification native ... Pas de notification nécessaire si j'étais focused sur l'app au moment de
// la réception »; page inbox-native v2; designer m_14211's words). Pure: which cards are new, whether
// one knocks, what its notification says and offers, what a button or a reply answers. The shell is
// run.ts. Owner: amb-mac.
import type { Card } from '../../proto';

/** The words, en and fr (designer m_14211). */
export const WORDS = {
  en: {
    asks: 'asks',
    open: 'open in bise',
    reply: 'Reply',
    placeholder: 'your answer',
    send: 'Send',
    later: 'later',
    failed: (who: string) => `couldn't send your answer to ${who}. it's still in bise's inbox.`,
  },
  fr: {
    asks: 'demande',
    open: 'ouvrir dans bise',
    reply: 'Répondre',
    placeholder: 'ta réponse',
    send: 'Envoyer',
    later: 'plus tard',
    failed: (who: string) => `ta réponse à ${who} n'est pas partie. elle t'attend dans l'inbox de bise.`,
  },
} as const;
export type Lang = keyof typeof WORDS;

/** His language from the system's preferred languages: fr when the first is French, else en. */
export function langOf(preferred: readonly string[]): Lang {
  return (preferred[0] ?? '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

/** A choice longer than this, or more than MAX_CHOICES: the menu only opens it in bise. */
export const MAX_CHOICE = 40;
export const MAX_CHOICES = 4;

/** What one notification shows and offers. */
export type Note = {
  /** project#id: the card it stands for */
  readonly key: string;
  readonly project: string;
  readonly card: number;
  readonly title: string;
  readonly body: string;
  /** the buttons, in order: the card's choices, then 'open in bise' for a question */
  readonly actions: readonly string[];
  /** the card option each button answers, null for 'open in bise' */
  readonly picks: readonly (number | null)[];
  /** a question takes typed words; an approval never does */
  readonly reply: boolean;
  readonly placeholder: string;
  /** a quiet moment: no sound, straight to Notification Center */
  readonly silent: boolean;
  /** group: the project */
  readonly group: string;
};

/** A project's facts the title needs (from the core's projects rows). */
export type Place = { readonly name: string; readonly home: boolean };

export const cardKey = (project: string, id: number): string => `${project}#${id}`;

/** '<agent> asks · <project>': main speaks as bise; an agent of bise's home names no project. */
export function titleOf(c: Card, place: Place | undefined, lang: Lang): string {
  const who = c.agent === 'main' || c.agent === '' ? 'bise' : c.agent;
  const where = place === undefined || place.home ? '' : ` · ${place.name}`;
  return `${who} ${WORDS[lang].asks}${where}`;
}

/** The notification for a card (designer m_14211). */
export function noteOf(c: Card, place: Place | undefined, lang: Lang, quiet: boolean): Note {
  const w = WORDS[lang];
  const approval = c.approval === true;
  const fits = c.options.length >= 1 && c.options.length <= MAX_CHOICES && c.options.every((o) => o.label.length <= MAX_CHOICE);
  let actions: string[];
  let picks: (number | null)[];
  if (approval) {
    // its option words as the buttons; the click on the banner opens it, no 'open in bise'
    actions = c.options.map((o) => o.label);
    picks = c.options.map((o) => o.n);
  } else if (fits) {
    actions = [...c.options.map((o) => o.label), w.open];
    picks = [...c.options.map((o) => o.n), null];
  } else {
    actions = [w.open];
    picks = [null];
  }
  return {
    key: cardKey(c.project, c.id),
    project: c.project,
    card: c.id,
    title: titleOf(c, place, lang),
    body: c.question,
    actions,
    picks,
    reply: !approval,
    placeholder: w.placeholder,
    silent: quiet,
    group: c.project,
  };
}

/** What his gesture on a notification does. */
export type Gesture = { readonly action: number } | { readonly reply: string } | { readonly click: true };
export type Effect =
  | { readonly t: 'answer'; readonly cmd: { cmd: 'answer'; project: string; card: number; reply: string } }
  | { readonly t: 'open'; readonly route: string }
  | { readonly t: 'none' };

/** A button answers with its option (as 1-4 in the window), a reply with his words, the rest opens the inbox. */
export function effectOf(n: Note, g: Gesture): Effect {
  const open: Effect = { t: 'open', route: 'inbox' };
  if ('click' in g) return open;
  if ('reply' in g) {
    const words = g.reply.trim();
    if (!n.reply || words === '') return { t: 'none' };
    return { t: 'answer', cmd: { cmd: 'answer', project: n.project, card: n.card, reply: words } };
  }
  const pick = n.picks[g.action];
  if (pick === undefined) return { t: 'none' };
  if (pick === null) return open;
  return { t: 'answer', cmd: { cmd: 'answer', project: n.project, card: n.card, reply: String(pick) } };
}

/**
 * The cards of every project, as the core says them: a project's first list is what already
 * waited (no knock), every later card is new; a card gone from its list was answered (anywhere:
 * the window, the terminal, a notification) and its notification goes.
 */
export class Arrivals {
  private readonly open = new Map<string, Set<string>>();

  /** One project's open cards now: the new ones and the keys that left. */
  apply(project: string, cards: readonly Card[]): { readonly fresh: Card[]; readonly gone: string[] } {
    const now = new Set(cards.map((c) => cardKey(project, c.id)));
    const before = this.open.get(project);
    this.open.set(project, now);
    if (before === undefined) return { fresh: [], gone: [] };
    return {
      fresh: cards.filter((c) => !before.has(cardKey(project, c.id))),
      gone: [...before].filter((k) => !now.has(k)),
    };
  }
}

/** Whether a new card knocks: only when no bise window had the keys at its arrival. */
export const knocks = (focused: boolean): boolean => !focused;
