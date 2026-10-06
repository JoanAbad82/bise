// OpenIn: which of his apps opens a project's folder (S8, lead m_8490;
// amb-web's environments screen sends {cmd:'open_in', app:'terminal'|
// 'editor', project, path}). Pure (the laws in test/OpenInTests.swift):
// App+Window.swift opens it with NSWorkspace, never a shell string.

import Foundation

enum OpenIn {
    // his terminals and editors, most likely first (bundle ids)
    static let terminals = ["com.mitchellh.ghostty", "com.googlecode.iterm2", "dev.warp.Warp-Stable", "com.github.wez.wezterm",
                            "net.kovidgoyal.kitty", "co.zeit.hyper", "com.apple.Terminal"]
    static let editors = ["com.todesktop.230313mzl4w4u92", "com.microsoft.VSCode", "dev.zed.Zed", "com.sublimetext.4",
                          "com.panic.Nova", "com.barebones.bbedit", "com.jetbrains.intellij", "com.apple.dt.Xcode"]

    enum Kind: String { case terminal, editor }

    // the app for that kind: a terminal = the one he has running (the list's
    // order), else the first installed, else macOS's Terminal; an editor =
    // macOS's default for source code when it is an editor, else one running,
    // else the first installed, else nil (Finder shows the folder)
    static func pick(_ kind: Kind, running: [String], installed: [String], defaultForSource: String?) -> String? {
        switch kind {
        case .terminal:
            return terminals.first { running.contains($0) } ?? terminals.first { installed.contains($0) } ?? "com.apple.Terminal"
        case .editor:
            if let d = defaultForSource, editors.contains(d) { return d }
            return editors.first { running.contains($0) } ?? editors.first { installed.contains($0) }
        }
    }

    // the folder to open: an absolute path to a directory that exists
    // (never a file, a URL or a relative path); nil = refused
    static func folder(_ path: String?, isDir: (String) -> Bool) -> String? {
        guard let p = path, p.hasPrefix("/"), !p.contains("\0") else { return nil }
        let clean = (p as NSString).standardizingPath
        return isDir(clean) ? clean : nil
    }
}
