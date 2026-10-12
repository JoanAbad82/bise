// Type anywhere, it lands in the composer (the user, main m_16044: « quand je tape sur mon keyboard
// ou quand je paste quelque chose, ça sélectionne l'input tout seul », as Slack and Vibe Desktop do).
// The rules come from le-chat-web's src/app/(app)/chat/_hooks/use-auto-focus-message-input.ts:
// a one-character key, no ⌘/ctrl, not composing, not space, nothing input-like focused (input,
// textarea, contenteditable, role=textbox); a paste with nothing input-like focused, taken in the
// capture phase. Two changes: le-chat-web prevents the key and appends event.key; here the field
// takes the focus (caret at the end) and the key goes on to it, so a dead key (^ then e), an IME
// and the field's own handling work as if he had clicked first. And ⌥ letters are text on a Mac
// (⌥e é on a US layout, ⌥( { on a French one): kept, but ⌥ digits stay the window's (⌥0-9).
// Never taken: a key the window or a screen already took (they listen on window in the capture
// phase, this on document, so they run first and preventDefault), a picker, menu or dialog, a
// selection he made outside the field, arrows, esc, enter, tab, space.

/** The keyboard event's fields the rule reads (a DOM KeyboardEvent fits). */
export interface GrabKey {
  readonly key: string;
  readonly code: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly isComposing: boolean;
  readonly defaultPrevented: boolean;
}

/** A key that types text into the field once it has the focus. Pure. */
export function grabsKey(e: GrabKey): boolean {
  if (e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey)
    return false;
  // `key` is sometimes missing (le-chat-web); 'Dead' starts an accent, 'Process' an IME
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- see above
  const key = e.key ?? "";
  // one code point: 'é', '€', 'a' (a named key, 'Enter', 'ArrowUp', is longer)
  const text = /^.$/u.test(key) || key === "Dead" || key === "Process";
  if (!text || key === " ") return false;
  if (e.altKey && /^(Digit|Numpad)[0-9]$/.test(e.code)) return false;
  return true;
}

/** Focus is in something that takes text itself (le-chat-web's isInputElementFocused, plus select). */
export function editable(el: Element | null): boolean {
  if (el === null) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return el.getAttribute("role") === "textbox";
}

/** A picker, a menu or a dialog has the focus, or is open over the window. */
function overlaid(active: Element | null, field: HTMLElement): boolean {
  if (
    active?.closest(
      '[role="dialog"],[role="menu"],[role="menubar"],[role="listbox"],[aria-modal="true"]',
    ) != null
  )
    return true;
  const open = document.querySelector(
    '[role="dialog"],[role="menu"],[aria-modal="true"]',
  );
  return open !== null && !open.contains(field);
}

/** He selected words outside the field: a key never takes the focus away from them. */
function selectingOutside(field: HTMLElement): boolean {
  const s = document.getSelection();
  if (s === null || s.isCollapsed || s.toString() === "") return false;
  return s.anchorNode === null || !field.contains(s.anchorNode);
}

/** A field that takes keys and pastes made with nothing focused (PmField registers itself). */
export interface GrabField {
  readonly el: HTMLElement;
  /** focus, the caret at the end */
  readonly take: () => void;
  /** the paste, as if it had come to the field */
  readonly paste: (e: ClipboardEvent) => boolean;
  /** ctrl+r made outside any text field: the field's own ctrl+r (dictation, twice voice mode) */
  readonly ctrlR?: (e: KeyboardEvent) => boolean;
}

const fields: GrabField[] = [];

/** The field a stray key goes to: the newest one on screen. */
function target(): GrabField | undefined {
  for (let i = fields.length - 1; i >= 0; i--) {
    const f = fields[i];
    if (f === undefined) continue;
    if (
      f.el.isConnected &&
      f.el.getClientRects().length > 0 &&
      f.el.closest('[inert],[aria-hidden="true"]') === null
    )
      return f;
  }
  return undefined;
}

/** ctrl+r alone (dictation's key), as the field reads it. Pure. */
export function isCtrlR(e: GrabKey & { readonly shiftKey: boolean }): boolean {
  return (
    e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !e.shiftKey &&
    !e.defaultPrevented &&
    !e.isComposing &&
    e.key.toLowerCase() === "r"
  );
}

/** A sheet, a dialog or a menu is open or has the focus (a focused list is fine: ctrl+r is no list key). */
function sheetOver(active: Element | null, field: HTMLElement): boolean {
  if (
    active?.closest(
      '[role="dialog"],[role="alertdialog"],[role="menu"],[role="menubar"],[aria-modal="true"]',
    ) != null
  )
    return true;
  const open = document.querySelector(
    '[role="dialog"],[role="alertdialog"],[role="menu"],[aria-modal="true"]',
  );
  return open !== null && !open.contains(field);
}

/** ctrl+r anywhere in the window (the thread, the sidebar, a list): the composer takes the focus,
 *  its caret at the end, and dictation starts at once, the same press as in the field (a second
 *  one soon after is voice mode). Never from another text field or the terminal panel (xterm's
 *  textarea: the shell's reverse search), never under a sheet. His try a43609b2, ambient-lead m_19364. */
function onCtrlR(e: KeyboardEvent): boolean {
  if (!isCtrlR(e)) return false;
  const active = document.activeElement;
  if (editable(active)) return false;
  const f = target();
  if (f?.ctrlR === undefined || sheetOver(active, f.el)) return false;
  f.take();
  return f.ctrlR(e);
}

function onKey(e: KeyboardEvent): void {
  if (onCtrlR(e)) return;
  if (!grabsKey(e)) return;
  const active = document.activeElement;
  if (editable(active)) return;
  const f = target();
  if (
    f === undefined ||
    f.el.contains(active) ||
    overlaid(active, f.el) ||
    selectingOutside(f.el)
  )
    return;
  // no preventDefault: the key goes on to the field that has the focus now
  f.take();
}

function onPaste(e: ClipboardEvent): void {
  if (e.defaultPrevented) return;
  const active = document.activeElement;
  if (editable(active)) return;
  const f = target();
  if (f === undefined || f.el.contains(active) || overlaid(active, f.el))
    return;
  f.take();
  if (f.paste(e)) e.stopPropagation();
}

/** Registers a field; the returned function unregisters it. One listener pair for every field. */
export function registerGrab(f: GrabField): () => void {
  if (fields.length === 0) {
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("paste", onPaste, true);
  }
  fields.push(f);
  return () => {
    const i = fields.indexOf(f);
    if (i >= 0) fields.splice(i, 1);
    if (fields.length === 0) {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("paste", onPaste, true);
    }
  };
}
