// bise.dev/download: the pure part. It turns the GitHub API's view of the two
// rolling desktop releases into what the page shows. No DOM, no fetch: the page
// (download.html) fetches and paints; tests/site_download_test.mjs runs this.
//
// The feed (dist-ci + dist-updater, m_25185/m_25204): two rolling tags,
// desktop-latest (stable) and desktop-beta. When CI moves one, it sets that
// rolling release's name to the version (desktop-v2026.10.1), its body to the
// version's notes (markdown, '- ' lines), and puts a copy of the DMG on it as
// bise-mac-arm64.dmg. Each rolling release also carries desktop.json (the
// app's updater reads it), but a browser cannot read release asset bytes
// (GitHub serves them without CORS), so the page reads the release itself
// through api.github.com, which allows any origin.

export const REPO = "gvergnaud/bise";
export const DMG = "bise-mac-arm64.dmg";
export const TAGS = { stable: "desktop-latest", beta: "desktop-beta" };
export const apiUrl = (tag) => `https://api.github.com/repos/${REPO}/releases/tags/${tag}`;
export const notesUrl = (version) => `https://github.com/${REPO}/releases/tag/${version}`;

const VERSION = /^desktop-v(\d+)\.(\d+)\.(\d+)$/;

/** A rolling release from the API -> {version, size, date, notesUrl, notes}, or
 *  null when it holds no desktop build yet (no version name, no DMG, a draft). */
export function channelFrom(release) {
  if (!release || release.draft) return null;
  const version = String(release.name || "").trim();
  if (!VERSION.test(version)) return null;
  const dmg = (release.assets || []).find((a) => a && a.name === DMG);
  if (!dmg) return null;
  return {
    version,
    size: Number(dmg.size) || 0,
    date: dmg.updated_at || release.published_at || null,
    notesUrl: notesUrl(version),
    notes: String(release.body || ""),
  };
}

/** desktop-v2026.10.2 vs desktop-v2026.10.1: >0 when a is newer. */
export function compareVersions(a, b) {
  const pa = VERSION.exec(a), pb = VERSION.exec(b);
  if (!pa || !pb) return 0;
  for (let i = 1; i <= 3; i++) if (+pa[i] !== +pb[i]) return +pa[i] - +pb[i];
  return 0;
}

/** What the page shows, from the two API answers (an object, null for a 404,
 *  undefined when the call failed: rate limit, offline).
 *  state: "ready" (a stable build), "soon" (GitHub answered, no stable build
 *  yet), "unknown" (couldn't ask: the button stays, with no details).
 *  beta: only when it is newer than stable. */
export function view(stableRelease, betaRelease) {
  const stable = channelFrom(stableRelease);
  const beta = channelFrom(betaRelease);
  const state = stable ? "ready" : stableRelease === undefined ? "unknown" : "soon";
  const newerBeta = beta && (!stable || compareVersions(beta.version, stable.version) > 0) ? beta : null;
  return { state, stable, beta: state === "unknown" ? null : newerBeta };
}

/** 205000000 -> "205 MB" (decimal, as Finder counts). */
export function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / 1e6;
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

/** "2026-10-12T09:00:00Z" -> "Oct 12, 2026" (UTC: the same day for everyone). */
export function formatDate(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** desktop-v2026.10.1 -> 2026.10.1 */
export const shortVersion = (v) => String(v).replace(/^desktop-v/, "");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** One line of notes markdown -> safe HTML: `code`, **bold**, [text](https://…). */
export function inline(s) {
  return s.split(/(`[^`]*`)/).map((part) => {
    if (/^`[^`]*`$/.test(part)) return `<code>${esc(part.slice(1, -1))}</code>`;
    return esc(part)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/\[([^\]]+)\]\((https:\/\/[^)\s"]+)\)/g, '<a href="$2">$1</a>');
  }).join("");
}

/** The release notes -> {items: [html], more: n}: the '- ' / '* ' lines (a
 *  paragraph counts as one item when there are none), at most `max`. Headings
 *  and the rest are left to the full notes on GitHub. */
export function notesItems(md, max = 6) {
  const lines = String(md || "").replace(/\r/g, "").split("\n");
  let items = [];
  for (const l of lines) {
    const m = l.match(/^\s*[-*] (.*)$/);
    if (m) items.push(m[1].trim());
    else if (/^\s{2,}\S/.test(l) && items.length) items[items.length - 1] += " " + l.trim();
  }
  if (!items.length) items = lines.filter((l) => l.trim() && !/^#/.test(l)).slice(0, 1).map((l) => l.trim());
  items = items.filter(Boolean);
  return { items: items.slice(0, max).map(inline), more: Math.max(0, items.length - max) };
}
