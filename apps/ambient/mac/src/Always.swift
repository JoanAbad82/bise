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
    static func bar(_ size: CGSize, glass: CGRect?, on s: ScreenBox) -> CGRect {
        let g = glass ?? CGRect(origin: .zero, size: size)
        let w = min(size.width, s.visible.width)
        let h = min(size.height, s.visible.height)
        var x = s.frame.midX - g.midX
        var top = s.frame.maxY - barTop + g.minY
        x = Swift.min(Swift.max(x, s.visible.minX), s.visible.maxX - w)
        top = Swift.min(top, s.visible.maxY)
        let y = Swift.max(top - h, s.visible.minY)
        return CGRect(x: x, y: y, width: w, height: h)
    }

    // round 10's side panel: docked to the right edge, full height under the
    // menu bar; the glass's right edge on the visible area's right edge, its
    // top right under the menu bar; the pearl's room at its left. Never
    // taller than the visible area, never above the menu bar.
    static let sideWidth: CGFloat = 440

    static func side(_ size: CGSize, glass: CGRect?, on s: ScreenBox) -> CGRect {
        let g = glass ?? CGRect(origin: .zero, size: size)
        let h = min(size.height, s.visible.height + g.minY)
        let x = s.visible.maxX - g.maxX
        let top = s.visible.maxY + g.minY
        let y = Swift.max(top - h, s.visible.minY)
        return CGRect(x: x, y: y, width: size.width, height: top - y)
    }

    // the glass's height the side panel page draws: the visible height
    static func sideHeight(on s: ScreenBox) -> CGFloat { s.visible.height }

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
