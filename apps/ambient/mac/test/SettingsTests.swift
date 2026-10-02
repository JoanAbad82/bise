// The laws of AppSettings and SettingChange (slice 4), run by build.sh
// --test through the swift interpreter (cat'ed after src/Settings.swift).
// A dictionary stands for UserDefaults: never the user's own settings.

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

var store: [String: Any] = [:]
func save(_ s: AppSettings) { s.store { store[$0] = $1 } }
func reload() -> AppSettings { AppSettings.load { store[$0] } }

let fresh = AppSettings.load { _ in nil }
law("nothing stored: glow on, right ⌥ on, voice on, meetings off, no own apps",
    fresh.edgeGlow && fresh.rightOption && fresh.voiceAnswers && !fresh.meetingQuiet && fresh.skip.isEmpty)
law("nothing stored: the built-in apps are skipped",
    fresh.skipBundles.contains("com.1password.1password") && fresh.skipBundles.contains("com.apple.systempreferences"))

// parse
law("a bool key takes a bool", SettingChange.parse(key: "voice_answers", value: false) == .voiceAnswers(false))
law("a bool key refuses a string", SettingChange.parse(key: "edge_glow", value: "no") == nil)
law("a bool key refuses no value", SettingChange.parse(key: "right_option", value: nil) == nil)
law("an unknown key is refused", SettingChange.parse(key: "fly", value: true) == nil)
law("skip_add opens the picker, whatever the value", SettingChange.parse(key: "skip_add", value: nil) == .skipPick)
law("skip_remove takes a bundle id", SettingChange.parse(key: "skip_remove", value: " com.x.y ") == .skipRemove("com.x.y"))
law("skip_remove refuses a blank id", SettingChange.parse(key: "skip_remove", value: "  ") == nil)
law("launch_at_login takes a bool", SettingChange.parse(key: "launch_at_login", value: true) == .launchAtLogin(true))

// apply + store round trip
var s = fresh.applying(.edgeGlow(false)).applying(.voiceAnswers(false)).applying(.meetingQuiet(true)).applying(.rightOption(false))
save(s)
law("the changes come back after a restart", reload() == s)
law("launch at login is never stored (macOS keeps it)", fresh.applying(.launchAtLogin(true)) == fresh && store["launchAtLogin"] == nil)
law("the picker opening changes nothing", fresh.applying(.skipPick) == fresh)

// the skip list
let slack = SkipApp(bundle: "com.tinyspeck.slackmacgap", name: "Slack")
s = fresh.applying(.skipAdd(slack))
law("an added app is skipped", s.skipBundles.contains("com.tinyspeck.slackmacgap") && s.skip == [slack])
law("adding it again keeps one", s.applying(.skipAdd(slack)).skip.count == 1)
law("a built-in app is never added twice",
    fresh.applying(.skipAdd(SkipApp(bundle: "com.bitwarden.desktop", name: "Bitwarden"))).skip.isEmpty)
law("a blank id is not added", fresh.applying(.skipAdd(SkipApp(bundle: " ", name: "x"))).skip.isEmpty)
law("a blank name shows the id",
    fresh.applying(.skipAdd(SkipApp(bundle: "com.x", name: " "))).skip.first?.name == "com.x")
let notes = SkipApp(bundle: "com.apple.Notes", name: "Notes")
s = s.applying(.skipAdd(notes))
law("the user's apps keep their order", s.skip.map(\.name) == ["Slack", "Notes"])
save(s)
law("the user's apps come back after a restart", reload().skip == [slack, notes])
law("a removed app is no longer skipped",
    !s.applying(.skipRemove("com.tinyspeck.slackmacgap")).skipBundles.contains("com.tinyspeck.slackmacgap"))
law("a built-in app can't be removed",
    fresh.applying(.skipRemove("com.1password.1password")).skipBundles.contains("com.1password.1password"))
var many = fresh
for i in 0..<150 { many = many.applying(.skipAdd(SkipApp(bundle: "com.app.\(i)", name: "app \(i)"))) }
law("the list stops at 100 apps", many.skip.count == AppSettings.maxSkip)
store["skipApps"] = [["bundle": "com.1password.1password", "name": "1Password"], ["bundle": "com.x"], ["bundle": "com.y", "name": "Y"]]
law("a stored list drops built-ins and broken rows", reload().skip == [SkipApp(bundle: "com.y", name: "Y")])

// the page's rows and the event
let rows = s.skipRows
let fixed = rows.filter { $0["fixed"] as? Bool == true }.compactMap { $0["name"] as? String }
law("built-in rows come first, each name once", fixed.count == Set(fixed).count && fixed.first == "1Password"
    && fixed.filter { $0 == "System Settings" }.count == 1)
law("the user's rows follow, not fixed",
    rows.suffix(2).map { $0["name"] as? String } == ["Slack", "Notes"] && rows.suffix(2).allSatisfy { $0["fixed"] as? Bool == false })
let ev = fresh.applying(.voiceAnswers(false)).event(macos: 15, radius: 10, login: .approve)
law("app_settings carries every field",
    ev["ev"] as? String == "app_settings" && ev["voice_answers"] as? Bool == false && ev["right_option"] as? Bool == true
    && ev["launch_at_login"] as? String == "approve" && ev["macos"] as? Int == 15 && ev["radius"] as? Double == 10
    && ev["edge_glow"] as? Bool == true && ev["meeting_quiet"] as? Bool == false && (ev["skip"] as? [[String: Any]])?.isEmpty == false)

// the picker's answer
law("a picked app: its display name",
    skipApp(bundleID: "com.tinyspeck.slackmacgap", displayName: "Slack", bundleName: "Slack Helper", file: "/Applications/Slack.app")
        == SkipApp(bundle: "com.tinyspeck.slackmacgap", name: "Slack"))
law("no display name: the bundle name, then the file",
    skipApp(bundleID: "a.b", displayName: nil, bundleName: "B", file: "/x/B.app")?.name == "B"
        && skipApp(bundleID: "a.b", displayName: " ", bundleName: nil, file: "/x/Thing.app")?.name == "Thing")
law("no bundle id: not an app we can skip", skipApp(bundleID: nil, displayName: "X", bundleName: nil, file: "/x/X.app") == nil)

if failures > 0 { print("\(failures) Settings law(s) failed"); exit(1) }
print("all Settings laws hold")
