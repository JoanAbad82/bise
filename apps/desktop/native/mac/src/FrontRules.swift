import Foundation

// FrontRules: what bise reads of the front app at fn (S9, architect F; cut
// from apps/ambient/mac for bise-mac-helper). Pure: the reader
// (FrontRead.swift) hands raw strings in; this decides what goes out, as
// bise_proto::context::FnContext (the helper's {ev:'context'}) and the
// spotlight's 'in front' row ({ev:'front'}). An excluded app sends nothing.

// the never-seen list (SPEC §5.2): the built-in apps (always, never
// removed: bise_home's EXCLUDED_APPS_SEED) and his own (config.exclude),
// plus private windows. The shot and the fn context both obey it.
enum SkipList {
    // a private window shows in its title (best effort: Safari's private
    // windows don't say it in the title on every version)
    static let privateMarks = ["private browsing", "incognito", "inprivate", "navigation privée", "private window"]

    static let builtIn: Set<String> = [
        "com.1password.1password", "com.agilebits.onepassword7", "com.agilebits.onepassword-osx",
        "com.bitwarden.desktop", "com.dashlane.dashlanephonefinal", "com.lastpass.LastPass",
        "com.apple.keychainaccess", "com.apple.Passwords",
        "com.apple.systempreferences", "com.apple.Settings", "com.apple.SystemSettings",
        "com.apple.MobileSMS",
    ]

    // the built-in floor and his own
    static func with(_ his: [String]) -> Set<String> { builtIn.union(his) }

    static func skips(bundle: String?, title: String, apps: Set<String> = builtIn) -> Bool {
        if let b = bundle, apps.contains(b) { return true }
        let t = title.lowercased()
        return privateMarks.contains { t.contains($0) }
    }
}

// what the reader saw, untouched
struct FrontRaw: Equatable {
    var app: String?           // NSRunningApplication.localizedName
    var bundle: String?
    var title: String?         // the focused window's AXTitle
    var document: String?      // its AXDocument (a file:// URL in editors, the page's URL in Safari)
    var axURL: String?         // a web area's AXURL
    var tabURL: String?        // a Chromium browser's active tab (AppleScript)
    var selection: String?     // the focused element's AXSelectedText
    var texts: [String] = []   // the window's static texts, in tree order
}

// FnContext's fields (the bundle is ours: the page's row and the logs)
struct FnCtx: Equatable {
    var app: String?
    var bundle: String?
    var url: String?
    var title: String?
    var file: String?
    var selection: String?
    var windowText: String?

    // FnContext's JSON, absent fields left out
    var context: [String: Any] {
        var c: [String: Any] = [:]
        if let v = app { c["app"] = v }
        if let v = url { c["url"] = v }
        if let v = title { c["title"] = v }
        if let v = file { c["file"] = v }
        if let v = selection { c["selection"] = v }
        if let v = windowText { c["window_text"] = v }
        return c
    }

    // {ev:'front'}: app null for an excluded app (the page says nothing of it)
    var front: [String: Any] {
        var e: [String: Any] = ["ev": "front", "app": app ?? NSNull()]
        guard app != nil else { return e }
        if let v = bundle { e["bundle"] = v }
        if let v = title { e["title"] = v }
        if let v = url { e["url"] = v }
        if let v = file { e["path"] = v }
        return e
    }
}

enum FrontRules {
    static let textCap = 4000        // the window's text, in characters
    static let selectionCap = 2000
    static let titleCap = 300
    static let budget = 0.15         // fn never waits: past this, what was read goes

    enum Kind: Equatable { case browser, editor, other }

    static let browsers: Set<String> = ["com.google.Chrome", "company.thebrowser.Browser", "com.brave.Browser",
                                        "com.microsoft.edgemac", "com.apple.Safari", "com.apple.SafariTechnologyPreview"]
    static let editors: Set<String> = ["com.microsoft.VSCode", "com.todesktop.230313mzl4w4u92", "com.apple.dt.Xcode",
                                       "dev.zed.Zed", "dev.zed.Zed-Preview", "com.vscodium"]

    static func kind(_ bundle: String?) -> Kind {
        guard let b = bundle else { return .other }
        return browsers.contains(b) ? .browser : editors.contains(b) ? .editor : .other
    }

    // trimmed, empty = none, past max: cut with an ellipsis
    static func cut(_ s: String?, max: Int) -> String? {
        guard let t = s?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty else { return nil }
        return t.count > max ? String(t.prefix(max)) + "…" : t
    }

    // only web pages count as a URL
    static func web(_ s: String?) -> String? {
        guard let s, let scheme = s.split(separator: ":", maxSplits: 1).first?.lowercased(),
              scheme == "http" || scheme == "https" else { return nil }
        return s
    }

    // AXDocument as a path: a file:// URL or an absolute path; else none
    static func path(document: String?) -> String? {
        guard let d = document, !d.isEmpty else { return nil }
        if d.hasPrefix("/") { return d }
        guard d.lowercased().hasPrefix("file://"), let u = URL(string: d), u.isFileURL, !u.path.isEmpty else { return nil }
        return u.path
    }

    // the window's texts: blanks and repeats out, one per line, capped
    static func windowText(_ parts: [String], cap: Int = textCap) -> String? {
        var out: [String] = []
        var seen = Set<String>()
        for p in parts {
            let t = p.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !t.isEmpty, seen.insert(t).inserted else { continue }
            out.append(t)
        }
        return cut(out.joined(separator: "\n"), max: cap)
    }

    // the raw read → what goes out; never-seen apps and private windows: nothing
    static func build(_ raw: FrontRaw, skip: Set<String>) -> FnCtx {
        if SkipList.skips(bundle: raw.bundle, title: raw.title ?? "", apps: skip) { return FnCtx() }
        var c = FnCtx(app: cut(raw.app, max: titleCap), bundle: raw.bundle)
        c.title = cut(raw.title, max: titleCap)
        c.selection = cut(raw.selection, max: selectionCap)
        c.windowText = windowText(raw.texts)
        switch kind(raw.bundle) {
        case .browser:
            // the tab's own answer first, then the web area, then Safari's document
            c.url = web(raw.tabURL) ?? web(raw.axURL) ?? web(raw.document)
        case .editor, .other:
            c.file = path(document: raw.document)
            c.url = web(raw.axURL) ?? web(raw.document)
        }
        return c
    }
}
