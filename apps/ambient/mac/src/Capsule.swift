// Capsule: the floating glass panel top right (SPEC §1): a non-activating
// NSPanel on every Space, an NSVisualEffectView (.hudWindow, dark) masked
// to the web UI's rounded rects (the capsule, and the needs-you note under
// it), and a transparent WKWebView on top that draws the tint, the strokes
// and everything else. The bridge: events go in through
// window.ambient.recv(ev); the page's cmds come out through
// window.webkit.messageHandlers.bise.postMessage(cmd).

import AppKit
import WebKit

final class CapsulePanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }

    // harness A (Harness.swift): bise 'has the keys' without the window
    // becoming really key, so his keyboard stays his; off = AppKit's own
    nonisolated(unsafe) static var simulatedKeys = false
    var testKey = false
    override var isKeyWindow: Bool { CapsulePanel.simulatedKeys ? testKey : super.isKeyWindow }

    // harness A: AppKit never moves a frame back onto a screen
    override func constrainFrameRect(_ r: NSRect, to s: NSScreen?) -> NSRect {
        CapsulePanel.simulatedKeys ? r : super.constrainFrameRect(r, to: s)
    }
}

// the page's boxes (app_size): CapsuleShape, Shape.swift

// one click acts (the user's dogfood, B1): WKWebView turned the first click
// on the non-key panel into a focus click; this view takes it as a click.
// The click also gives the bar the keys (round 9, ambient m_6521: 'a click
// on it gives it focus'), like Spotlight: the panel is non-activating, so
// his app stays the active app and gets the keys back when the bar goes.
final class CapsuleWebView: WKWebView {
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
    override var needsPanelToBecomeKey: Bool { true }
}

// macOS's own window corner radius (the user: the capsule's corners match
// the system's, idle and open alike, never a pill). Read from an offscreen
// app window with a toolbar (the usual app window: 26 on Tahoe, where a
// titlebar-only window is 16) through the private _cornerRadius, best
// effort; else a table by major version.
@MainActor
func macWindowRadius(offScreen: Bool = false) -> CGFloat {
    let table: CGFloat = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26 ? 26 : 10
    // harness A: no probe window at all (the table)
    if offScreen { return table }
    // far off every screen, never ordered in (only its corner radius is read)
    let w = NSWindow(contentRect: NSRect(x: -30000, y: -30000, width: 400, height: 300),
                     styleMask: [.titled, .closable, .resizable, .fullSizeContentView], backing: .buffered, defer: true)
    w.isReleasedWhenClosed = false
    w.toolbar = NSToolbar(identifier: "bise.radius")
    let sel = NSSelectorFromString("_cornerRadius")
    if w.responds(to: sel), let r = w.value(forKey: "_cornerRadius") as? NSNumber, r.doubleValue > 0, r.doubleValue < 60 {
        return CGFloat(r.doubleValue)
    }
    return table
}

// WKUserContentController holds its handler strongly: a weak hop
private final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: Capsule?
    init(_ t: Capsule) { target = t }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        MainActor.assumeIsolated { target?.received(m.body) }
    }
}

@MainActor
final class Capsule: NSObject, WKNavigationDelegate {
    var onCmd: (([String: Any]) -> Void)?
    var onReady: (() -> Void)?
    var onHover: ((Bool) -> Void)?           // the mouse over the panel (holds a timed show)
    var onPlaced: (() -> Void)?              // the panel moved (the icon's rect for the page)

    let panel: CapsulePanel
    private let effect: NSVisualEffectView
    let web: WKWebView          // QA (--qa only) snapshots it and reads its model
    private(set) var ready = false
    // the panel is never ordered in at launch: hidden until the first show
    // (false here made the first fn hold after a launch show nothing:
    // Visibility said shown, the app saw no change, no orderFront)
    private(set) var hidden = true
    private(set) var shape = CapsuleShape()
    private var shrink: DispatchWorkItem?
    private var webDir: String?
    private var watcher: DirWatcher?
    // the corners of both boxes: macOS's window radius, not the page's
    let radius: CGFloat

    // round 10: the side panel (an agent's history, docked right) is a
    // second Capsule: the same glass, mask, mouse and keys, its own page
    // (panel.html), its own place (Placement.side)
    let side: Bool

    // harness A (card #428): made far off every screen, deferred, invisible
    let offScreen: Bool

    init(side: Bool = false, offScreen: Bool = false) {
        self.side = side
        self.offScreen = offScreen
        radius = macWindowRadius(offScreen: offScreen)
        let o = Placement.offScreen.frame.origin
        panel = CapsulePanel(contentRect: NSRect(x: offScreen ? o.x : 0, y: offScreen ? o.y : 0, width: 360, height: 84),
                             styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: offScreen)
        if offScreen { panel.alphaValue = 0 }
        panel.isFloatingPanel = true
        // the side panel stays while he works in his apps: above them, under the bar
        panel.level = side ? .floating : .statusBar
        panel.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary, .ignoresCycle]
        panel.hidesOnDeactivate = false
        panel.becomesKeyOnlyIfNeeded = true
        panel.isOpaque = false
        panel.backgroundColor = .clear
        // round 9 (ambient m_6521): no window shadow, the page draws the
        // glass's own (0 30 80 -24, 92 px under it in the box)
        panel.hasShadow = false
        panel.isMovable = false
        // no window animation of macOS's own on order in/out (the user, m_6567:
        // no grow, no zoom; the page's fade and 4 px lift are the only motion)
        panel.animationBehavior = .none
        panel.isReleasedWhenClosed = false
        panel.appearance = NSAppearance(named: .darkAqua)

        let root = NSView(frame: panel.contentRect(forFrameRect: panel.frame))
        root.autoresizesSubviews = true

        effect = NSVisualEffectView(frame: root.bounds)
        effect.material = .hudWindow
        effect.blendingMode = .behindWindow
        effect.state = .active          // blur even when bise isn't the active app (it never is)
        effect.appearance = NSAppearance(named: .darkAqua)
        effect.autoresizingMask = [.width, .height]
        root.addSubview(effect)

        let conf = WKWebViewConfiguration()
        conf.suppressesIncrementalRendering = true
        conf.mediaTypesRequiringUserActionForPlayback = []
        conf.preferences.setValue(true, forKey: "developerExtrasEnabled")
        conf.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        conf.userContentController.addUserScript(WKUserScript(source: Capsule.boot(side: side), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        web = CapsuleWebView(frame: root.bounds, configuration: conf)
        web.setValue(false, forKey: "drawsBackground")
        web.underPageBackgroundColor = .clear
        web.autoresizingMask = [.width, .height]
        web.isInspectable = true
        // the page never goes 'hidden' while the panel shows (amb-web m_6775:
        // a transparent panel read as occluded, WebKit hid the page and
        // stopped its frames until it drew: nothing ever drew): WebKit's
        // window-occlusion detection off for the capsule (SPI, best effort;
        // the near-invisible blur at show is the fallback, Capsule.blurFloor)
        // called through its own method (a BOOL setter), never through KVC:
        // the key isn't KVC-compliant and setValue(_:forKey:) threw at launch
        // (ambient m_6810, 3ee3c710 crashed in Capsule.init)
        let occ = NSSelectorFromString("_setWindowOcclusionDetectionEnabled:")
        if web.responds(to: occ), let m = class_getInstanceMethod(type(of: web), occ) {
            typealias SetBool = @convention(c) (AnyObject, Selector, Bool) -> Void
            unsafeBitCast(method_getImplementation(m), to: SetBool.self)(web, occ, false)
        }
        root.addSubview(web)
        panel.contentView = root

        super.init()
        if offScreen { pinnedScreen = { nil } }
        root.addTrackingArea(NSTrackingArea(rect: .zero, options: [.mouseEnteredAndExited, .activeAlways, .inVisibleRect],
                                            owner: self, userInfo: nil))
        conf.userContentController.add(WeakHandler(self), name: "bise")
        web.navigationDelegate = self
        place(shape.box)
        applyMask()
    }

    // in the page before its own scripts: the app's marks
    static let bootJS = boot(side: false)    // the bar, the edge glow, QA's views

    static func boot(side: Bool) -> String { """
    window.ambientApp = {mac: true\(side ? ", panel: true" : "")};
    (function () {
      var mark = function () { document.documentElement && document.documentElement.classList.add('app'); };
      if (document.documentElement) mark(); else document.addEventListener('DOMContentLoaded', mark);
    })();
    """ }

    @objc func mouseEntered(with e: NSEvent) { onHover?(true) }
    @objc func mouseExited(with e: NSEvent) { onHover?(false) }

    // MARK: the page

    func load(webDir dir: String?) {
        webDir = dir
        ready = false
        watcher = nil
        guard let dir else { web.loadHTMLString(Capsule.missing("no web UI dir given (--web)"), baseURL: nil); return }
        let index = URL(fileURLWithPath: dir).appendingPathComponent(side ? "panel.html" : "index.html")
        guard FileManager.default.fileExists(atPath: index.path) else {
            web.loadHTMLString(Capsule.missing("no \(index.path)"), baseURL: nil); return
        }
        web.loadFileURL(index, allowingReadAccessTo: URL(fileURLWithPath: dir))
        // live dev: a change under the web dir reloads the page
        watcher = DirWatcher(path: dir) { [weak self] in self?.reload() }
    }

    func reload() {
        Log.say(side ? "panel: reload" : "capsule: reload")
        ready = false
        web.reload()
    }

    private static func missing(_ why: String) -> String {
        let esc = why.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "<", with: "&lt;")
        return "<html><body style='margin:0;font:13px -apple-system;color:#ffffffa0;background:#2a2224cc;height:100vh;display:flex;align-items:center;justify-content:center;padding:0 24px;text-align:center'>bise ambient: \(esc)</body></html>"
    }

    // an event for the page (dropped until it's loaded: App replays what matters)
    // harness A: every event a page gets (who: app>page or app>panel)
    static var tap: ((String, [String: Any]) -> Void)?

    func post(_ ev: [String: Any]) {
        Capsule.tap?(side ? "app>panel" : "app>page", ev)
        guard ready, let s = JSON.string(ev) else { return }
        web.evaluateJavaScript("window.ambient && window.ambient.recv(\(s))", completionHandler: nil)
    }

    fileprivate func received(_ body: Any) {
        guard let cmd = body as? [String: Any], cmd["cmd"] is String else {
            Log.say("capsule: not a cmd: \(body)")
            return
        }
        onCmd?(cmd)
    }

    func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
        ready = true
        onReady?()
    }

    func webViewWebContentProcessDidTerminate(_ w: WKWebView) {
        Log.say("capsule: web content died, reloading")
        ready = false
        w.reload()
    }

    // links leave the capsule: the browser opens them
    func webView(_ w: WKWebView, decidePolicyFor a: WKNavigationAction, decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        if let url = a.request.url, a.navigationType == .linkActivated || a.targetFrame == nil, !url.isFileURL {
            NSWorkspace.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    // MARK: the frame

    // the capsule's screen (Placement): the first one (the menu bar's),
    // or the mouse's when each display has its own menu bar; picked again
    // at launch, on a display change or a wake, and when you call bise
    private var screenIndex = 0
    // harness A: set = every panel far off his screens (Placement.offScreen)
    var pinnedScreen: (() -> NSScreen?)?
    // harness A's guard: false = a frame touches a real screen (the app quits)
    static var frameGuard: ((NSWindow) -> Bool)?

    private var screen: NSScreen? {
        if let pin = pinnedScreen { return pin() }
        let all = NSScreen.screens
        return all.indices.contains(screenIndex) ? all[screenIndex] : all.first
    }

    func pickScreen() {
        if pinnedScreen != nil {
            place(panel.frame.size)
            applyMask()
            return
        }
        let all = NSScreen.screens
        let boxes = all.map { ScreenBox(frame: $0.frame, visible: $0.visibleFrame) }
        // round 9: the screen with his key window (NSScreen.main, read before
        // the bar takes the keys), else the mouse's
        let keyScreen = panel.isKeyWindow ? screenIndex : NSScreen.main.flatMap { m in all.firstIndex { $0 == m } }
        let i = Placement.activeScreen(boxes, keyWindowScreen: keyScreen, mouse: NSEvent.mouseLocation) ?? 0
        guard i != screenIndex || panel.screen == nil else { return }
        screenIndex = i
        place(panel.frame.size)
        applyMask()
    }

    var maxHeight: CGFloat {
        let b = pinnedScreen != nil ? Placement.offScreen : screen.map { ScreenBox(frame: $0.frame, visible: $0.visibleFrame) }
        return side ? (b.map { Placement.sideHeight(on: $0) } ?? 900) : (b?.frame.height ?? 900) * 0.7
    }

    // the side panel's glass height (the page draws its glass this tall)
    var sideHeight: CGFloat { maxHeight }

    // round 9 (ambient m_6521): the glass centered on the screen, its top
    // 170 px below the screen's top, the pearl at its left, growing down;
    // never off the screen (Placement.bar)
    private func place(_ size: NSSize) {
        // harness A: far off every screen (Placement.offScreen)
        let b: ScreenBox
        if pinnedScreen != nil { b = Placement.offScreen }
        else if let s = screen { b = ScreenBox(frame: s.frame, visible: s.visibleFrame) }
        else { return }
        let f = side ? Placement.side(size, glass: shape.glass, on: b) : Placement.bar(size, glass: shape.glass, on: b)
        let moved = f.origin != panel.frame.origin || f.size != panel.frame.size
        panel.setFrame(f, display: true)
        if moved { onPlaced?() }
    }

    // app_size: the window grows at once, shrinks 650 ms after the last
    // app_size (so a per-frame spring never resizes it each frame); the
    // blur mask follows every app_size
    func apply(_ s: CapsuleShape) {
        shape = s
        let want = s.box
        let cur = panel.frame.size
        if want.width > cur.width + 0.5 || want.height > cur.height + 0.5 {
            place(NSSize(width: max(want.width, cur.width), height: max(want.height, cur.height)))
        }
        applyMask()
        shrink?.cancel()
        if abs(want.width - panel.frame.width) > 0.5 || abs(want.height - panel.frame.height) > 0.5 {
            let job = DispatchWorkItem { [weak self] in
                MainActor.assumeIsolated {
                    guard let self else { return }
                    self.place(self.shape.box)
                    self.applyMask()
                }
            }
            shrink = job
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.65, execute: job)
        }
    }

    func screensChanged() {
        if !NSScreen.screens.indices.contains(screenIndex) { screenIndex = 0 }
        pickScreen()
        place(panel.frame.size)
        applyMask()
    }

    // the blur only under the glass and the note (CapsuleShape.blurRects),
    // never behind the pearl: it floats with no background (L1)
    private func applyMask() {
        let size = panel.frame.size
        let rects = shape.blurRects(panel: size)
        // the page's radius (round 9: 26, its strokes' own), so the blur's
        // corners and the drawn strokes never part
        let r = shape.radius > 0 ? shape.radius : radius
        let img = NSImage(size: size, flipped: true) { _ in
            NSColor.black.setFill()
            for b in rects { NSBezierPath(roundedRect: b, xRadius: r, yRadius: r).fill() }
            return true
        }
        effect.maskImage = img
        panel.invalidateShadow()
        // the web view paints a beat later: the shadow follows it
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in self?.panel.invalidateShadow() }
    }

    // MARK: shown, hidden, keys

    // the page grows the capsule out of the icon (SPEC §0): show orders the
    // panel in at once; hide lets the page shrink it back first (`after` s),
    // a show in between cancels the order out
    private var outJob: DispatchWorkItem?

    // fade: reduced motion (SPEC §1): the whole panel, its native glass too,
    // fades in place in 0.2 s; never a scale, never a move
    // (the user, main m_6567, ambient m_6575: no grow on appear; the page
    // fades and lifts 4 px; reduced motion: a 0.15 s fade only)
    static let fadeTime = 0.15
    // the page's own leave: opacity and 4 px up in 0.12 s, then the panel goes
    static let leaveTime = 0.12

    // the page's appear fade (round 9: 0.16 s): the native blur fades with
    // it, never a blurred glass with no content yet (ambient's ghost glass)
    static let appearTime = 0.16

    // the blur's lowest alpha while the panel is ordered in: never a fully
    // transparent window, which macOS calls occluded (WebKit then hides the
    // page); 0.01 draws nothing anyone can see (the ghost-glass rule holds)
    static let blurFloor: CGFloat = 0.01

    // the native blur follows the page's own opacity, in and out
    private func blur(_ on: Bool, over t: Double) {
        NSAnimationContext.runAnimationGroup { c in
            c.duration = t
            c.timingFunction = on ? CAMediaTimingFunction(controlPoints: 0.16, 1, 0.3, 1)
                                  : CAMediaTimingFunction(controlPoints: 0.7, 0, 0.84, 0)
            effect.animator().alphaValue = on ? 1 : Capsule.blurFloor
        }
    }

    func show(fade: Bool = false) {
        // harness A: never ordered in where he could see it
        if let g = Capsule.frameGuard, !g(panel) { return }
        hidden = false
        outJob?.cancel()
        outJob = nil
        if fade && !panel.isVisible { panel.alphaValue = 0 }
        if !panel.isVisible { effect.alphaValue = Capsule.blurFloor }
        panel.orderFrontRegardless()
        blur(true, over: fade ? Capsule.fadeTime : Capsule.appearTime)
        trackMouse(true)
        if fade {
            NSAnimationContext.runAnimationGroup { c in
                c.duration = Capsule.fadeTime
                panel.animator().alphaValue = 1
            }
        } else {
            panel.alphaValue = 1
        }
    }

    func hide(after: Double = 0, fade: Bool = false) {
        hidden = true
        focus(false)
        outJob?.cancel()
        trackMouse(false)
        guard after > 0 else { panel.orderOut(nil); panel.alphaValue = 1; effect.alphaValue = 0; return }
        // the blur leaves with the page's own 0.12 s leave, never after it
        blur(false, over: after)
        if fade {
            NSAnimationContext.runAnimationGroup { c in
                c.duration = min(after, Capsule.fadeTime)
                panel.animator().alphaValue = 0
            }
        }
        let job = DispatchWorkItem { [weak self] in
            MainActor.assumeIsolated {
                guard let self, self.hidden else { return }
                self.panel.orderOut(nil)
                self.panel.alphaValue = 1
            }
        }
        outJob = job
        DispatchQueue.main.asyncAfter(deadline: .now() + after, execute: job)
    }

    private var keysFrom: NSRunningApplication?
    var onKeyFocus: ((Bool) -> Void)?   // the bar took the keys (true) or gave them back
    var onClickOutside: (() -> Void)?   // a click in another app while the bar shows

    // harness A: a click that would land in another app (no global monitor sees a posted one)
    func clickedOutside() { if !mouseMonitors.isEmpty { onClickOutside?() } }

    // the mouse only inside the glass (ambient m_6702, CapsuleShape.takesMouse):
    // the panel ignores the mouse wherever the page draws only glow, shadow
    // or the pearl, so a click there reaches the app below; watched only
    // while the panel shows (global monitors: no permission for the mouse)
    private var mouseMonitors: [Any] = []

    private func trackMouse(_ on: Bool) {
        for m in mouseMonitors { NSEvent.removeMonitor(m) }
        mouseMonitors = []
        guard on else { panel.ignoresMouseEvents = false; return }
        // harness A: no global monitor (no Input Monitoring read): its socket sets the mouse (mouseAt)
        if offScreen { return }
        let moves: NSEvent.EventTypeMask = [.mouseMoved, .leftMouseDragged, .rightMouseDragged]
        if let g = NSEvent.addGlobalMonitorForEvents(matching: moves, handler: { [weak self] _ in
            MainActor.assumeIsolated { self?.followMouse() }
        }) { mouseMonitors.append(g) }
        if let l = NSEvent.addLocalMonitorForEvents(matching: moves, handler: { [weak self] e in
            MainActor.assumeIsolated { self?.followMouse() }
            return e
        }) { mouseMonitors.append(l) }
        // a click that went to another app (through the glow, or anywhere else)
        if let c = NSEvent.addGlobalMonitorForEvents(matching: [.leftMouseDown, .rightMouseDown], handler: { [weak self] _ in
            MainActor.assumeIsolated { self?.onClickOutside?() }
        }) { mouseMonitors.append(c) }
        followMouse()
    }

    private func followMouse() { mouseAt(NSEvent.mouseLocation) }

    // the panel takes the mouse at that screen point only inside the glass
    // (the real pointer's moves call it; harness A calls it before a click)
    func mouseAt(_ m: NSPoint) {
        let f = panel.frame
        let p = CGPoint(x: m.x - f.minX, y: f.maxY - m.y)
        let take = shape.takesMouse(at: p, panel: f.size)
        if panel.ignoresMouseEvents == take { panel.ignoresMouseEvents = !take }
    }

    // the panel's key state, however it came (focus(true), a click): his
    // app is remembered to get the keys back, and App hears it (app_focused)
    func watchKey() {
        let nc = NotificationCenter.default
        nc.addObserver(forName: NSWindow.didBecomeKeyNotification, object: panel, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self else { return }
                let front = NSWorkspace.shared.frontmostApplication
                if front?.processIdentifier != ProcessInfo.processInfo.processIdentifier { self.keysFrom = front }
                self.onKeyFocus?(true)
            }
        }
        nc.addObserver(forName: NSWindow.didResignKeyNotification, object: panel, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.onKeyFocus?(false) }
        }
    }

    // what he opens takes the keys like Spotlight (round 9); off gives them back
    func focus(_ on: Bool) {
        if on {
            let front = NSWorkspace.shared.frontmostApplication
            if front?.processIdentifier != ProcessInfo.processInfo.processIdentifier { keysFrom = front }
            if hidden { show() }
            if CapsulePanel.simulatedKeys {
                // harness A: the keys are bise's without leaving his app
                panel.orderFrontRegardless()
                panel.makeFirstResponder(web)
                if !panel.testKey {
                    panel.testKey = true
                    NotificationCenter.default.post(name: NSWindow.didBecomeKeyNotification, object: panel)
                }
                return
            }
            panel.makeKeyAndOrderFront(nil)
            panel.makeFirstResponder(web)
        } else if CapsulePanel.simulatedKeys {
            if panel.testKey {
                panel.testKey = false
                NotificationCenter.default.post(name: NSWindow.didResignKeyNotification, object: panel)
            }
        } else if panel.isKeyWindow {
            panel.resignKey()
            keysFrom?.activate()
            keysFrom = nil
        }
    }
}

// a directory watched for changes (FSEvents), debounced 200 ms
@MainActor
final class DirWatcher {
    private var stream: FSEventStreamRef?
    private let changed: () -> Void
    private var pending = false

    init(path: String, changed: @escaping () -> Void) {
        self.changed = changed
        var ctx = FSEventStreamContext(version: 0, info: Unmanaged.passUnretained(self).toOpaque(), retain: nil, release: nil, copyDescription: nil)
        let cb: FSEventStreamCallback = { _, info, _, _, _, _ in
            guard let info else { return }
            let me = Unmanaged<DirWatcher>.fromOpaque(info).takeUnretainedValue()
            MainActor.assumeIsolated { me.fire() }
        }
        stream = FSEventStreamCreate(nil, cb, &ctx, [path] as CFArray, FSEventStreamEventId(kFSEventStreamEventIdSinceNow), 0.15,
                                     FSEventStreamCreateFlags(kFSEventStreamCreateFlagFileEvents | kFSEventStreamCreateFlagNoDefer))
        if let s = stream {
            FSEventStreamSetDispatchQueue(s, DispatchQueue.main)
            FSEventStreamStart(s)
        }
    }

    isolated deinit {
        if let s = stream { FSEventStreamStop(s); FSEventStreamInvalidate(s); FSEventStreamRelease(s) }
    }

    private func fire() {
        guard !pending else { return }
        pending = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [weak self] in
            MainActor.assumeIsolated {
                self?.pending = false
                self?.changed()
            }
        }
    }
}
