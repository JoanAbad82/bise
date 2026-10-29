// Playwright key names ("Enter", "Control+A", "Tab Tab Enter") → the
// CDP Input.dispatchKeyEvent sequence. Pure.

/** A key as CDP dispatches it. */
export type KeyDef = { key?: string; code: string; keyCode: number; text?: string };
/** One chord: its modifiers, its key, as he wrote it. */
export type Chord = { mods: string[]; key: KeyDef & { key: string }; label: string };
/** Input.dispatchKeyEvent's params. */
export type KeyEvent = {
  type: string; modifiers: number; key: string; code: string; windowsVirtualKeyCode: number;
  text?: string; unmodifiedText?: string; commands?: string[];
};

const NAMED: Record<string, KeyDef> = {
  Enter: { code: "Enter", keyCode: 13, text: "\r" },
  Tab: { code: "Tab", keyCode: 9 },
  Escape: { code: "Escape", keyCode: 27 },
  Backspace: { code: "Backspace", keyCode: 8 },
  Delete: { code: "Delete", keyCode: 46 },
  Space: { key: " ", code: "Space", keyCode: 32, text: " " },
  ArrowUp: { code: "ArrowUp", keyCode: 38 },
  ArrowDown: { code: "ArrowDown", keyCode: 40 },
  ArrowLeft: { code: "ArrowLeft", keyCode: 37 },
  ArrowRight: { code: "ArrowRight", keyCode: 39 },
  Home: { code: "Home", keyCode: 36 },
  End: { code: "End", keyCode: 35 },
  PageUp: { code: "PageUp", keyCode: 33 },
  PageDown: { code: "PageDown", keyCode: 34 },
  Insert: { code: "Insert", keyCode: 45 },
};
for (let i = 1; i <= 12; i++) NAMED["F" + i] = { code: "F" + i, keyCode: 111 + i };
const ALIAS: Record<string, string> = { Esc: "Escape", Return: "Enter", Up: "ArrowUp", Down: "ArrowDown", Left: "ArrowLeft", Right: "ArrowRight", Del: "Delete", " ": "Space" };

// CDP modifier bits.
const MODS: Record<string, number> = { Alt: 1, Control: 2, Meta: 4, Shift: 8 };
const MOD_ALIAS: Record<string, string> = { Ctrl: "Control", Cmd: "Meta", Command: "Meta", Option: "Alt", ControlOrMeta: "Meta" };
const MOD_KEYS: Record<string, { code: string; keyCode: number }> = { Alt: { code: "AltLeft", keyCode: 18 }, Control: { code: "ControlLeft", keyCode: 17 }, Meta: { code: "MetaLeft", keyCode: 91 }, Shift: { code: "ShiftLeft", keyCode: 16 } };

// Editing shortcuts that CDP key events do not run by themselves on macOS.
const COMMANDS: Record<string, string> = { "Meta+a": "selectAll", "Meta+c": "copy", "Meta+x": "cut", "Meta+v": "paste", "Meta+z": "undo", "Meta+Shift+z": "redo" };

function keyDef(name: string): (KeyDef & { key: string }) | null {
  name = ALIAS[name] || name;
  if (NAMED[name]) return { key: NAMED[name].key ?? name, ...NAMED[name] };
  if ([...name].length === 1) {
    const upper = name.toUpperCase();
    let code = "";
    if (/[A-Z]/.test(upper)) code = "Key" + upper;
    else if (/[0-9]/.test(name)) code = "Digit" + name;
    const keyCode = /[A-Z0-9]/.test(upper) ? upper.charCodeAt(0) : 0;
    return { key: name, code, keyCode, text: name };
  }
  return null;
}

/**
 * Parse `keys` into chords. Throws { code: "bad_args" } on an unknown key.
 * @returns [{ mods: ["Control"], key: {key, code, keyCode, text?}, label }]
 */
export function parseKeys(keys: unknown): Chord[] {
  const src = String(keys ?? "").trim();
  if (!src) throw Object.assign(new Error("press needs keys, e.g. \"Enter\" or \"Control+A\""), { code: "bad_args" });
  return src.split(/\s+/).map((chord) => {
    const parts = chord === "+" ? ["+"] : chord.split(/\+(?!$)/);
    const keyName = parts.pop() as string;
    const mods = parts.map((m) => MOD_ALIAS[m] || m);
    for (const m of mods) if (!MODS[m]) throw Object.assign(new Error(`unknown modifier "${m}" in "${chord}"`), { code: "bad_args" });
    const key = keyDef(keyName);
    if (!key) throw Object.assign(new Error(`unknown key "${keyName}" (use Playwright names: Enter, Tab, Escape, ArrowDown, Control+A…)`), { code: "bad_args" });
    return { mods, key, label: chord };
  });
}

/** The dispatchKeyEvent params of one chord, in order. */
export function chordEvents({ mods, key }: Pick<Chord, "mods" | "key">) {
  const modifiers = mods.reduce((b, m) => b | MODS[m], 0);
  const out: KeyEvent[] = [];
  let held = 0;
  for (const m of mods) {
    held |= MODS[m];
    out.push({ type: "rawKeyDown", modifiers: held, key: m, code: MOD_KEYS[m].code, windowsVirtualKeyCode: MOD_KEYS[m].keyCode });
  }
  const printable = key.text !== undefined && !(modifiers & (MODS.Control | MODS.Meta | MODS.Alt));
  let text = printable ? key.text : undefined;
  if (text && modifiers & MODS.Shift && text.length === 1) text = text.toUpperCase();
  const down: KeyEvent = { type: text ? "keyDown" : "rawKeyDown", modifiers, key: text && key.text!.length === 1 && key.key !== " " ? text : key.key, code: key.code, windowsVirtualKeyCode: key.keyCode };
  if (text) { down.text = text; down.unmodifiedText = key.text; }
  const cmd = COMMANDS[[...mods.filter((m) => m !== "Shift"), ...(mods.includes("Shift") ? ["Shift"] : []), key.key.toLowerCase()].join("+")];
  if (cmd) down.commands = [cmd];
  out.push(down);
  out.push({ type: "keyUp", modifiers, key: down.key, code: key.code, windowsVirtualKeyCode: key.keyCode });
  for (const m of [...mods].reverse()) {
    held &= ~MODS[m];
    out.push({ type: "keyUp", modifiers: held, key: m, code: MOD_KEYS[m].code, windowsVirtualKeyCode: MOD_KEYS[m].keyCode });
  }
  return out;
}

/** The key bar's spelling (designer): "enter", "esc", "cmd+a". */
export function keyLabel(keys: unknown) {
  const words: Record<string, string> = { Escape: "esc", Esc: "esc", Meta: "cmd", Cmd: "cmd", Command: "cmd", ControlOrMeta: "cmd", Control: "ctrl", Alt: "opt", Option: "opt", ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", PageUp: "page up", PageDown: "page down" };
  return String(keys).trim().split(/\s+/).map((chord) => chord.split(/\+(?!$)/).map((p) => words[p] || p.toLowerCase()).join("+")).join(" ");
}
