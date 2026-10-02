// The laws of Morning (the morning page, once a day after 05:00), run by
// build.sh --test through the swift interpreter (cat'ed after
// src/Morning.swift). A fixed time zone: no dependence on the Mac's.

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

let paris = TimeZone(identifier: "Europe/Paris")!
func at(_ s: String, _ tz: TimeZone = paris) -> Date {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = tz
    f.dateFormat = "yyyy-MM-dd HH:mm"
    return f.date(from: s)!
}
func due(_ now: String, _ opened: String?, _ ids: [String], _ tz: TimeZone = paris) -> String? {
    Morning.due(now: at(now, tz), tz: tz, openedOn: opened, pageIDs: ids).map { "\($0.id)@\($0.day)" }
}

law("after 05:00 with today's page: open it, remember today",
    due("2026-10-03 08:10", nil, ["morning-2026-10-03"]) == "morning-2026-10-03@2026-10-03")
law("before 05:00: nothing, even with the page", due("2026-10-03 04:59", nil, ["morning-2026-10-03"]) == nil)
law("at 05:00 sharp: open", due("2026-10-03 05:00", nil, ["morning-2026-10-03"]) != nil)
law("once a day: opened today, nothing", due("2026-10-03 09:00", "2026-10-03", ["morning-2026-10-03"]) == nil)
law("opened yesterday: today's opens", due("2026-10-03 09:00", "2026-10-02", ["morning-2026-10-03"]) != nil)
law("no page yet: nothing (and nothing remembered)", due("2026-10-03 06:00", nil, ["weekly"]) == nil)
law("yesterday's page doesn't count", due("2026-10-03 09:00", nil, ["morning-2026-10-02"]) == nil)
law("just after midnight: still before 05:00, nothing", due("2026-10-04 00:30", "2026-10-03", ["morning-2026-10-04"]) == nil)
let tokyo = TimeZone(identifier: "Asia/Tokyo")!
law("the day is the user's local day (Tokyo)",
    due("2026-10-03 06:00", nil, ["morning-2026-10-03"], tokyo) == "morning-2026-10-03@2026-10-03")
law("the page id spells the date with zeros", Morning.pageID(Morning.day(at("2026-01-05 10:00"), paris)) == "morning-2026-01-05")

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Morning laws hold")
