// Whether a digit typed in bise's window may pick in a card bise pushed (lead m_14146): only when
// he isn't writing, the TUI's rule (a digit picks over an empty composer). Pure over the few DOM
// parts it reads, so it runs in the preload and in tests without the DOM library.

interface FieldLike {
  readonly isContentEditable?: boolean;
  readonly value?: unknown;
  readonly textContent?: string | null;
  readonly tagName?: string;
  querySelector?(sel: string): unknown;
}

/**
 * True when nothing he types would land in a field: no element focused, a non-field focused, an
 * empty input or textarea, or an empty editable (no text, no chip or image in it).
 */
export function emptyField(el: unknown): boolean {
  if (typeof el !== 'object' || el === null) return true;
  const f = el as FieldLike;
  const tag = (f.tagName ?? '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA') return typeof f.value !== 'string' || f.value.trim() === '';
  if (f.isContentEditable !== true) return true;
  if ((f.textContent ?? '').trim() !== '') return false;
  return (f.querySelector?.('img, [data-kind]') ?? null) === null;
}
