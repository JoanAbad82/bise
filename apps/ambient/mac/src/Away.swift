import Foundation

// Away: 'while you were away' (S9, lead m_9025/m_9029). Pure. He leaves when
// the screen locks or sleeps (minus how long he was idle before it); he's
// back at unlock (or at wake when the screen wasn't locked). Gone 30 min or
// more: the app sends {cmd:'away_back', away_ms} to the core (amb-core
// answers {ev:'away_summary'}) and {ev:'app_away', away_ms} to the page,
// which shows one card before any list (app_content kind:'away').
struct Away: Equatable {
    static let threshold = 30.0 * 60     // a pref later (lead m_9029)

    private(set) var leftAt: Date?

    init() {}

    // the screen locked or slept; idle = seconds since his last input then.
    // the first leave counts (lock then sleep is one absence)
    mutating func left(at t: Date, idle: Double) {
        guard leftAt == nil else { return }
        leftAt = t.addingTimeInterval(-max(0, idle))
    }

    // he's back: away_ms when it was long enough, else nil; either way the absence ends
    mutating func back(at t: Date, threshold: Double = Away.threshold) -> Int? {
        guard let l = leftAt else { return nil }
        leftAt = nil
        let gone = t.timeIntervalSince(l)
        return gone >= threshold ? Int(gone * 1000) : nil
    }

    // the moment counts as back: an unlock, or a wake with the screen unlocked
    static func isBack(unlock: Bool, wake: Bool, locked: Bool) -> Bool { unlock || (wake && !locked) }
}
