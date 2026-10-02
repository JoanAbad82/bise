// PageOpen: the pure half of opening a page (docs/ambient-pages.md §2.8):
// which browser, which tab is the page, and the AppleScript to say it.
// No AppKit, no Apple Events: Browser.swift runs the scripts; the laws in
// test/PageOpenTests.swift run in the swift interpreter.
//
// In a Chromium browser that runs (the default browser first, then Chrome,
// Arc, Brave, Edge), the tab whose URL starts with the page's URL comes
// forward with its window, else a new tab opens in the front window.
// Otherwise (no such browser, Automation refused) the URL just opens.

import Foundation

enum PageOpen {
    // the Chromium browsers we drive, in the order we pick them
    static let browsers = ["com.google.Chrome", "company.thebrowser.Browser", "com.brave.Browser", "com.microsoft.edgemac"]
    static let arc = "company.thebrowser.Browser"

    // the browser to drive: the default browser if it's one of ours and
    // runs, else the first of ours that runs; nil: just open the URL
    static func pick(running: Set<String>, defaultBrowser: String?) -> String? {
        if let d = defaultBrowser, browsers.contains(d), running.contains(d) { return d }
        return browsers.first { running.contains($0) }
    }

    // a tab shows the page: its URL starts with the page's URL, at a
    // boundary (/p/abc is not /p/abcd), localhost and 127.0.0.1 alike,
    // a trailing slash on the page's URL ignored
    static func matches(tab: String, page: String) -> Bool {
        let t = canonical(tab)
        var p = canonical(page)
        while p.hasSuffix("/") { p.removeLast() }
        guard !p.isEmpty, t.hasPrefix(p) else { return false }
        let rest = t.dropFirst(p.count)
        guard let c = rest.first else { return true }
        return c == "/" || c == "?" || c == "#"
    }

    private static func canonical(_ u: String) -> String {
        var s = u.trimmingCharacters(in: .whitespaces)
        for (a, b) in [("://localhost:", "://127.0.0.1:"), ("://localhost/", "://127.0.0.1/")] {
            s = s.replacingOccurrences(of: a, with: b)
        }
        if s.hasSuffix("://localhost") { s = String(s.dropLast("localhost".count)) + "127.0.0.1" }
        return s
    }

    // the first tab showing the page, front window first: (window, tab), 1-based
    static func find(_ windows: [[String]], page: String) -> (window: Int, tab: Int)? {
        for (w, tabs) in windows.enumerated() {
            if let t = tabs.firstIndex(where: { matches(tab: $0, page: page) }) { return (w + 1, t + 1) }
        }
        return nil
    }

    // an AppleScript string literal
    static func literal(_ s: String) -> String {
        "\"" + s.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"") + "\""
    }

    // every tab's URL, window by window (front first)
    static func listScript(_ bundle: String) -> String {
        "tell application id \(literal(bundle)) to get URL of every tab of every window"
    }

    // bring tab t of window w forward, then the browser
    static func focusScript(_ bundle: String, window w: Int, tab t: Int) -> String {
        if bundle == arc {
            return """
            tell application id \(literal(bundle))
              tell tab \(t) of window \(w) to select
              activate
            end tell
            """
        }
        return """
        tell application id \(literal(bundle))
          set active tab index of window \(w) to \(t)
          set index of window \(w) to 1
          activate
        end tell
        """
    }

    // a new tab in the front window (a new window when there is none)
    static func newTabScript(_ bundle: String, url: String) -> String {
        """
        tell application id \(literal(bundle))
          if (count of windows) = 0 then
            make new window
            set URL of active tab of front window to \(literal(url))
          else
            tell front window to make new tab with properties {URL:\(literal(url))}
          end if
          activate
        end tell
        """
    }

    // MARK: voice notes at the mouse (ambient-pages §4.1)

    // the page a tab shows: under the hub's pages_url, /p/<id>[/v/<n>][?…][#…]
    // -> (id, the page's own URL pages_url/p/<id>); nil: not a bise page
    static func pageRef(tab: String, pagesURL: String) -> (id: String, url: String)? {
        var base = pagesURL.trimmingCharacters(in: .whitespaces)
        while base.hasSuffix("/") { base.removeLast() }
        guard !base.isEmpty, matches(tab: tab, page: base + "/p") else { return nil }
        // the rest after <base>/p/, in the tab's own spelling (localhost or 127.0.0.1)
        let t = canonical(tab), b = canonical(base) + "/p/"
        guard t.hasPrefix(b) else { return nil }
        let id = t.dropFirst(b.count).prefix { $0 != "/" && $0 != "?" && $0 != "#" }
        guard !id.isEmpty else { return nil }
        return (String(id), base + "/p/" + id)
    }

    // the hub's pages_url from a page's URL (…/p/<id>…) when the state didn't say it
    static func pagesBase(fromPageURL u: String) -> String? {
        guard let r = u.range(of: "/p/"), isWeb(u) else { return nil }
        let base = String(u[..<r.lowerBound])
        return base.isEmpty ? nil : base
    }

    // the URL of the front window's active tab (Chrome family and Arc alike)
    static func activeTabScript(_ bundle: String) -> String {
        "tell application id \(literal(bundle)) to get URL of active tab of front window"
    }

    // only web pages go through a browser's tabs
    static func isWeb(_ url: String) -> Bool {
        let l = url.lowercased()
        return l.hasPrefix("http://") || l.hasPrefix("https://")
    }
}

// the first of two racers settles (the browser's answer or the ~150 ms
// timeout): fn never waits on a slow browser, a late answer is dropped
final class Once<T> {
    private(set) var value: T?
    init() {}
    // true for the first call only
    func settle(_ v: T) -> Bool {
        guard value == nil else { return false }
        value = v
        return true
    }
}
