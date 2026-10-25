// src/ds · the app's line icons (bise fait mac, page native-mac §6: « une famille au trait 1.5,
// type Lucide, proche de SF Symbols »): one family for the rail, the bar, the launcher, the menus
// and the composer's context, drawn on a 24 grid, shown at 18 (the rail), 16 (everywhere) or 14
// (in text and tabs), the stroke 1.5 px at every size (non-scaling), in currentColor. No Unicode
// glyph as an icon anywhere (⊞ ◷ ↗ ✓ ▯ ─): AppIcon. An artifact's kind keeps its own family
// (icons.tsx KindIcon). Decorative: the control that holds one carries its name. Pure render.
// Owner: nm-ds.

/** The sizes an app icon is drawn at: 18 in the rail, 16 everywhere, 14 in text and tabs. */
export type AppIconSize = 14 | 16 | 18;

/** What each icon draws on its 24 grid: path data, or a circle as [cx, cy, r] (a dot is filled). */
type Part = string | readonly [number, number, number];

const PARTS = {
  // the rail
  inbox: ["M22 12h-6l-2 3h-4l-2-3H2", "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"],
  scheduled: [[12, 12, 9], "M12 7v5l3 2"],
  artifacts: ["m12 3 9 5-9 5-9-5 9-5z", "m3 13 9 5 9-5"],
  plugins: ["M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v4"],
  settings: [[12, 12, 3], "M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"],
  // the bar
  sidebar: ["M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M9 4v16"],
  panel: ["M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M15 4v16"],
  back: ["M19 12H5M12 19l-7-7 7-7"],
  forward: ["M5 12h14M12 5l7 7-7 7"],
  plus: ["M12 5v14M5 12h14"],
  close: ["M6 6l12 12M18 6 6 18"],
  more: [[5, 12, 1], [12, 12, 1], [19, 12, 1]],
  search: [[11, 11, 7], "m20 20-3.5-3.5"],
  // the launcher and the tabs
  folder: ["M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"],
  file: ["M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z", "M14 3v5h5"],
  terminal: ["M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "m7 9 3 3-3 3M13 15h4"],
  thread: ["M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"],
  side: ["M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z", "M12 9v6M9 12h6"],
  changes: [[6, 6, 2], [6, 18, 2], [18, 18, 2], "M6 8v8M18 16V9a2 2 0 0 0-2-2h-4M14 5l-2 2 2 2"],
  browser: [[12, 12, 9], "M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"],
  refresh: ["M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"],
  // the menus
  rename: ["M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6", "M18.4 2.6a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4 9.4-9.4z"],
  pin: ["M9 4h6l-1 6 3 3H7l3-3-1-6zM12 13v7"],
  fork: [[6, 5, 2], [18, 5, 2], [12, 19, 2], "M6 7v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7M12 12v5"],
  copy: ["M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z", "M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"],
  window: ["M5 5h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M7 21h12a2 2 0 0 0 2-2V9"],
  open: ["M7 17 17 7M8 7h9v9"],
  stop: ["M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"],
  archive: ["M4 4h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z", "M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"],
  // the composer and its context
  branch: [[6, 5, 2], [6, 19, 2], [18, 7, 2], "M6 7v10M18 9a6 6 0 0 1-6 6H6"],
  place: ["M5.5 5h13A1.5 1.5 0 0 1 20 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 14.5v-8A1.5 1.5 0 0 1 5.5 5z", "M2 19h20"],
  mic: ["M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z", "M5 11a7 7 0 0 0 14 0M12 18v3"],
  send: ["M12 19V5M5 12l7-7 7 7"],
  fold: ["M6 12h12"],
  grip: [[9, 6, 1], [15, 6, 1], [9, 12, 1], [15, 12, 1], [9, 18, 1], [15, 18, 1]],
  down: ["m6 9 6 6 6-6"],
  right: ["m9 6 6 6-6 6"],
  check: ["m5 12 4 4 10-10"],
} as const satisfies Record<string, readonly Part[]>;

/** Every app icon's name. */
export type AppIconName = keyof typeof PARTS;

/** The names, in the order above (the gallery draws them all). */
export const APP_ICONS = Object.keys(PARTS) as readonly AppIconName[];

/** An app icon: 16 px (18 in the rail, 14 in text and tabs), a 1.5 px stroke at every size, currentColor; decorative. */
export function AppIcon({ name, size = 16, testId }: { name: AppIconName; size?: AppIconSize; testId?: string }) {
  return (
    <svg className="b-app-icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" data-icon={name} data-testid={testId}
      fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {(PARTS[name] as readonly Part[]).map((p) =>
        typeof p === "string" ? (
          <path key={p} d={p} vectorEffect="non-scaling-stroke" />
        ) : p[2] <= 1 ? (
          <circle key={p.join(",")} cx={p[0]} cy={p[1]} r={p[2] * 1.25} fill="currentColor" stroke="none" />
        ) : (
          <circle key={p.join(",")} cx={p[0]} cy={p[1]} r={p[2]} vectorEffect="non-scaling-stroke" />
        ),
      )}
    </svg>
  );
}
