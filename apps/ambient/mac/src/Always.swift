// Always: the pure rules of an app that runs all day (the laws in
// test/AlwaysTests.swift): the core's restart backoff, and which screen
// the capsule sits on.

import Foundation
import CoreGraphics

// the core's restart delays: 0.5 s doubling to 30 s; back to 0.5 s only
// after a run that lived a minute (a core that can't even start, or dies
// at once, never spins)
struct Backoff {
    static let first = 0.5
    static let max = 30.0
    static let healthy = 60.0
    private(set) var next = Backoff.first

    init() {}

    // the delay before the next start, after a run that lived `lived`
    // seconds (0 when it couldn't start at all)
    mutating func after(lived: Double) -> Double {
        if lived >= Backoff.healthy { next = Backoff.first }
        let wait = next
        next = min(next * 2, Backoff.max)
        return wait
    }

    mutating func reset() { next = Backoff.first }
}

// round 9's keys (ambient m_6521, lead m_6551): who has his keystrokes.
// What he opens, the answer to his own ask and a click on the bar take
// them; what bise pushes never does; the bar closing (a pick, esc, a click
// away) gives them back to his app at once, with no extra click. The
// panel is non-activating: his app stays the active app throughout.
struct KeyFocus: Equatable {
    enum In { case openedByHand, answerToAsk, clicked, pushed, closed }
    enum Out: Equatable { case take, giveBack, nothing }
    private(set) var bar = false      // the bar has his keystrokes

    mutating func feed(_ e: In) -> Out {
        switch e {
        case .openedByHand, .answerToAsk, .clicked:
            if bar { return .nothing }
            bar = true
            return .take
        case .pushed:
            return .nothing
        case .closed:
            guard bar else { return .nothing }
            bar = false
            return .giveBack
        }
    }
}

// esc without fn (lead m_8105, harness A bug 1c): who acts on it. The key
// tap sees every esc first; it used to hide the bar even while the bar had
// his keys, so an esc from fn 0 or fn i gave the keys back to his app and
// the page then showed the card again, pushed, keys elsewhere. One rule:
// while the bar has the keys the esc is the page's (the panel gets the key
// itself: a pane steps back to its card, a card is put off, a talk is
// cancelled, the field closes; the page asks app_hide when nothing is
// left), except where the page shows nothing to step back from (none, a
// line, got, an answer not spoken): the app hides the bar as before.
enum EscRoute: Equatable {
    case page       // the page acts on the key it gets; the app does nothing
    case post       // main speaks, the bar without the keys: the app tells the page (hush)
    case dismiss    // the app hides the bar (his esc still reaches his app when the bar hasn't the keys)
    case nothing    // the bar hidden: his esc only

    // kinds of app_content where the page has something to step back from
    static let pageKinds: Set<String> = ["open", "needs", "type", "talk", "hello"]

    static func route(barShown: Bool, barHasKeys: Bool, pageReady: Bool, speaking: Bool, content: String) -> EscRoute {
        guard barShown else { return .nothing }
        if barHasKeys && pageReady && (speaking || pageKinds.contains(content)) { return .page }
        if speaking { return .post }
        return .dismiss
    }
}

// where the bar sits on its screen (Placement.bar): top (round 9, 170 px
// down), bottom centre (S8), or under the menu-bar icon (its rect)
enum BarAnchor: Equatable {
    case top, bottom
    case menu(CGRect)

    var name: String {
        switch self {
        case .top: return "top"
        case .bottom: return "bottom"
        case .menu: return "menu"
        }
    }
}

// a screen as the capsule's placement sees it (Cocoa coords: y up)
struct ScreenBox: Equatable {
    var frame: CGRect
    var visible: CGRect     // without the menu bar and the Dock
}

enum Placement {
    // the capsule's screen: the mouse's when each display has its own menu
    // bar (System Settings › Desktop & Dock › Displays have separate
    // Spaces), else the first screen (the one with the menu bar)
    static func screen(_ screens: [ScreenBox], mouse: CGPoint, separateSpaces: Bool) -> Int? {
        guard !screens.isEmpty else { return nil }
        if separateSpaces, let i = screens.firstIndex(where: { $0.frame.contains(mouse) }) { return i }
        return 0
    }

    // round 9 (ambient m_6521, the user's yes): the bar's screen is the one
    // with the key window (his app's), else the mouse's, else the first
    static func activeScreen(_ screens: [ScreenBox], keyWindowScreen: Int?, mouse: CGPoint) -> Int? {
        guard !screens.isEmpty else { return nil }
        if let k = keyWindowScreen, screens.indices.contains(k) { return k }
        if let i = screens.firstIndex(where: { $0.frame.contains(mouse) }) { return i }
        return 0
    }

    static let barTop: CGFloat = 170

    // round 9: the glass (`glass` in the panel's box, flipped: y down from
    // the box's top) centered on the screen, its top edge 170 px below the
    // screen's top; the panel holds the pearl at the glass's left and grows
    // downward only (the top never moves). Never off the visible area.
    static func bar(_ size: CGSize, glass: CGRect?, on s: ScreenBox, at anchor: BarAnchor = .top) -> CGRect {
        let g = glass ?? CGRect(origin: .zero, size: size)
        let w = min(size.width, s.visible.width)
        let h = min(size.height, s.visible.height)
        var x = s.frame.midX - g.midX
        var top = s.frame.maxY - barTop + g.minY
        switch anchor {
        case .top:
            break
        case .bottom:
            // desktop v9 (S8): cards and the talk at the bottom centre; the
            // glass's bottom edge fixed, it grows upward
            top = s.visible.minY + barBottom + g.maxY
        case .menu(let icon):
            // the pearl's dropdown: the glass's top just under the menu bar,
            // centered on the icon
            x = icon.midX - g.midX
            top = s.visible.maxY - menuGap + g.minY
        }
        x = Swift.min(Swift.max(x, s.visible.minX), s.visible.maxX - w)
        top = Swift.min(top, s.visible.maxY)
        let y = Swift.max(top - h, s.visible.minY)
        return CGRect(x: x, y: y, width: w, height: h)
    }

    static let barBottom: CGFloat = 96   // the glass's bottom edge above the visible area's (the Dock)
    static let menuGap: CGFloat = 6       // under the menu bar, for the dropdown

    // where the bar shows (S8): what he opens by hand to type or browse
    // (fn space, fn a, fn 0, fn i, fn ,) at the top; what bise brings (a
    // card, the talk, an answer) at the bottom centre; the pearl's dropdown
    // under the icon. Chosen when it shows, kept while it shows.
    static func anchorAtShow(asked: BarAnchor?) -> BarAnchor { asked ?? .bottom }

    // harness A (the user: 'nothing in his face, ever', card #428): the
    // screen the harness app places its panels on, far off every real one
    static let offScreen = ScreenBox(frame: CGRect(x: -30000, y: -30000, width: 1920, height: 1200),
                                     visible: CGRect(x: -30000, y: -30000, width: 1920, height: 1200))

    // the harness guard: a frame that touches (or comes within 1 pt of) any
    // real screen; the harness app quits at once on one
    static func touches(_ frame: CGRect, screens: [CGRect]) -> Bool {
        guard !frame.isNull, !frame.isEmpty else { return false }
        return screens.contains { $0.insetBy(dx: -1, dy: -1).intersects(frame) }
    }

    // harness A's keep-off (KeepOff.swift): a rect that touches a real screen
    // goes to the off-screen box, same size; anything else stays as it is
    static func keepOff(_ r: CGRect, screens: [CGRect]) -> CGRect {
        guard touches(r, screens: screens) else { return r }
        return CGRect(origin: offScreen.frame.origin, size: r.size)
    }

    // SPEC §1: 20 px from the screen's right edge, 12 px under the menu bar;
    // never off the screen: a box taller or wider than the visible area is
    // kept inside it, top first
    static func frame(_ size: CGSize, on s: ScreenBox) -> CGRect {
        let w = min(size.width, s.visible.width)
        let h = min(size.height, s.visible.height)
        let top = s.visible.maxY - 12
        let right = min(s.frame.maxX - 20, s.visible.maxX)
        var x = right - w, y = top - h
        x = Swift.max(x, s.visible.minX)
        y = Swift.max(y, s.visible.minY)
        return CGRect(x: x, y: y, width: w, height: h)
    }
}
