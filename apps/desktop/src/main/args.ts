// The preload's facts from main, as process arguments (webPreferences'
// additionalArguments, windows.ts): read once at load, no IPC. Pure; the
// sandboxed preload can't import node:os, so main says them.

/** The value of `--name=value` in argv, or null. */
export function argValue(argv: readonly string[], prefix: string): string | null {
  const a = argv.find((x) => x.startsWith(prefix));
  return a === undefined ? null : a.slice(prefix.length);
}
