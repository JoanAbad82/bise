// DesktopWindow: bise's window (desktop stream S4, lead m_8194): one Mac
// window for every project, its screens drawn by one WKWebView loading
// <web>/window/index.html (amb-win's, S6). The window is a normal app window:
// full-size content, a hidden title bar with the traffic lights, the
// sidebar's vibrancy (an NSVisualEffectView under the page's sidebar rect,
// win_size {sidebar}). Never shown at launch; opened by App (a deep link,
// the menu, ⌘0 from the bar...), closed by ⌘W or its red button (hidden,
// never released), its frame kept and restored (WinFrame).
//
// The bridge is the bar's (amb-win m_8203): events in through
// window.ambient.recv(ev), cmds out through
// window.webkit.messageHandlers.bise.postMessage(cmd). The window's own:
// in {ev:'win_open', route}, {ev:'win_focused', on}, {ev:'win_theme', dark},
// {ev:'win_drop', paths}; out {cmd:'win_size', sidebar, drag?},
// {cmd:'win_title', text, route?}, {cmd:'win_close'}; every other cmd goes
// to App (core cmds, app_*).
//
// Keys (WinKeys): every key the page wants reaches it as a keydown, ⌘ keys
// before the main menu; ⌘Q ⌘W ⌘H ⌘M stay the menu's, the Edit keys native.
// Harness A (card #428): made at Placement.offScreen, never ordered in on a
// screen, never activating, its keys simulated (testKey) like the panels.

import AppKit
import WebKit

final class DesktopNSWindow: NSWindow, SimKeyWindow {
    var testKey = false
    // harness A: never really key or main (simulated keys, lead m_8679)
    override var canBecomeKey: Bool { !CapsulePanel.simulatedKeys }
    override var canBecomeMain: Bool { !CapsulePanel.simulatedKeys }
    override var isKeyWindow: Bool { CapsulePanel.simulatedKeys ? testKey : super.isKeyWindow }
    // harness A: AppKit never moves the frame back onto a screen
    override func constrainFrameRect(_ r: NSRect, to s: NSScreen?) -> NSRect {
        CapsulePanel.simulatedKeys ? r : super.constrainFrameRect(r, to: s)
    }
}

final class DesktopWebView: WKWebView {
    var onDrop: (([String]) -> Void)?
    var drag: [CGRect]?          // the page's drag rects (CSS px from the top-left); nil = the top strip

    // ⌘Q ⌘W ⌘H ⌘M go straight to the main menu (the page never holds them);
    // every other ⌘ key goes to the page first (WebKit's own path)
    override func performKeyEquivalent(with e: NSEvent) -> Bool {
        if DesktopWebView.route(e) == .menu { return false }
        return super.performKeyEquivalent(with: e)
    }

    static func route(_ e: NSEvent) -> WinKey {
        let f = e.modifierFlags
        let key = e.keyCode == 51 ? "delete" : (e.charactersIgnoringModifiers ?? "").lowercased()
        return WinKeys.route(key: key, cmd: f.contains(.command), shift: f.contains(.shift), alt: f.contains(.option), ctrl: f.contains(.control))
    }

    // the hidden title bar: a mouse down in a drag rect moves the window
    // (a double click zooms, as macOS's own title bar)
    override func mouseDown(with e: NSEvent) {
        let p = convert(e.locationInWindow, from: nil)
        let css = CGPoint(x: p.x, y: isFlipped ? p.y : bounds.height - p.y)
        if let w = window, WinDrag.moves(at: css, drag: drag, width: bounds.width) {
            if e.clickCount == 2 { w.performZoom(nil) } else { w.performDrag(with: e) }
            return
        }
        super.mouseDown(with: e)
    }

    // a folder dropped on the window adds a project; anything else is the page's
    private func folders(_ s: NSDraggingInfo) -> [String] {
        let urls = s.draggingPasteboard.readObjects(forClasses: [NSURL.self], options: [.urlReadingFileURLsOnly: true]) as? [URL] ?? []
        return WinDrop.folders(urls.map { u in
            var dir: ObjCBool = false
            return (u.path, FileManager.default.fileExists(atPath: u.path, isDirectory: &dir) && dir.boolValue)
        })
    }

    override func draggingEntered(_ s: NSDraggingInfo) -> NSDragOperation {
        folders(s).isEmpty ? super.draggingEntered(s) : .copy
    }

    override func draggingUpdated(_ s: NSDraggingInfo) -> NSDragOperation {
        folders(s).isEmpty ? super.draggingUpdated(s) : .copy
    }

    override func performDragOperation(_ s: NSDraggingInfo) -> Bool {
        let f = folders(s)
        guard !f.isEmpty else { return super.performDragOperation(s) }
        onDrop?(f)
        return true
    }
}

// WKUserContentController holds its handler strongly: a weak hop
private final class WinHandler: NSObject, WKScriptMessageHandler {
    weak var target: DesktopWindow?
    init(_ t: DesktopWindow) { target = t }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        MainActor.assumeIsolated { target?.received(m.body) }
    }
}

@MainActor
final class DesktopWindow: NSObject, WKNavigationDelegate, NSWindowDelegate {
    var onCmd: (([String: Any]) -> Void)?    // every cmd that isn't the window's own
    var onDrop: (([String]) -> Void)?        // folders dropped: add them as projects
    var onShown: ((Bool) -> Void)?           // shown / closed (the activation policy)
    var onReady: (() -> Void)?
    var onKey: ((Bool) -> Void)?             // it took or lost the keys (CardSeat)

    let window: DesktopNSWindow
    let web: DesktopWebView
    private let sidebar: NSVisualEffectView
    private(set) var ready = false
    private(set) var hidden = true
    private(set) var route: String?          // what the page says it shows (win_title route)
    private(set) var title = ""
    private var pending: String?             // a route asked before the page loaded
    private var appearanceWatch: NSKeyValueObservation?
    let offScreen: Bool
    private let defaults: UserDefaults
    static let frameKey = "winFrame"
    static let routeKey = "winRoute"

    // harness A: every event the page gets (app>win)
    static var tap: ((String, [String: Any]) -> Void)?

    init(offScreen: Bool, defaults: UserDefaults) {
        self.offScreen = offScreen
        self.defaults = defaults
        // made far off every screen, deferred and invisible (main m_8012);
        // open() places it (WinFrame), never at launch
        let o = Placement.offScreen.frame.origin
        window = DesktopNSWindow(contentRect: NSRect(origin: o, size: WinFrame.size),
                                 styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                                 backing: .buffered, defer: true)
        // a titled window's init pulls its frame onto a screen
        // (constrainFrameRect): back far off every screen, never ordered in
        window.setFrameOrigin(o)
        window.alphaValue = 0
        window.isReleasedWhenClosed = false
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.title = "bise"
        window.minSize = WinFrame.minSize
        window.backgroundColor = .windowBackgroundColor
        window.collectionBehavior = [.fullScreenPrimary]
        window.tabbingMode = .disallowed
        if offScreen { window.animationBehavior = .none }

        let root = NSView(frame: window.contentRect(forFrameRect: window.frame))
        root.autoresizesSubviews = true
        sidebar = NSVisualEffectView(frame: NSRect(x: 0, y: 0, width: 0, height: root.bounds.height))
        sidebar.material = .sidebar
        sidebar.blendingMode = .behindWindow
        sidebar.state = .followsWindowActiveState
        sidebar.autoresizingMask = [.height]
        root.addSubview(sidebar)

        let conf = WKWebViewConfiguration()
        conf.preferences.setValue(true, forKey: "developerExtrasEnabled")
        conf.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        conf.userContentController.addUserScript(WKUserScript(source: DesktopWindow.boot, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        web = DesktopWebView(frame: root.bounds, configuration: conf)
        web.setValue(false, forKey: "drawsBackground")
        web.underPageBackgroundColor = .clear
        web.autoresizingMask = [.width, .height]
        web.isInspectable = true
        root.addSubview(web)
        window.contentView = root

        super.init()
        window.delegate = self
        conf.userContentController.add(WinHandler(self), name: "bise")
        web.navigationDelegate = self
        web.onDrop = { [weak self] in self?.onDrop?($0) }
        appearanceWatch = NSApp.observe(\.effectiveAppearance) { [weak self] _, _ in
            MainActor.assumeIsolated { self?.postTheme() }
        }
    }

    // in the page before its own scripts: the app's marks
    static let boot = """
    window.ambientApp = {mac: true, window: true};
    (function () {
      var mark = function () { document.documentElement && document.documentElement.classList.add('app'); };
      if (document.documentElement) mark(); else document.addEventListener('DOMContentLoaded', mark);
    })();
    """

    // MARK: the page

    func load(webDir dir: String?) {
        ready = false
        guard let dir else { web.loadHTMLString(DesktopWindow.missing("no web UI dir given (--web)"), baseURL: nil); return }
        let index = URL(fileURLWithPath: dir).appendingPathComponent("window/index.html")
        guard FileManager.default.fileExists(atPath: index.path) else {
            web.loadHTMLString(DesktopWindow.missing("no \(index.path)"), baseURL: nil); return
        }
        web.loadFileURL(index, allowingReadAccessTo: URL(fileURLWithPath: dir))
    }

    private static func missing(_ why: String) -> String {
        let esc = why.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "<", with: "&lt;")
        return "<html><body style='margin:0;font:13px -apple-system;color:#888;height:100vh;display:flex;align-items:center;justify-content:center;padding:0 24px;text-align:center'>bise: \(esc)</body></html>"
    }

    func post(_ ev: [String: Any]) {
        DesktopWindow.tap?("app>win", ev)
        guard ready, let s = JSON.string(ev) else { return }
        web.evaluateJavaScript("window.ambient && window.ambient.recv(\(s))", completionHandler: nil)
    }

    fileprivate func received(_ body: Any) {
        guard let cmd = body as? [String: Any], let name = cmd["cmd"] as? String else {
            Log.say("window: not a cmd: \(body)")
            return
        }
        DesktopWindow.tap?("win>app", cmd)
        switch name {
        case "win_size":
            if let w = (cmd["sidebar"] as? NSNumber)?.doubleValue { setSidebar(CGFloat(max(0, w))) }
            if cmd.keys.contains("drag") { web.drag = WinDrag.rects(cmd["drag"]) }
        case "win_title":
            title = cmd["text"] as? String ?? title
            if !title.isEmpty { window.title = title }
            if let r = cmd["route"] as? String, let v = WinRoute.valid(r) {
                route = v
                if !offScreen { defaults.set(v, forKey: DesktopWindow.routeKey) }
            }
        case "win_close":
            close()
        default:
            onCmd?(cmd)
        }
    }

    private func setSidebar(_ w: CGFloat) {
        let h = window.contentView?.bounds.height ?? 0
        sidebar.frame = NSRect(x: 0, y: 0, width: w, height: h)
    }

    func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
        ready = true
        postTheme()
        post(["ev": "win_focused", "on": window.isKeyWindow])
        onReady?()
        if let r = pending { pending = nil; post(["ev": "win_open", "route": r]) }
    }

    func webViewWebContentProcessDidTerminate(_ w: WKWebView) {
        Log.say("window: web content died, reloading")
        ready = false
        w.reload()
    }

    // links leave the window: the browser opens them (harness: never)
    func webView(_ w: WKWebView, decidePolicyFor a: WKNavigationAction, decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        if let url = a.request.url, a.navigationType == .linkActivated || a.targetFrame == nil, !url.isFileURL {
            if Capsule.blockLinks { Log.say("window: harness: link not opened \(url)") } else { NSWorkspace.shared.open(url) }
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    private func postTheme() {
        let dark = NSApp.effectiveAppearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
        post(["ev": "win_theme", "dark": dark])
    }

    // MARK: open, close, restore

    // the last route the page showed (none yet: bise's thread)
    var lastRoute: String { route ?? (offScreen ? nil : defaults.string(forKey: DesktopWindow.routeKey)).flatMap(WinRoute.valid) ?? "bise" }

    // open on a route (nil = where he left it); the window comes back at its
    // last frame (WinFrame), takes the keys and the app turns regular
    func open(_ r: String?) {
        let target = r.flatMap(WinRoute.valid) ?? lastRoute
        if ready { post(["ev": "win_open", "route": target]) } else { pending = target }
        if hidden { place() }
        hidden = false
        // harness A: the guard first, never on a screen, never activating
        if let g = Capsule.frameGuard, !g(window) { return }
        onShown?(true)
        window.alphaValue = 1
        if CapsulePanel.simulatedKeys {
            window.orderFrontRegardless()
            window.makeFirstResponder(web)
            SimKeys.take(window)
            return
        }
        NSApp.activate()
        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(web)
    }

    private func place() {
        if offScreen {
            window.setFrame(NSRect(origin: Placement.offScreen.frame.origin, size: WinFrame.size), display: false)
            return
        }
        let screens = NSScreen.screens
        let boxes = screens.map { ScreenBox(frame: $0.frame, visible: $0.visibleFrame) }
        let main = NSScreen.main.flatMap { m in screens.firstIndex { $0 == m } } ?? 0
        let saved = defaults.string(forKey: DesktopWindow.frameKey).map(NSRectFromString).flatMap { $0.width > 0 ? $0 : nil }
        window.setFrame(WinFrame.restore(saved: saved, screens: boxes, main: main), display: false)
    }

    // ⌘W, the red button, the page's win_close: hidden (never released), the
    // frame kept, the app back to a menu-bar app
    func close() {
        guard !hidden else { return }
        hidden = true
        saveFrame()
        SimKeys.give(window)
        window.orderOut(nil)
        onShown?(false)
    }

    private func saveFrame() {
        guard !offScreen, window.isVisible else { return }
        defaults.set(NSStringFromRect(window.frame), forKey: DesktopWindow.frameKey)
    }

    // MARK: NSWindowDelegate

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        close()
        return false
    }

    func windowDidBecomeKey(_ n: Notification) { post(["ev": "win_focused", "on": true]); onKey?(true) }
    func windowDidResignKey(_ n: Notification) { post(["ev": "win_focused", "on": false]); onKey?(false) }
    func windowDidMove(_ n: Notification) { saveFrame() }
    func windowDidEndLiveResize(_ n: Notification) { saveFrame() }
}
