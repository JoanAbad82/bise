import AudioToolbox
import Foundation

// plays SoundPlan's sounds (Sounds.swift) as macOS system sounds: loaded
// once at launch (low latency), at the system alert volume, no ducking of
// his audio, and flagged as UI sounds so macOS itself skips them when
// 'Play user interface sound effects' is off. One at a time: a new one
// cuts the one still playing.
@MainActor
final class SoundPlayer {
    private var ids: [Sound: SystemSoundID] = [:]
    private var urls: [Sound: URL] = [:]
    private var playing: Sound?

    init(dir: String = Bundle.main.resourcePath.map { $0 + "/sounds" } ?? "") {
        for s in Sound.allCases {
            let u = URL(fileURLWithPath: dir + "/\(s.rawValue).wav")
            guard FileManager.default.fileExists(atPath: u.path) else {
                Log.say("sounds: no \(s.rawValue).wav in \(dir)")
                continue
            }
            urls[s] = u
            load(s)
        }
    }

    private func load(_ s: Sound) {
        guard let u = urls[s] else { return }
        var id: SystemSoundID = 0
        guard AudioServicesCreateSystemSoundID(u as CFURL, &id) == noErr else {
            Log.say("sounds: can't load \(s.rawValue)")
            return
        }
        var ui: UInt32 = 1
        AudioServicesSetProperty(kAudioServicesPropertyIsUISound, UInt32(MemoryLayout<SystemSoundID>.size), &id,
                                 UInt32(MemoryLayout<UInt32>.size), &ui)
        ids[s] = id
    }

    func play(_ s: Sound) {
        // a new one cuts the old: disposing a system sound stops it
        if let p = playing, let old = ids[p] {
            AudioServicesDisposeSystemSoundID(old)
            ids[p] = nil
            load(p)
        }
        guard let id = ids[s] else { return }
        playing = s
        AudioServicesPlaySystemSoundWithCompletion(id) { [weak self] in
            DispatchQueue.main.async {
                MainActor.assumeIsolated { if self?.playing == s { self?.playing = nil } }
            }
        }
    }

    // macOS 'Play user interface sound effects' (on unless he turned it off)
    static var uiSoundsOn: Bool {
        let v = CFPreferencesCopyAppValue("com.apple.sound.uiaudio.enabled" as CFString, "com.apple.systemsound" as CFString)
        return (v as? NSNumber)?.boolValue ?? true
    }

    // a Focus / Do Not Disturb, when macOS lets us read it (best effort:
    // without Full Disk Access the file is closed, and this says no Focus)
    static var focusOn: Bool {
        let p = NSHomeDirectory() + "/Library/DoNotDisturb/DB/Assertions.json"
        return SoundPlan.focusOn(assertions: FileManager.default.contents(atPath: p))
    }
}
