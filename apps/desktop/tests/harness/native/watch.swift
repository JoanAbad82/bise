// bise-harness-watch: the harness's eyes on macOS's own view of the app under test (proof.ts).
// usage: bise-harness-watch <pid> [interval_ms]
// Every interval (default 100 ms) it prints one JSON line:
//   {"t": <ms>, "front": <pid of the frontmost app>, "windows": <count>, "onscreen": [{pid, x, y, w, h, layer, alpha}]}
// counting the windows owned by <pid> or by a child of <pid> (Electron's helpers), as the window
// server lists them (CGWindowListCopyWindowInfo): kCGWindowIsOnscreen is what reaches his screen,
// whatever BrowserWindow.getBounds() says (macOS clamps a shown window back onto a display).
// It exits when <pid> is gone or its stdin closes. Read-only: it never touches a window.
import AppKit
import CoreGraphics
import Foundation

let args = CommandLine.arguments
guard args.count > 1, let root = Int32(args[1]) else {
  FileHandle.standardError.write(Data("usage: bise-harness-watch <pid> [interval_ms]\n".utf8))
  exit(2)
}
let interval = args.count > 2 ? (Double(args[2]) ?? 100) / 1000 : 0.1

func parent(of pid: Int32) -> Int32 {
  var info = kinfo_proc()
  var size = MemoryLayout<kinfo_proc>.stride
  var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, pid]
  if sysctl(&mib, 4, &info, &size, nil, 0) != 0 || size == 0 { return -1 }
  return info.kp_eproc.e_ppid
}

func alive(_ pid: Int32) -> Bool { kill(pid, 0) == 0 || errno == EPERM }

func ours(_ pid: Int32) -> Bool {
  var p = pid
  for _ in 0..<4 {
    if p == root { return true }
    if p <= 1 { return false }
    p = parent(of: p)
  }
  return false
}

func sample() {
  let list = CGWindowListCopyWindowInfo([.optionAll], kCGNullWindowID) as? [[String: Any]] ?? []
  var count = 0
  var onscreen: [[String: Any]] = []
  for w in list {
    let pid = Int32(w[kCGWindowOwnerPID as String] as? Int ?? -1)
    if !ours(pid) { continue }
    count += 1
    if (w[kCGWindowIsOnscreen as String] as? Bool) == true {
      let b = w[kCGWindowBounds as String] as? [String: Any] ?? [:]
      onscreen.append([
        "pid": pid, "x": b["X"] ?? 0, "y": b["Y"] ?? 0, "w": b["Width"] ?? 0, "h": b["Height"] ?? 0,
        "layer": w[kCGWindowLayer as String] ?? 0, "alpha": w[kCGWindowAlpha as String] ?? 1,
      ])
    }
  }
  let front = NSWorkspace.shared.frontmostApplication?.processIdentifier ?? -1
  let line: [String: Any] = [
    "t": Int(Date().timeIntervalSince1970 * 1000), "front": front, "front_ours": ours(front),
    "windows": count, "onscreen": onscreen,
  ]
  if let data = try? JSONSerialization.data(withJSONObject: line), let s = String(data: data, encoding: .utf8) {
    print(s)
    fflush(stdout)
  }
  if !alive(root) { exit(0) }
}

// stdin closing (the harness went away) ends the watch
FileHandle.standardInput.readabilityHandler = { h in if h.availableData.isEmpty { exit(0) } }
sample()
Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { _ in sample() }
RunLoop.main.run()
