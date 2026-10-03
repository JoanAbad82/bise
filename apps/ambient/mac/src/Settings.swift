import Foundation

// bise ambient's settings (slice 4, ambient-lead m_5319): what the user
// sets in the capsule's settings view (fn + ,), kept in UserDefaults. Pure:
// the store is two closures, so build.sh --test runs the laws without the
// user's defaults. Launch at login is macOS's own state (SMAppService):
// read each time, never stored here.

// an app the user never wants main to see (the shot's skip list)
struct SkipApp: Equatable {
    var bundle: String
    var name: String
}

enum LoginState: String { case on, off, approve }

// one change the page asked for (app_setting {key, value})
enum SettingChange: Equatable {
    case edgeGlow(Bool), rightOption(Bool), meetingQuiet(Bool), voiceAnswers(Bool), launchAtLogin(Bool), sounds(Bool)
    case skipPick                 // open the app picker
    case skipAdd(SkipApp)         // what the picker chose
    case skipRemove(String)       // a bundle id

    // the page's key and value; nil: a key or a value we don't take
    static func parse(key: String, value: Any?) -> SettingChange? {
        let on = value as? Bool
        switch key {
        case "edge_glow": return on.map(SettingChange.edgeGlow)
        case "right_option": return on.map(SettingChange.rightOption)
        case "meeting_quiet": return on.map(SettingChange.meetingQuiet)
        case "voice_answers": return on.map(SettingChange.voiceAnswers)
        case "launch_at_login": return on.map(SettingChange.launchAtLogin)
        case "sounds": return on.map(SettingChange.sounds)
        case "skip_add": return .skipPick
        case "skip_remove":
            guard let b = (value as? String)?.trimmingCharacters(in: .whitespaces), !b.isEmpty else { return nil }
            return .skipRemove(b)
        default: return nil
        }
    }
}

struct AppSettings: Equatable {
    var edgeGlow = true
    var rightOption = true
    var meetingQuiet = false      // a new permission (the calendar): off until asked
    var voiceAnswers = true
    var sounds = true             // listen, think, need (ambient's three, Sounds.swift)
    var skip: [SkipApp] = []      // the user's own, after the built-in ones

    // the built-in never-seen apps (SPEC §5.2): always skipped, never removed
    static let builtIn: [SkipApp] = [
        SkipApp(bundle: "com.1password.1password", name: "1Password"),
        SkipApp(bundle: "com.agilebits.onepassword7", name: "1Password 7"),
        SkipApp(bundle: "com.agilebits.onepassword-osx", name: "1Password 6"),
        SkipApp(bundle: "com.bitwarden.desktop", name: "Bitwarden"),
        SkipApp(bundle: "com.dashlane.dashlanephonefinal", name: "Dashlane"),
        SkipApp(bundle: "com.lastpass.LastPass", name: "LastPass"),
        SkipApp(bundle: "com.apple.keychainaccess", name: "Keychain Access"),
        SkipApp(bundle: "com.apple.Passwords", name: "Passwords"),
        SkipApp(bundle: "com.apple.systempreferences", name: "System Settings"),
        SkipApp(bundle: "com.apple.Settings", name: "System Settings"),
        SkipApp(bundle: "com.apple.SystemSettings", name: "System Settings"),
    ]
    static let builtInBundles = Set(builtIn.map(\.bundle))
    static let maxSkip = 100

    // every bundle the shot skips
    var skipBundles: Set<String> { AppSettings.builtInBundles.union(skip.map(\.bundle)) }

    static func load(_ get: (String) -> Any?) -> AppSettings {
        var s = AppSettings()
        if let v = get("edgeGlow") as? Bool { s.edgeGlow = v }
        if let v = get("rightOption") as? Bool { s.rightOption = v }
        if let v = get("meetingQuiet") as? Bool { s.meetingQuiet = v }
        if let v = get("voiceAnswers") as? Bool { s.voiceAnswers = v }
        if let v = get("sounds") as? Bool { s.sounds = v }
        if let list = get("skipApps") as? [[String: String]] {
            for d in list {
                if let b = d["bundle"], let n = d["name"] { s = s.adding(SkipApp(bundle: b, name: n)) }
            }
        }
        return s
    }

    func store(_ set: (String, Any) -> Void) {
        set("edgeGlow", edgeGlow)
        set("rightOption", rightOption)
        set("meetingQuiet", meetingQuiet)
        set("voiceAnswers", voiceAnswers)
        set("sounds", sounds)
        set("skipApps", skip.map { ["bundle": $0.bundle, "name": $0.name] })
    }

    // a built-in or one already there: nothing; a blank id: nothing
    func adding(_ a: SkipApp) -> AppSettings {
        let b = a.bundle.trimmingCharacters(in: .whitespaces)
        guard !b.isEmpty, !skipBundles.contains(b), skip.count < AppSettings.maxSkip else { return self }
        var s = self
        let n = a.name.trimmingCharacters(in: .whitespaces)
        s.skip.append(SkipApp(bundle: b, name: n.isEmpty ? b : n))
        return s
    }

    // the stored settings after a change (skipPick and launchAtLogin
    // change nothing here: the picker and macOS do)
    func applying(_ c: SettingChange) -> AppSettings {
        var s = self
        switch c {
        case .edgeGlow(let v): s.edgeGlow = v
        case .rightOption(let v): s.rightOption = v
        case .meetingQuiet(let v): s.meetingQuiet = v
        case .voiceAnswers(let v): s.voiceAnswers = v
        case .sounds(let v): s.sounds = v
        case .skipAdd(let a): return adding(a)
        case .skipRemove(let b): s.skip.removeAll { $0.bundle == b }
        case .launchAtLogin, .skipPick: break
        }
        return s
    }

    // the skip list as the page shows it: built-in names once each, then
    // the user's, in the order added
    var skipRows: [[String: Any]] {
        var seen = Set<String>()
        var rows: [[String: Any]] = []
        for a in AppSettings.builtIn where seen.insert(a.name).inserted {
            rows.append(["bundle": a.bundle, "name": a.name, "fixed": true])
        }
        for a in skip { rows.append(["bundle": a.bundle, "name": a.name, "fixed": false]) }
        return rows
    }

    // app_settings (docs/ambient-app.md §4)
    func event(macos: Int, radius: Double, login: LoginState) -> [String: Any] {
        ["ev": "app_settings", "edge_glow": edgeGlow, "right_option": rightOption,
         "meeting_quiet": meetingQuiet, "voice_answers": voiceAnswers, "sounds": sounds,
         "launch_at_login": login.rawValue, "skip": skipRows,
         "macos": macos, "radius": radius]
    }
}

// the picker's answer: an .app's Info.plist values to a SkipApp
func skipApp(bundleID: String?, displayName: String?, bundleName: String?, file: String) -> SkipApp? {
    guard let b = bundleID?.trimmingCharacters(in: .whitespaces), !b.isEmpty else { return nil }
    let base = (file as NSString).lastPathComponent
    let fromFile = base.hasSuffix(".app") ? String(base.dropLast(4)) : base
    let name = [displayName, bundleName, fromFile].compactMap { $0 }.first { !$0.trimmingCharacters(in: .whitespaces).isEmpty } ?? b
    return SkipApp(bundle: b, name: name)
}
