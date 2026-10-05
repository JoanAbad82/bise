// VirtualDisplay: an off-screen display for harness A (lead m_7962): the
// real app's bar, side panel and edge glow are placed on it, so nothing
// shows on the user's screens. CoreGraphics' private CGVirtualDisplay
// classes (macOS 11+), reached through the Objective-C runtime and guarded
// at every step (a missing class or selector = no display, never a crash:
// ambient m_6810's KVC crash). Placed at the far bottom-right corner of his
// arrangement with an app-only configuration (gone when the app quits).
// Only harness mode makes one.

import AppKit
import ObjectiveC

@MainActor
final class VirtualDisplay {
    private(set) var displayID: CGDirectDisplayID = 0
    private var display: NSObject?      // kept alive: the display lives as long as it does
    private(set) var why = ""           // why there is none

    var screen: NSScreen? {
        guard displayID != 0 else { return nil }
        return NSScreen.screens.first {
            ($0.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber)?.uint32Value == displayID
        }
    }

    private static func cls(_ name: String) -> NSObject.Type? { NSClassFromString(name) as? NSObject.Type }

    private static func set(_ o: NSObject, _ key: String, _ v: Any) -> Bool {
        let setter = "set" + key.prefix(1).uppercased() + key.dropFirst() + ":"
        guard o.responds(to: NSSelectorFromString(setter)) else { return false }
        o.setValue(v, forKey: key)
        return true
    }

    private static func alloc(_ c: NSObject.Type) -> NSObject? {
        (c as AnyObject).perform(NSSelectorFromString("alloc"))?.takeUnretainedValue() as? NSObject
    }

    // make it (w x h points, 1x); ready() once macOS lists its NSScreen
    func make(width: UInt32 = 1920, height: UInt32 = 1200, ready: @escaping (NSScreen?) -> Void) {
        guard let D = Self.cls("CGVirtualDisplayDescriptor"), let V = Self.cls("CGVirtualDisplay"),
              let S = Self.cls("CGVirtualDisplaySettings"), let M = Self.cls("CGVirtualDisplayMode") else {
            why = "no CGVirtualDisplay classes in this macOS"
            ready(nil); return
        }
        let desc = D.init()
        let ok = Self.set(desc, "name", "bise ambient harness")
            && Self.set(desc, "maxPixelsWide", NSNumber(value: width))
            && Self.set(desc, "maxPixelsHigh", NSNumber(value: height))
            && Self.set(desc, "sizeInMillimeters", NSValue(size: NSSize(width: Double(width) * 0.25, height: Double(height) * 0.25)))
            && Self.set(desc, "productID", NSNumber(value: 0xB15E))
            && Self.set(desc, "vendorID", NSNumber(value: 0xB15E))
            && Self.set(desc, "serialNum", NSNumber(value: 1))
        _ = Self.set(desc, "queue", DispatchQueue.main)
        guard ok else { why = "CGVirtualDisplayDescriptor: a property is missing"; ready(nil); return }

        let initDesc = NSSelectorFromString("initWithDescriptor:")
        guard let raw = Self.alloc(V), raw.responds(to: initDesc),
              let d = raw.perform(initDesc, with: desc)?.takeUnretainedValue() as? NSObject else {
            why = "CGVirtualDisplay initWithDescriptor: failed"; ready(nil); return
        }
        // one mode: width x height at 60 Hz, not HiDPI
        let initMode = NSSelectorFromString("initWithWidth:height:refreshRate:")
        guard let mraw = Self.alloc(M), let mm = class_getInstanceMethod(M, initMode) else {
            why = "CGVirtualDisplayMode: no initWithWidth:height:refreshRate:"; ready(nil); return
        }
        typealias InitMode = @convention(c) (AnyObject, Selector, UInt32, UInt32, Double) -> Unmanaged<AnyObject>?
        guard let mode = unsafeBitCast(method_getImplementation(mm), to: InitMode.self)(mraw, initMode, width, height, 60)?.takeUnretainedValue() else {
            why = "CGVirtualDisplayMode init failed"; ready(nil); return
        }
        let settings = S.init()
        guard Self.set(settings, "modes", [mode]) else { why = "CGVirtualDisplaySettings: no modes"; ready(nil); return }
        _ = Self.set(settings, "hiDPI", NSNumber(value: 0))
        let apply = NSSelectorFromString("applySettings:")
        guard let am = class_getInstanceMethod(V, apply) else { why = "CGVirtualDisplay: no applySettings:"; ready(nil); return }
        typealias Apply = @convention(c) (AnyObject, Selector, AnyObject) -> Bool
        guard unsafeBitCast(method_getImplementation(am), to: Apply.self)(d, apply, settings) else {
            why = "CGVirtualDisplay applySettings: refused"; ready(nil); return
        }
        guard d.responds(to: NSSelectorFromString("displayID")), let id = (d.value(forKey: "displayID") as? NSNumber)?.uint32Value, id != 0 else {
            why = "CGVirtualDisplay: no displayID"; ready(nil); return
        }
        display = d
        displayID = id
        placeFar()
        // macOS lists the new screen a beat later
        wait(ready, tries: 40)
    }

    // the far bottom-right corner of his arrangement, for this app only
    private func placeFar() {
        var cfg: CGDisplayConfigRef?
        guard CGBeginDisplayConfiguration(&cfg) == .success, let cfg else { return }
        var maxX: Int32 = 0, maxY: Int32 = 0
        var n: UInt32 = 0
        CGGetActiveDisplayList(0, nil, &n)
        var ids = [CGDirectDisplayID](repeating: 0, count: Int(n))
        CGGetActiveDisplayList(n, &ids, &n)
        for i in ids where i != displayID {
            let b = CGDisplayBounds(i)
            maxX = max(maxX, Int32(b.maxX)); maxY = max(maxY, Int32(b.maxY))
        }
        CGConfigureDisplayOrigin(cfg, displayID, maxX, maxY)
        if CGCompleteDisplayConfiguration(cfg, .forAppOnly) != .success { CGCancelDisplayConfiguration(cfg) }
    }

    private func wait(_ ready: @escaping (NSScreen?) -> Void, tries: Int) {
        if let s = screen { ready(s); return }
        guard tries > 0 else { why = "the virtual display never showed up as a screen"; ready(nil); return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
            MainActor.assumeIsolated { self?.wait(ready, tries: tries - 1) }
        }
    }

    var info: [String: Any] {
        guard let s = screen else { return ["virtual": false, "why": why] }
        let f = s.frame
        return ["virtual": true, "id": Int(displayID), "frame": ["x": f.minX, "y": f.minY, "w": f.width, "h": f.height]]
    }
}
