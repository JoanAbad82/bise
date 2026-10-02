import Foundation

// The permission asks (SPEC §5.8), one pure plan (the laws in
// test/PermsTests.swift): one permission at a time, each only when first
// needed, its sentence in the capsule first ('continue' opens macOS's
// prompt), a refusal said once, never asked twice.
//   - Accessibility at launch: fn can't be heard without it.
//   - the mic at the first fn hold, then the screen right after the mic is
//     granted (or at the next hold): the hold that asks doesn't talk.
// App runs it against macOS; QA runs it against fake states (never a real
// prompt).

enum Perm: String, CaseIterable { case accessibility, mic, screen }
enum Grant: Equatable { case unknown, granted, denied }

struct PermState: Equatable {
    var accessibility = Grant.unknown     // macOS says trusted or not: never .denied
    var mic = Grant.unknown
    var screen = Grant.unknown            // macOS only says allowed or not: .granted or .unknown
    var asked: Set<String> = []           // the capsule asked once (continue or not now)
    var told: Set<String> = []            // the refused line was said once

    func grant(_ p: Perm) -> Grant {
        switch p { case .accessibility: return accessibility; case .mic: return mic; case .screen: return screen }
    }
    mutating func set(_ p: Perm, _ g: Grant) {
        switch p { case .accessibility: accessibility = g; case .mic: mic = g; case .screen: screen = g }
    }
}

enum PermDo: Equatable {
    case ask(Perm)            // the capsule's sentence (app_perm state ask)
    case denied(Perm)         // the refused line, once (app_perm state denied)
    case granted(Perm)        // app_perm state granted
    case prompt(Perm)         // macOS's own prompt
    case settings(Perm)       // the System Settings pane
    case startKeys            // the fn tap
    case watchTrust           // poll Accessibility until it's granted
}

enum PermPlan {
    // the refused line, once ever
    private static func refuse(_ p: Perm, _ s: inout PermState) -> [PermDo] {
        guard !s.told.contains(p.rawValue) else { return [] }
        s.told.insert(p.rawValue)
        return [.denied(p)]
    }

    // at launch (and at every launch): only Accessibility
    static func launch(_ s: inout PermState) -> [PermDo] {
        if s.accessibility == .granted { return [.startKeys] }
        if s.asked.contains(Perm.accessibility.rawValue) { return refuse(.accessibility, &s) + [.watchTrust] }
        return [.ask(.accessibility), .watchTrust]
    }

    // a fn hold: what to say first; talk = false: this hold doesn't talk
    static func hold(_ s: inout PermState) -> (talk: Bool, do: [PermDo]) {
        switch s.mic {
        case .unknown:
            // asked and left at 'not now': never asked again, a hold does nothing
            return (false, s.asked.contains(Perm.mic.rawValue) ? [] : [.ask(.mic)])
        case .denied:
            return (false, refuse(.mic, &s))
        case .granted:
            break
        }
        if s.screen != .granted {
            if !s.asked.contains(Perm.screen.rawValue) { return (false, [.ask(.screen)]) }
            return (true, refuse(.screen, &s))       // talks, without the shot
        }
        return (true, [])
    }

    // the page's answer to an ask: continue, not now, settings
    static func command(_ p: Perm, _ action: String, _ s: inout PermState) -> [PermDo] {
        switch action {
        case "settings":
            return [.settings(p)]
        case "not_now":
            s.asked.insert(p.rawValue)
            return refuse(p, &s)
        case "continue":
            guard !s.asked.contains(p.rawValue) || s.grant(p) == .unknown else { return [] }
            s.asked.insert(p.rawValue)
            return p == .accessibility ? [.prompt(p), .watchTrust] : [.prompt(p)]
        default:
            return []
        }
    }

    // macOS answered a prompt (or Accessibility turned on)
    static func answered(_ p: Perm, granted: Bool, _ s: inout PermState) -> [PermDo] {
        s.set(p, granted ? .granted : (p == .mic ? .denied : .unknown))
        guard granted else { return refuse(p, &s) }
        var out: [PermDo] = [.granted(p)]
        if p == .accessibility { out.append(.startKeys) }
        // the next one right after, still one at a time
        if p == .mic && s.screen != .granted && !s.asked.contains(Perm.screen.rawValue) { out.append(.ask(.screen)) }
        return out
    }
}
