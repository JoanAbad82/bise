// Shot: one PNG of the front window (ScreenCaptureKit), when Electron asks
// ({cmd:'shot', id, dir}; cut from apps/ambient/mac). Never shown, never
// kept: the core stores it and deletes the file. The skip list: password managers,
// private browser windows, System Settings: nothing is captured, the chip
// says so.

import AppKit
import ScreenCaptureKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

struct ShotResult {
    var app: String
    var title: String
    var skipped: Bool
    var path: String?          // the PNG, when taken
    var bounds: CGRect?        // CG global coords (top-left origin), for the corners
}

// the skip list (SkipList) lives in FrontRules.swift: the fn context obeys it too

@MainActor
enum Shot {
    static var allowed: Bool { CGPreflightScreenCaptureAccess() }

    // the front app's frontmost normal window, from the window list (front to back)
    private static func frontWindow() -> (app: NSRunningApplication, id: CGWindowID, bounds: CGRect, name: String)? {
        guard let app = NSWorkspace.shared.frontmostApplication,
              app.processIdentifier != ProcessInfo.processInfo.processIdentifier,
              let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]]
        else { return nil }
        for w in list {
            guard (w[kCGWindowOwnerPID as String] as? NSNumber)?.int32Value == app.processIdentifier,
                  (w[kCGWindowLayer as String] as? NSNumber)?.intValue == 0,
                  ((w[kCGWindowAlpha as String] as? NSNumber)?.doubleValue ?? 1) > 0,
                  let id = (w[kCGWindowNumber as String] as? NSNumber)?.uint32Value,
                  let bd = w[kCGWindowBounds as String] as? NSDictionary,
                  let b = CGRect(dictionaryRepresentation: bd), b.width >= 60, b.height >= 40
            else { continue }
            return (app, id, b, w[kCGWindowName as String] as? String ?? "")
        }
        return nil
    }

    // the front window as a PNG in `dir` (nil result: no front window, or not allowed)
    static func take(into dir: String, skip: Set<String> = SkipList.builtIn) async -> ShotResult? {
        guard let front = frontWindow() else { return nil }
        let appName = front.app.localizedName ?? front.app.bundleIdentifier ?? "?"
        guard allowed else { return nil }
        do {
            let content = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: true)
            guard let win = content.windows.first(where: { $0.windowID == front.id }) else { return nil }
            let title = win.title ?? front.name
            if SkipList.skips(bundle: front.app.bundleIdentifier, title: title, apps: skip) {
                return ShotResult(app: appName, title: "", skipped: true, path: nil, bounds: front.bounds)
            }
            let filter = SCContentFilter(desktopIndependentWindow: win)
            let conf = SCStreamConfiguration()
            // the window at its pixel size, the long side at most 2000 px
            let scale = CGFloat(filter.pointPixelScale)
            var w = win.frame.width * scale, h = win.frame.height * scale
            let k = min(1, 2000 / max(w, h))
            w *= k; h *= k
            conf.width = Int(w.rounded())
            conf.height = Int(h.rounded())
            conf.showsCursor = false
            conf.ignoreShadowsSingleWindow = true
            let img = try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: conf)
            try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
            let path = dir + "/shot-\(UUID().uuidString.prefix(8)).png"
            guard let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil) else { return nil }
            CGImageDestinationAddImage(dest, img, nil)
            guard CGImageDestinationFinalize(dest) else { return nil }
            return ShotResult(app: appName, title: title, skipped: false, path: path, bounds: front.bounds)
        } catch {
            Log.say("shot: \(error.localizedDescription)")
            return nil
        }
    }
}
