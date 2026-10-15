// src/ds · what a ds component may hold (architect m_26213): its own layout and view state, through
// hooks.ts only, and never the app. check.mjs runs it on src/ds; purity.test.ts shows it goes red.
// Pure: file name → source (comments stripped) in, faults out.

/** The only file of src/ds that may call React's state and effect hooks or watch sizes. */
export const HOOKS_FILE = "hooks.ts";

/** One named exception, its reason, and who removes it (no other may come). */
export const EXCEPTIONS = {
  // TODO(menus-ds): move Picker's state and effects onto hooks.ts (usePickerList), then drop this line
  "picker.tsx": "the Picker's list state, in the middle of menus-ds's rework",
};

const STATE = ["useState", "useEffect", "useLayoutEffect", "useReducer", "useSyncExternalStore", "ResizeObserver"];
const REWRITE = ["innerHTML", "dangerouslySetInnerHTML"];
/** What reaches the app: its store, screens, threads, the IPC bridge. */
const APP = [/from\s+["']@\/(?:store|app|thread|main)\b/u, /from\s+["'](?:\.\.\/)+(?:store|app|thread|main)\b/u, /\bwindow\.bise\b/u, /\bipcRenderer\b/u];

/** The faults of src/ds's sources: one line each, '' none. */
export function purityFaults(files) {
  const out = [];
  for (const [f, s] of Object.entries(files)) {
    for (const re of APP) {
      const m = re.exec(s);
      if (m) out.push(`${f} reaches the app: ${m[0]}`);
    }
    for (const bad of REWRITE) if (s.includes(bad)) out.push(`${f} rewrites the DOM: ${bad}`);
    if (f === HOOKS_FILE || f in EXCEPTIONS) continue;
    for (const bad of STATE) if (new RegExp(`\\b${bad}\\b`, "u").test(s)) out.push(`${f} uses ${bad} outside ${HOOKS_FILE}`);
    const dom = s.match(/\b(?:window|document)\.\w/u);
    if (dom) out.push(`${f} reaches the DOM: ${dom[0]}`);
  }
  return out;
}
