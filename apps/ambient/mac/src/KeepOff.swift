// KeepOff: harness A only (the user: 'nothing in his face, ever', card
// #428). Proof run #2 quit on AppKit's own text-input window (TUINSWindow,
// the input-source / dictation indicator) made at (0,0,500,500) once the
// web view became the text input client: a window the app doesn't make
// itself. So in harness mode every NSWindow of the process, ours or
// AppKit's, is kept off his screens from its init: its content rect, every
// frame change and every ordering-in go through Placement.keepOff, which
// moves a rect that touches a real screen to Placement.offScreen (same
// size) before the window server has it there. The harness guard stays the
// backstop (any frame on a real screen quits). Never installed in a normal
// launch.

import AppKit
import ObjectiveC

@MainActor
enum KeepOff {
    private(set) static var installed = false

    static func fix(_ r: NSRect) -> NSRect {
        Placement.keepOff(r, screens: NSScreen.screens.map(\.frame))
    }

    static func install() {
        guard !installed else { return }
        installed = true
        // the init: a new window's content rect (its first frame). Replaced
        // through an IMP that passes self and the result as raw pointers, so
        // init's ownership rules (self consumed, result retained) are untouched
        let initSel = NSSelectorFromString("initWithContentRect:styleMask:backing:defer:")
        if let m = class_getInstanceMethod(NSWindow.self, initSel) {
            typealias Init = @convention(c) (UnsafeRawPointer, Selector, NSRect, UInt, UInt, Bool) -> UnsafeRawPointer?
            let orig = unsafeBitCast(method_getImplementation(m), to: Init.self)
            let block: @convention(block) (UnsafeRawPointer, NSRect, UInt, UInt, Bool) -> UnsafeRawPointer? = { me, r, style, backing, d in
                let safe = MainActor.assumeIsolated { KeepOff.fix(r) }
                return orig(me, initSel, safe, style, backing, d)
            }
            method_setImplementation(m, imp_implementationWithBlock(block))
        }
        swap("setFrame:display:", "bise_keepOffSetFrame:display:")
        swap("setFrameOrigin:", "bise_keepOffSetFrameOrigin:")
        swap("setFrameTopLeftPoint:", "bise_keepOffSetFrameTopLeftPoint:")
        swap("orderWindow:relativeTo:", "bise_keepOffOrderWindow:relativeTo:")
    }

    private static func swap(_ a: String, _ b: String) {
        guard let ma = class_getInstanceMethod(NSWindow.self, NSSelectorFromString(a)),
              let mb = class_getInstanceMethod(NSWindow.self, NSSelectorFromString(b)) else { return }
        method_exchangeImplementations(ma, mb)
    }
}

extension NSWindow {
    // after the swap, each bise_ call below runs AppKit's original
    @objc(bise_keepOffSetFrame:display:)
    func bise_keepOffSetFrame(_ r: NSRect, display: Bool) {
        bise_keepOffSetFrame(MainActor.assumeIsolated { KeepOff.fix(r) }, display: display)
    }

    @objc(bise_keepOffSetFrameOrigin:)
    func bise_keepOffSetFrameOrigin(_ p: NSPoint) {
        let size = frame.size
        bise_keepOffSetFrameOrigin(MainActor.assumeIsolated { KeepOff.fix(NSRect(origin: p, size: size)) }.origin)
    }

    @objc(bise_keepOffSetFrameTopLeftPoint:)
    func bise_keepOffSetFrameTopLeftPoint(_ p: NSPoint) {
        let size = frame.size
        let f = MainActor.assumeIsolated { KeepOff.fix(NSRect(x: p.x, y: p.y - size.height, width: size.width, height: size.height)) }
        bise_keepOffSetFrameTopLeftPoint(NSPoint(x: f.minX, y: f.maxY))
    }

    @objc(bise_keepOffOrderWindow:relativeTo:)
    func bise_keepOffOrderWindow(_ place: NSWindow.OrderingMode, relativeTo other: Int) {
        if place != .out {
            let f = frame
            let safe = MainActor.assumeIsolated { KeepOff.fix(f) }
            if safe != f { setFrame(safe, display: false) }
        }
        bise_keepOffOrderWindow(place, relativeTo: other)
    }
}
