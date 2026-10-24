// A release's name as he reads it: the version, not the tag ('desktop-v2026.10.2'
// → '2026.10.2', designer m_25699), nor the app's VERSION id (desktop_feed.py
// app_id: 'desktop-2026.10.2' → '2026.10.2'). Shared by the window's update
// line, the settings' update row and the About panel (main's about.ts), so the
// three can't drift; electron-builder.mjs (bundleVersions) applies the same
// rule to Info.plist's CFBundleShortVersionString. Pure.
/** 'desktop-v2026.10.2' and 'desktop-2026.10.2' → '2026.10.2'; a dry build ('desktop-dry-<sha>') stays itself. */
export function shortVersion(v: string): string {
  return v.replace(/^desktop-v?(?=\d)/, '').replace(/^v(?=\d)/, '');
}
