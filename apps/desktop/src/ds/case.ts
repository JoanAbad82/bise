// src/ds · the desktop's chrome casing (designer m_43052, native-lead m_43057): a nav row, a section
// head, a tab name, a button, a menu item in sentence case ('Waiting', 'Run now'); bise's own words
// (states, counts, sentences, placeholders) stay lowercase. A word the TUI reads too keeps its
// lowercase in the words and goes through sentenceCase where the desktop draws it as chrome.

/** A chrome label's sentence case: its first letter up ('run now' → 'Run now'). Pure. */
export const sentenceCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
