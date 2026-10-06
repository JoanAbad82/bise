
// The laws of FrontRules (S9 fn context, lead m_9025), run by build.sh --test
// after src/Settings.swift + src/FrontRules.swift. Fixtures only: never
// a real app's window.

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

let skip = AppSettings.builtInBundles

// excluded apps and private windows: nothing at all
let pw = FrontRules.build(FrontRaw(app: "1Password", bundle: "com.1password.1password", title: "Vault",
                                   selection: "hunter2", texts: ["secret"]), skip: skip)
law("excluded: a password manager sends an empty context", pw == FnCtx() && pw.context.isEmpty)
law("excluded: the page's row says app null and nothing else",
    pw.front["app"] is NSNull && pw.front.count == 2)
law("excluded: Messages is in the seed (bise_home's EXCLUDED_APPS_SEED)",
    FrontRules.build(FrontRaw(app: "Messages", bundle: "com.apple.MobileSMS", title: "Anna"), skip: skip) == FnCtx())
law("excluded: a private window, whatever the browser",
    FrontRules.build(FrontRaw(app: "Google Chrome", bundle: "com.google.Chrome", title: "New Incognito Tab",
                              tabURL: "https://example.com"), skip: skip) == FnCtx())
law("excluded: an app the user added in settings",
    FrontRules.build(FrontRaw(app: "Slack", bundle: "com.tinyspeck.slackmacgap", title: "general"),
                     skip: skip.union(["com.tinyspeck.slackmacgap"])) == FnCtx())

// browsers: the URL's pick order
let chrome = FrontRules.build(FrontRaw(app: "Google Chrome", bundle: "com.google.Chrome", title: "grafana · latency",
                                       axURL: "https://ax.example", tabURL: "https://grafana.internal/d/1",
                                       selection: "  p99 412 ms  ", texts: ["latency", "", "latency", "p99"]), skip: skip)
law("browser: the tab's own URL first", chrome.url == "https://grafana.internal/d/1")
law("browser: no file", chrome.file == nil)
law("browser: the selection trimmed", chrome.selection == "p99 412 ms")
law("browser: the window's text without blanks or repeats", chrome.windowText == "latency\np99")
law("browser: no tab answer in time: the web area's URL",
    FrontRules.build(FrontRaw(app: "Arc", bundle: "company.thebrowser.Browser", axURL: "https://a.example"), skip: skip).url == "https://a.example")
law("browser: Safari's document when it's a web page",
    FrontRules.build(FrontRaw(app: "Safari", bundle: "com.apple.Safari", document: "https://s.example/x"), skip: skip).url == "https://s.example/x")
law("browser: a non-web URL is no URL (chrome://, about:, file://)",
    FrontRules.build(FrontRaw(app: "Google Chrome", bundle: "com.google.Chrome", tabURL: "chrome://settings"), skip: skip).url == nil)

// editors: the file
let code = FrontRules.build(FrontRaw(app: "Code", bundle: "com.microsoft.VSCode", title: "engine.rs — engine",
                                     document: "file:///Users/g/engine/src/engine%20main.rs", selection: "fn step()"), skip: skip)
law("editor: the file from a file:// AXDocument, decoded", code.file == "/Users/g/engine/src/engine main.rs")
law("editor: no URL", code.url == nil)
law("editor: an absolute path is kept",
    FrontRules.path(document: "/Users/g/notes.md") == "/Users/g/notes.md")
law("editor: a relative or untitled document is no file",
    FrontRules.path(document: "Untitled-1") == nil && FrontRules.path(document: "") == nil && FrontRules.path(document: nil) == nil)

// caps
let long = String(repeating: "a", count: FrontRules.textCap + 50)
law("cap: the window's text cut at textCap with an ellipsis",
    FrontRules.windowText([long]).map { $0.count == FrontRules.textCap + 1 && $0.hasSuffix("…") } == true)
law("cap: the selection cut at selectionCap",
    FrontRules.cut(String(repeating: "b", count: 3000), max: FrontRules.selectionCap)?.count == FrontRules.selectionCap + 1)
law("cap: blank is none", FrontRules.cut("  \n ", max: 10) == nil && FrontRules.windowText(["", " "]) == nil)

// the wire
let ctx = code.context
law("wire: FnContext's keys only (no bundle), window_text in snake case",
    Set(ctx.keys) == ["app", "title", "file", "selection"] && code.bundle == "com.microsoft.VSCode")
law("wire: window_text named as FnContext names it",
    chrome.context["window_text"] as? String == "latency\np99")
let row = code.front
law("wire: the page's row has app, bundle, title and path",
    row["ev"] as? String == "app_front" && row["app"] as? String == "Code" && row["bundle"] as? String == "com.microsoft.VSCode"
    && row["path"] as? String == "/Users/g/engine/src/engine main.rs" && row["url"] == nil)
law("wire: a terminal with nothing readable still names the app",
    FrontRules.build(FrontRaw(app: "Ghostty", bundle: "com.mitchellh.ghostty"), skip: skip).context as NSDictionary == ["app": "Ghostty"] as NSDictionary)

// kinds
law("kind: Chrome, Arc, Safari are browsers; VS Code, Cursor, Xcode, Zed are editors",
    ["com.google.Chrome", "company.thebrowser.Browser", "com.apple.Safari"].allSatisfy { FrontRules.kind($0) == .browser }
    && ["com.microsoft.VSCode", "com.todesktop.230313mzl4w4u92", "com.apple.dt.Xcode", "dev.zed.Zed"].allSatisfy { FrontRules.kind($0) == .editor })
law("budget: fn never waits more than 150 ms on the read", FrontRules.budget <= 0.15)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all FrontRules laws hold")
