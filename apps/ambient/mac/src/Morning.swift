// Morning: the morning page opens in front once a day (roadmap slice E),
// as pure logic (the laws in test/MorningTests.swift). At the first fn
// hold or capsule open after 05:00 local, if the core's state.pages has
// today's `morning-<YYYY-MM-DD>`, it opens; "opened today" is kept across
// restarts (the app's defaults). No page yet (the hub's 07:30 timer hasn't
// made it): nothing, and the next trigger looks again.

import Foundation

enum Morning {
    static let fromHour = 5

    // today's date as the page id spells it, in the user's time zone
    static func day(_ now: Date, _ tz: TimeZone) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = tz
        let c = cal.dateComponents([.year, .month, .day], from: now)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    static func pageID(_ day: String) -> String { "morning-" + day }

    // the page to open now, if any: (its id, the day to remember)
    static func due(now: Date, tz: TimeZone, openedOn: String?, pageIDs: [String]) -> (id: String, day: String)? {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = tz
        guard cal.component(.hour, from: now) >= fromHour else { return nil }
        let today = day(now, tz)
        guard openedOn != today else { return nil }
        let id = pageID(today)
        return pageIDs.contains(id) ? (id, today) : nil
    }
}
