import AppKit
import ServiceManagement

// the settings view's words that the app draws itself (ambient m_5330:
// the ambient surfaces speak as bise)
enum SettingsWords {
    static let menu = "settings…"
    static let menuKeys = "fn ,"
    static let pickTitle = "apps bise never sees"
    static let pickAdd = "add"
}

// open at login (slice 4): macOS keeps it (SMAppService, macOS 13+), for
// this bundle at its one path; never stored by the app
@MainActor
enum LoginItem {
    static var state: LoginState {
        switch SMAppService.mainApp.status {
        case .enabled: return .on
        case .requiresApproval: return .approve
        default: return .off
        }
    }

    // on while macOS waits for the user's OK: its Login Items pane
    static func set(_ on: Bool) {
        let app = SMAppService.mainApp
        do {
            if on {
                if app.status == .requiresApproval { SMAppService.openSystemSettingsLoginItems(); return }
                if app.status != .enabled { try app.register() }
                if app.status == .requiresApproval { SMAppService.openSystemSettingsLoginItems() }
            } else if app.status == .enabled || app.status == .requiresApproval {
                try app.unregister()
            }
        } catch {
            Log.say("app: login item \(on ? "on" : "off") failed: \(error.localizedDescription)")
        }
        Log.say("app: login item now \(state.rawValue)")
    }
}
