// Perms: macOS's answer for each permission bise needs, and the ways to
// ask (cut from the Swift app's App+Perms; the plan of which to ask when
// is the app's now, Electron's). The helper reads them: Electron spawns it,
// so macOS charges them to bise's app (hello's `responsible` says which
// process). Reads only; a prompt only on {cmd:'perm', action:'ask'}.

import AppKit
import AVFoundation
import ApplicationServices
import EventKit

enum PermWord {
    // macOS's states as the line's words: allowed | denied | ask
    static func av(_ s: AVAuthorizationStatus) -> String {
        switch s {
        case .authorized: return "allowed"
        case .denied, .restricted: return "denied"
        default: return "ask"
        }
    }

    static func ek(_ s: EKAuthorizationStatus) -> String {
        switch s {
        case .fullAccess: return "allowed"
        case .denied, .restricted, .writeOnly: return "denied"
        default: return "ask"
        }
    }

    // Accessibility and the screen: macOS only says granted or not
    static func flag(_ on: Bool) -> String { on ? "allowed" : "ask" }
}

@MainActor
enum Perms {
    static func now() -> [String: Any] {
        Lines.perms(accessibility: PermWord.flag(AXIsProcessTrusted()),
                    mic: PermWord.av(AVCaptureDevice.authorizationStatus(for: .audio)),
                    screen: PermWord.flag(CGPreflightScreenCaptureAccess()),
                    calendar: PermWord.ek(EKEventStore.authorizationStatus(for: .event)))
    }

    // its System Settings pane (Privacy & Security)
    static func pane(_ p: String) -> URL? {
        let privacy = "x-apple.systempreferences:com.apple.preference.security?"
        switch p {
        case "accessibility": return URL(string: privacy + "Privacy_Accessibility")
        case "mic": return URL(string: privacy + "Privacy_Microphone")
        case "screen": return URL(string: privacy + "Privacy_ScreenCapture")
        case "calendar": return URL(string: privacy + "Privacy_Calendars")
        default: return nil
        }
    }

    static func open(_ p: String) {
        if let u = pane(p) { NSWorkspace.shared.open(u) }
    }

    // macOS's own prompt; a refused one can't prompt again: its pane then.
    // `done` on main when macOS answered (the caller says `perms` again)
    static func ask(_ p: String, store: EKEventStore, done: @escaping @MainActor () -> Void) {
        let back = { DispatchQueue.main.async { MainActor.assumeIsolated { done() } } }
        switch p {
        case "accessibility":
            let k = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
            _ = AXIsProcessTrustedWithOptions([k: true] as CFDictionary)
            done()
        case "mic":
            guard AVCaptureDevice.authorizationStatus(for: .audio) == .notDetermined else { open(p); done(); return }
            AVCaptureDevice.requestAccess(for: .audio) { _ in back() }
        case "screen":
            _ = CGRequestScreenCaptureAccess()
            done()
        case "calendar":
            guard EKEventStore.authorizationStatus(for: .event) == .notDetermined else { open(p); done(); return }
            store.requestFullAccessToEvents { _, err in
                if let err { Log.say("calendar: \(err.localizedDescription)") }
                back()
            }
        default:
            done()
        }
    }
}
