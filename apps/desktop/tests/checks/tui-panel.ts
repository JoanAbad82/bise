// The TUI's side panel read from a tmux capture (world.ts's tui()): its agents and its inbox.
// Pure, so its laws run in vitest (tui-panel.test.ts) without a world.

/**
 * The TUI's side panel, one trimmed string per screen line: the text between the panel's left
 * border (the '┬' in the top border) and the right border. Cut by column, not by '│': a tip
 * popover ('new: your agents…') drawn over the feed can cover the border between feed and panel.
 */
function panelOf(screen: string): string[] {
  const lines = screen.split('\n');
  const col = (lines[0] ?? '').indexOf('┬');
  // no '┬' (the top border is the title bar): the panel's width from its 'agents' head line
  // ('│  agents   │'), cut from each line's right border. Not by '│': the first-run tip box
  // ('new: your agents…', qa-native e3f7e598) drawn just left of the panel puts its own corners and
  // borders on the agent rows' lines, so the cell before the last '│' can be the whole feed.
  // With a '┬' too: a feed line holding a character of two code units ('✉︎' is U+2709 + U+FE0E, the
  // TUI's message rows) shifts everything after it by one, so a cut at the '┬' column misses the
  // panel on that line ('│  agents' instead of 'agents'); from the right border it never does.
  const head = lines.find((l) => /│\s+agents\s+│\s*$/.test(l));
  const width = head ? head.lastIndexOf('│') - head.lastIndexOf('│', head.lastIndexOf('agents')) - 1 : -1;
  return lines.map((l) => {
    if (width > 0) {
      const end = l.lastIndexOf('│');
      return end > width ? l.slice(end - width, end).trim() : '';
    }
    if (col < 0) {
      const cells = l.split('│');
      return (cells.length >= 3 ? (cells[cells.length - 2] ?? '') : '').trim();
    }
    const end = l.lastIndexOf('│');
    return end > col ? l.slice(col + 1, end).trim() : '';
  });
}

/**
 * The TUI's inbox, from its side panel (`inbox`, then rows `N ? <agent>  <text…>`), in its order:
 * [{ n, agent, text }] with the text as drawn (cut with … at the panel's width).
 */
export function tuiInbox(screen: string): { n: number; agent: string; text: string }[] {
  const panel = panelOf(screen);
  const at = panel.indexOf('inbox');
  if (at < 0) return [];
  const out: { n: number; agent: string; text: string }[] = [];
  for (const row of panel.slice(at + 1)) {
    const m = /^(\d+) \S (\S+)\s+(.*)$/.exec(row);
    if (!m) break;
    out.push({ n: Number(m[1]), agent: m[2] ?? '', text: (m[3] ?? '').replace(/…$/, '').trim() });
  }
  return out;
}

/**
 * The TUI's agents, from its side panel (`agents`, then rows `N <glyph> <name> …`), in its order:
 * [{ n, glyph, name }]. The glyph is its status (rust/tui/src/theme.rs, TUI_STATUS).
 */
export function tuiAgents(screen: string): { n: number; glyph: string; name: string }[] {
  const panel = panelOf(screen);
  const at = panel.indexOf('agents');
  if (at < 0) return [];
  const out: { n: number; glyph: string; name: string }[] = [];
  for (const raw of panel.slice(at + 1)) {
    // the first-run tip box ('new: your agents… ⌥ 1 to look inside') can end on the panel's left
    // edge on the agent rows' lines (qa-native, packed e3f7e598): its border chars lead the row
    const row = raw.replace(/^[│╮╯╭╰─┐┘\s]+/u, '');
    // a feature's agents come under its own head ('ψ gift-cards'), after a blank line
    if (row === '' || row.startsWith('ψ ')) continue;
    // the faint line under an agent that runs something ('∿ 2 running · :5173', rust/tui/src/
    // running.rs panel_line): the world's alerts has a bg job, so one sits between agent rows
    if (/^∿ \d+ running\b/u.test(row)) continue;
    if (row === 'inbox') break;
    const m = /^(\d+) (\S) (\S+)/.exec(row);
    if (!m) break;
    out.push({ n: Number(m[1]), glyph: m[2] ?? '', name: m[3] ?? '' });
  }
  return out;
}
