// QuietMonitor: the samples Quiet.swift decides on. The mic: is the default
// input device running somewhere (CoreAudio's DeviceIsRunningSomewhere, a
// property read: it never opens the mic, needs no permission). The
// calendar: EventKit, read-only, only once the user turned the setting on
// (a new permission, asked then, never at launch).

import Foundation
import CoreAudio
import EventKit

enum MicProbe {
    // nil: no default input device (or CoreAudio said no)
    static func running() -> Bool? {
        var dev = AudioDeviceID(0)
        var size = UInt32(MemoryLayout<AudioDeviceID>.size)
        var addr = AudioObjectPropertyAddress(mSelector: kAudioHardwarePropertyDefaultInputDevice,
                                              mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
        guard AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &dev) == noErr, dev != 0 else { return nil }
        var on = UInt32(0)
        size = UInt32(MemoryLayout<UInt32>.size)
        addr.mSelector = kAudioDevicePropertyDeviceIsRunningSomewhere
        guard AudioObjectGetPropertyData(dev, &addr, 0, nil, &size, &on) == noErr else { return nil }
        return on != 0
    }
}

@MainActor
final class CalendarProbe {
    private let store = EKEventStore()

    static var granted: Bool { EKEventStore.authorizationStatus(for: .event) == .fullAccess }

    // macOS's prompt (when the setting is turned on); `done(granted)` on main
    func ask(_ done: @escaping @MainActor (Bool) -> Void) {
        store.requestFullAccessToEvents { ok, err in
            if let err { Log.say("calendar: \(err.localizedDescription)") }
            DispatchQueue.main.async { MainActor.assumeIsolated { done(ok) } }
        }
    }

    // the events around now (an hour each side), as the decision sees them
    func around(_ now: Date) -> [CalendarEvent] {
        guard CalendarProbe.granted else { return [] }
        let pred = store.predicateForEvents(withStart: now.addingTimeInterval(-3600), end: now.addingTimeInterval(3600), calendars: nil)
        return store.events(matching: pred).map { e in
            let me = e.attendees?.first { $0.isCurrentUser }
            let others = (e.attendees ?? []).filter { !$0.isCurrentUser }.count
            return CalendarEvent(start: e.startDate, end: e.endDate, allDay: e.isAllDay,
                                 busy: e.availability != .free, declined: me?.participantStatus == .declined,
                                 attendees: others)
        }
    }
}
