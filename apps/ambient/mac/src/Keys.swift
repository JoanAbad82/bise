// Keys: one active CGEventTap (keyDown, keyUp, flagsChanged), under
// Accessibility. It feeds KeyMachine and swallows what the machine says
// (fn + a bise key: fn + 1 must not type a 1 in the front app); every
// other event passes untouched. macOS disables a tap that is too slow or
// on user input: it is re-enabled at once.

import AppKit
import ApplicationServices

private let kVKFunction: Int64 = 63
private let kVKRightOption: Int64 = 61

@MainActor
final class Keys {
    var onOut: ((KeyOut) -> Void)?

    private var machine = KeyMachine()
    private var tap: CFMachPort?
    private var source: CFRunLoopSource?
    private var tickJob: DispatchWorkItem?
    private var lastFlags: CGEventFlags = []

    var rightOption: Bool {
        get { machine.rightOption }
        set { machine.rightOption = newValue }
    }

    var talking: Bool { machine.talking != nil || machine.handsFree }

    static var trusted: Bool { AXIsProcessTrusted() }

    // macOS's own Accessibility prompt (once per binary)
    static func prompt() {
        let k = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
        _ = AXIsProcessTrustedWithOptions([k: true] as CFDictionary)
    }

    var running: Bool { tap != nil }

    @discardableResult
    func start() -> Bool {
        if tap != nil { return true }
        let mask = (1 << CGEventType.keyDown.rawValue) | (1 << CGEventType.keyUp.rawValue) | (1 << CGEventType.flagsChanged.rawValue)
        let me = Unmanaged.passUnretained(self).toOpaque()
        let cb: CGEventTapCallBack = { _, type, event, info in
            guard let info else { return Unmanaged.passUnretained(event) }
            let keys = Unmanaged<Keys>.fromOpaque(info).takeUnretainedValue()
            // the tap's source is on the main run loop: we are on the main thread
            let swallow = MainActor.assumeIsolated { keys.handle(type, event) }
            return swallow ? nil : Unmanaged.passUnretained(event)
        }
        guard let t = CGEvent.tapCreate(tap: .cgSessionEventTap, place: .headInsertEventTap, options: .defaultTap,
                                        eventsOfInterest: CGEventMask(mask), callback: cb, userInfo: me) else {
            Log.say("keys: no event tap (Accessibility?)")
            return false
        }
        tap = t
        source = CFMachPortCreateRunLoopSource(nil, t, 0)
        CFRunLoopAddSource(CFRunLoopGetMain(), source, .commonModes)
        CGEvent.tapEnable(tap: t, enable: true)
        Log.say("keys: tap on")
        return true
    }

    func stop() {
        if let t = tap { CGEvent.tapEnable(tap: t, enable: false) }
        if let s = source { CFRunLoopRemoveSource(CFRunLoopGetMain(), s, .commonModes) }
        tap = nil
        source = nil
    }

    private func now() -> Double { ProcessInfo.processInfo.systemUptime }

    private func handle(_ type: CGEventType, _ e: CGEvent) -> Bool {
        switch type {
        case .tapDisabledByTimeout, .tapDisabledByUserInput:
            if let t = tap { CGEvent.tapEnable(tap: t, enable: true) }
            Log.say("keys: tap re-enabled (\(type == .tapDisabledByTimeout ? "timeout" : "user input"))")
            return false
        case .flagsChanged:
            let code = e.getIntegerValueField(.keyboardEventKeycode)
            let flags = e.flags
            defer { lastFlags = flags }
            if code == kVKFunction {
                return feed(flags.contains(.maskSecondaryFn) ? .fnDown : .fnUp)
            }
            if code == kVKRightOption {
                // right option alone: its own bit, and no other modifier held
                let others: CGEventFlags = [.maskShift, .maskControl, .maskCommand]
                if flags.contains(.maskAlternate) && flags.intersection(others).isEmpty { return feed(.roptDown) }
                return feed(.roptUp)
            }
            let mods: CGEventFlags = [.maskShift, .maskControl, .maskCommand, .maskAlternate]
            if flags.intersection(mods) != lastFlags.intersection(mods) { return feed(.otherModifiers) }
            return false
        case .keyDown:
            let code = Int(e.getIntegerValueField(.keyboardEventKeycode))
            let rep = e.getIntegerValueField(.keyboardEventAutorepeat) != 0
            return feed(.keyDown(code, repeated: rep))
        case .keyUp:
            return feed(.keyUp(Int(e.getIntegerValueField(.keyboardEventKeycode))))
        default:
            return false
        }
    }

    private func feed(_ e: KeyIn) -> Bool {
        let r = machine.feed(e, at: now())
        for o in r.out { onOut?(o) }
        scheduleTick()
        return r.swallow
    }

    // the hold threshold: a tick when the machine asks for one
    private func scheduleTick() {
        tickJob?.cancel()
        tickJob = nil
        guard let at = machine.nextTick else { return }
        let job = DispatchWorkItem { [weak self] in
            MainActor.assumeIsolated {
                guard let self else { return }
                let r = self.machine.feed(.tick, at: self.now())
                for o in r.out { self.onOut?(o) }
            }
        }
        tickJob = job
        DispatchQueue.main.asyncAfter(deadline: .now() + max(0, at - now()) + 0.001, execute: job)
    }
}

// "press 🌐 to" (System Settings › Keyboard): fn alone may also switch the
// input source, show the emoji or dictate; bise shows the switch when it
// isn't "do nothing" (SPEC §5.4)
func globeUse() -> String {
    let v = CFPreferencesCopyAppValue("AppleFnUsageType" as CFString, "com.apple.HIToolbox" as CFString) as? NSNumber
    switch v?.intValue {
    case 0: return "none"
    case 1: return "input"
    case 2: return "emoji"
    case 3: return "dictation"
    default: return "unknown"
    }
}
