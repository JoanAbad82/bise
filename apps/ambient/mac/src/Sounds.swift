import Foundation

// bise's three sounds (ambient m_6259, the user's ask via the lead m_6249),
// one family in E major: Resources/sounds/{listen,think,need}.wav. Pure:
// when each plays and when none does (the laws in test/SoundsTests.swift);
// SoundPlayer.swift plays them.
//   - listen: the mic really opens for a talk (a hold past the tap
//     threshold, or fn fn hands-free). Never a chord, never fn up, never a
//     cancelled hold: think follows within a second, two in a row is chatter.
//   - think: once when the core takes his ask ('sent': main's turn starts
//     from his words, voice or typed). Never for agents' own work.
//   - need: once when a new question, approval or drafts card opens the
//     glass (its single 8 s show). Not when it folds into the count, not on
//     a re-show, not when he opens the inbox himself.
// None when the 'sounds' setting is off, macOS 'Play user interface sound
// effects' is off, while quiet (a call, a meeting, full screen), or in a
// Focus / Do Not Disturb.

enum Sound: String, CaseIterable { case listen, think, need }

struct SoundGate: Equatable {
    var setting = true      // the capsule's 'sounds' toggle
    var uiSounds = true     // macOS 'Play user interface sound effects'
    var quiet = false       // a call, a meeting, full screen
    var focus = false       // a Focus / Do Not Disturb

    var open: Bool { setting && uiSounds && !quiet && !focus }
}

// what just happened, as the app sees it
enum SoundCue: Equatable {
    case talkOpened                                   // the mic opens for a talk
    case talkAsked                                    // a hold that asks a permission instead
    case chord                                        // fn 1, fn o, fn ., fn space…
    case talkEnd                                      // fn up
    case cancelled                                    // a hold with no words
    case sent                                         // the core took his ask
    case mainText, done, failed, page                 // answers, agents' work, pages
    case cards(now: Set<String>, seen: Set<String>?)  // the inbox's ids, and the last state's
    case inboxOpened, reshow, fold                    // he opens it, the glass again, the count
}

enum SoundPlan {
    static func sound(for cue: SoundCue, _ gate: SoundGate) -> Sound? {
        guard gate.open else { return nil }
        switch cue {
        case .talkOpened: return .listen
        case .sent: return .think
        case .cards(let now, let seen):
            // the first state after a launch is not new; a closed card is not new
            guard let seen, !now.subtracting(seen).isEmpty else { return nil }
            return .need
        case .talkAsked, .chord, .talkEnd, .cancelled, .mainText, .done, .failed, .page,
             .inboxOpened, .reshow, .fold:
            return nil
        }
    }

    // macOS's Focus assertions (~/Library/DoNotDisturb/DB/Assertions.json):
    // on when any record is there; unreadable or odd: not in a Focus
    static func focusOn(assertions data: Data?) -> Bool {
        guard let data, let j = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let all = j["data"] as? [[String: Any]] else { return false }
        return all.contains { !(($0["storeAssertionRecords"] as? [Any]) ?? []).isEmpty }
    }
}
