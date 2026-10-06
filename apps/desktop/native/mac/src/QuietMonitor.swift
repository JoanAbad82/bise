// QuietMonitor: the samples Quiet.swift decides on. The mic: is the default
// input device running somewhere (CoreAudio's DeviceIsRunningSomewhere, a
// property read: it never opens the mic, needs no permission). The
// calendar: EventKit, read-only, only once the user turned the setting on
// (a new permission, asked then, never at launch). S9 adds the cameras and
// a shared screen, both reads with no permission.

import Foundation
import CoreAudio
import CoreMediaIO
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

// the cameras (S9): does one run somewhere? CoreMediaIO's
// DeviceIsRunningSomewhere on each video device, a property read: it never
// opens a camera and needs no permission. nil: CoreMediaIO said no
enum CameraProbe {
    static func running() -> Bool? {
        var addr = CMIOObjectPropertyAddress(mSelector: CMIOObjectPropertySelector(kCMIOHardwarePropertyDevices),
                                             mScope: CMIOObjectPropertyScope(kCMIOObjectPropertyScopeGlobal),
                                             mElement: CMIOObjectPropertyElement(kCMIOObjectPropertyElementMain))
        var size = UInt32(0)
        let sys = CMIOObjectID(kCMIOObjectSystemObject)
        guard CMIOObjectGetPropertyDataSize(sys, &addr, 0, nil, &size) == noErr else { return nil }
        let n = Int(size) / MemoryLayout<CMIOObjectID>.size
        if n == 0 { return false }
        var ids = [CMIOObjectID](repeating: 0, count: n)
        var used = UInt32(0)
        guard CMIOObjectGetPropertyData(sys, &addr, 0, nil, size, &used, &ids) == noErr else { return nil }
        addr.mSelector = CMIOObjectPropertySelector(kCMIODevicePropertyDeviceIsRunningSomewhere)
        for id in ids {
            var on = UInt32(0)
            let sz = UInt32(MemoryLayout<UInt32>.size)
            if CMIOObjectGetPropertyData(id, &addr, 0, nil, sz, &used, &on) == noErr, on != 0 { return true }
        }
        return false
    }
}

// his screen shared or recorded (S9): the window server knows whether a
// screen watcher is present (CGSIsScreenWatcherPresent, private, looked up
// at run time: missing = we can't tell, nil, never a crash)
enum SharingProbe {
    private typealias Fn = @convention(c) () -> Bool
    private static let fn: Fn? = {
        for name in ["SLSIsScreenWatcherPresent", "CGSIsScreenWatcherPresent"] {
            if let p = dlsym(UnsafeMutableRawPointer(bitPattern: -2), name) { return unsafeBitCast(p, to: Fn.self) }
        }
        return nil
    }()
    static func present() -> Bool? { fn?() }
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
