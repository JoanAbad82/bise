// Shot: one PNG of the front window (ScreenCaptureKit), when Electron asks
// ({cmd:'shot', id, dir}; cut from the Swift app). Never shown, never
// kept: the core stores it and deletes the file. The skip list: password managers,
// private browser windows, System Settings: nothing is captured, the chip
// says so.

import AppKit
import Carbon.HIToolbox
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

    // the long side of a shot, in pixels (designer m_21901)
    static let longSide: CGFloat = 1600

    // the front app's frontmost normal window, from the window list (front to back); never bise's
    // own: the helper, and Electron's main (its parent), which owns every bise window
    private static func frontWindow() -> (app: NSRunningApplication, id: CGWindowID, bounds: CGRect, name: String, shareable: Bool)? {
        guard let app = NSWorkspace.shared.frontmostApplication,
              app.processIdentifier != getpid(), app.processIdentifier != getppid(),
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
            // kCGWindowSharingNone: its app marks it not shareable (NSWindow.sharingType = .none)
            let sharing = (w[kCGWindowSharingState as String] as? NSNumber)?.uint32Value ?? CGWindowSharingType.readOnly.rawValue
            return (app, id, b, w[kCGWindowName as String] as? String ?? "", sharing != CGWindowSharingType.none.rawValue)
        }
        return nil
    }

    // the front window as a PNG in `dir` (nil result: no front window, or not allowed)
    static func take(into dir: String, skip: Set<String> = SkipList.builtIn) async -> ShotResult? {
        guard let front = frontWindow() else { return nil }
        let appName = front.app.localizedName ?? front.app.bundleIdentifier ?? "?"
        guard allowed else { return nil }
        // a password field has the keys (secure input on), or the window says not shareable:
        // nothing is captured, nothing said (designer m_21901)
        if IsSecureEventInputEnabled() || !front.shareable {
            return ShotResult(app: appName, title: "", skipped: true, path: nil, bounds: front.bounds)
        }
        do {
            let content = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: true)
            guard let win = content.windows.first(where: { $0.windowID == front.id }) else { return nil }
            let title = win.title ?? front.name
            if SkipList.skips(bundle: front.app.bundleIdentifier, title: title, apps: skip) {
                return ShotResult(app: appName, title: "", skipped: true, path: nil, bounds: front.bounds)
            }
            let filter = SCContentFilter(desktopIndependentWindow: win)
            let conf = SCStreamConfiguration()
            // the window at its pixel size, the long side at most longSide
            let scale = CGFloat(filter.pointPixelScale)
            var w = win.frame.width * scale, h = win.frame.height * scale
            let k = min(1, longSide / max(w, h))
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
