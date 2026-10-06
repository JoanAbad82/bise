// WinRules: the pure rules of bise's window (desktop stream S4, the laws
// in test/WinTests.swift): which keys go to the page and which stay
// macOS's, the route a deep link opens, where the window comes back,
// the app's activation policy, what a drop adds, and where a mouse down
// moves the window. DesktopWindow.swift and App only call them.

import CoreGraphics
import Foundation

// a key down in the window: the page's (a normal keydown, before the main
// menu), the main menu's (⌘Q quit, ⌘W close the window, ⌘H hide, ⌘M
// minimize: never the page's), or native (the Edit keys in a field)
enum WinKey: Equatable { case page, menu, native }

enum WinKeys {
    static let menuKeys: Set<String> = ["q", "w", "h", "m"]

    // key: the key without modifiers, lowercased ("1", "k", "[", "delete")
    static func route(key: String, cmd: Bool, shift: Bool = false, alt: Bool = false, ctrl: Bool = false) -> WinKey {
        // no ⌘: a plain keydown (ctrl+1-9, ⌥0-9, ctrl+c never quits: the page's)
        guard cmd else { return .page }
        if !alt && !ctrl && !shift && menuKeys.contains(key) { return .menu }
        // the Edit keys in a field: ⌘Z ⇧⌘Z ⌘A ⌘C ⌘V ⌘X (⇧⌘A is the page's)
        if !alt && !ctrl {
            if key == "z" { return .native }
            if !shift && ["a", "c", "v", "x"].contains(key) { return .native }
        }
        // everything else with ⌘: ⌘0-9, ⌘K I D E F J . N ⌫ [ ] , ⇧⌘A...
        return .page
    }
}

// the route a deep link opens (amb-win m_8203): 'bise', 'project/<p>',
// 'agent/<p>/<a>', 'inbox', 'review/<p>/<a>', 'artifacts', 'environments',
// 'settings[/<page>]', 'add-project'
enum WinRoute {
    static let heads: Set<String> = ["bise", "project", "agent", "inbox", "review", "artifacts", "environments", "settings", "add-project"]

    // a route the page knows, else nil
    static func valid(_ r: String) -> String? {
        let head = r.split(separator: "/", maxSplits: 1).first.map(String.init) ?? ""
        return heads.contains(head) ? r : nil
    }

    // a name inside a route: its slashes escaped
    static func seg(_ s: String) -> String { s.replacingOccurrences(of: "%", with: "%25").replacingOccurrences(of: "/", with: "%2F") }

    // {cmd:'app_window', route} or {cmd:'app_window', open:{project, agent}}
    // (the capsule, a card, the spotlight's ⏎); an agent without a project
    // is one of the current project's (the bar's workspace)
    static func from(route: String?, open: [String: Any]?, current: String?) -> String? {
        if let r = route, !r.isEmpty { return valid(r) }
        let p = (open?["project"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? nil
        let a = (open?["agent"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? nil
        switch (p, a) {
        case (let p?, let a?): return "agent/\(seg(p))/\(seg(a))"
        case (let p?, nil): return "project/\(seg(p))"
        case (nil, let a?):
            guard let c = current, !c.isEmpty else { return nil }
            return "agent/\(seg(c))/\(seg(a))"
        case (nil, nil): return "bise"
        }
    }
}

// where the window comes back (lead m_8202): its last frame when a screen
// still shows its title bar, else the main screen; never off every screen
enum WinFrame {
    static let size = CGSize(width: 1280, height: 820)
    static let minSize = CGSize(width: 720, height: 480)

    // a frame (Cocoa coords, y up) fully inside this visible rect, as big
    // as it can be up to its own size
    static func fit(_ f: CGRect, in v: CGRect) -> CGRect {
        let w = min(max(f.width, min(minSize.width, v.width)), v.width)
        let h = min(max(f.height, min(minSize.height, v.height)), v.height)
        let x = min(max(f.minX, v.minX), v.maxX - w)
        let y = min(max(f.minY, v.minY), v.maxY - h)
        return CGRect(x: x, y: y, width: w, height: h)
    }

    // the first open: 1280 x 820 at most (90% of the screen), centered
    static func first(on v: CGRect) -> CGRect {
        let w = min(size.width, v.width * 0.9), h = min(size.height, v.height * 0.9)
        return CGRect(x: v.midX - w / 2, y: v.midY - h / 2, width: w, height: h)
    }

    static func restore(saved: CGRect?, screens: [ScreenBox], main: Int) -> CGRect {
        guard !screens.isEmpty else { return saved ?? CGRect(origin: .zero, size: size) }
        let m = screens.indices.contains(main) ? screens[main] : screens[0]
        guard let s = saved, s.width > 0, s.height > 0 else { return first(on: m.visible) }
        // its title bar (the top 28 px, 200 px of it at least) on a screen
        let bar = CGRect(x: s.minX, y: s.maxY - 28, width: s.width, height: 28)
        if let on = screens.first(where: { $0.visible.intersection(bar).width >= min(200, s.width) && $0.visible.intersection(bar).height >= 10 }) {
            return fit(s, in: on.visible)
        }
        // its screen is gone: its size, centered on the main screen
        let v = m.visible
        return fit(CGRect(x: v.midX - s.width / 2, y: v.midY - s.height / 2, width: s.width, height: s.height), in: v)
    }
}

// the activation policy (lead m_8202): a normal app (Dock icon, ⌘Tab)
// only while the window shows, a menu-bar app otherwise; the harness
// never changes it (it never activates)
enum WinPolicy: Equatable {
    case regular, accessory, unchanged
    static func policy(windowShown: Bool, harness: Bool) -> WinPolicy {
        if harness { return .unchanged }
        return windowShown ? .regular : .accessory
    }
}

// a drop on the window: the folders in it add projects (a file or a link
// is the page's); each folder once, in the drop's order
enum WinDrop {
    static func folders(_ items: [(path: String, isDir: Bool)]) -> [String] {
        var seen = Set<String>()
        var out: [String] = []
        for i in items where i.isDir {
            let p = i.path.count > 1 && i.path.hasSuffix("/") ? String(i.path.dropLast()) : i.path
            if seen.insert(p).inserted { out.append(p) }
        }
        return out
    }
}

// a mouse down that moves the window (its title bar is the page's): in a
// drag rect the page gave (win_size drag, CSS px from the top-left), else
// in the top strip until the page says (38 px, the traffic lights' height)
enum WinDrag {
    static let strip: CGFloat = 38

    static func moves(at p: CGPoint, drag: [CGRect]?, width: CGFloat) -> Bool {
        let rects = drag ?? [CGRect(x: 0, y: 0, width: width, height: strip)]
        return rects.contains { $0.contains(p) }
    }

    static func rects(_ v: Any?) -> [CGRect]? {
        guard let a = v as? [Any] else { return nil }
        return a.compactMap { r -> CGRect? in
            guard let n = r as? [NSNumber], n.count == 4 else { return nil }
            return CGRect(x: n[0].doubleValue, y: n[1].doubleValue, width: n[2].doubleValue, height: n[3].doubleValue)
        }
    }
}
