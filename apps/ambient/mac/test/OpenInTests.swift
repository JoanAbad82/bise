// The laws of OpenIn (S8: a project's folder in his terminal or editor),
// run by build.sh --test through the swift interpreter (cat'ed after
// src/OpenIn.swift).

import Foundation

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

let ghostty = "com.mitchellh.ghostty", iterm = "com.googlecode.iterm2", term = "com.apple.Terminal"
let vscode = "com.microsoft.VSCode", zed = "dev.zed.Zed", xcode = "com.apple.dt.Xcode"
law("terminal: the one he has running", OpenIn.pick(.terminal, running: [iterm], installed: [ghostty, iterm], defaultForSource: nil) == iterm)
law("terminal: none running: the first installed", OpenIn.pick(.terminal, running: [], installed: [iterm, ghostty], defaultForSource: nil) == ghostty)
law("terminal: none at all: macOS's Terminal", OpenIn.pick(.terminal, running: [], installed: [], defaultForSource: nil) == term)
law("editor: macOS's default for source code when it's an editor", OpenIn.pick(.editor, running: [zed], installed: [vscode, zed], defaultForSource: vscode) == vscode)
law("editor: a default that isn't an editor (TextEdit): the one running", OpenIn.pick(.editor, running: [zed], installed: [vscode, zed], defaultForSource: "com.apple.TextEdit") == zed)
law("editor: none running: the first installed", OpenIn.pick(.editor, running: [], installed: [xcode, vscode], defaultForSource: nil) == vscode)
law("editor: none at all: nothing (Finder shows the folder)", OpenIn.pick(.editor, running: [], installed: [], defaultForSource: nil) == nil)
let dirs: Set<String> = ["/Users/x/proj", "/tmp/wt"]
let isDir: (String) -> Bool = { dirs.contains($0) }
law("folder: an absolute folder that exists", OpenIn.folder("/Users/x/proj", isDir: isDir) == "/Users/x/proj")
law("folder: normalized (no trailing slash, no ..)", OpenIn.folder("/Users/x/proj/../proj/", isDir: isDir) == "/Users/x/proj")
law("folder: a relative path, a URL, a file or nothing: refused",
    OpenIn.folder("proj", isDir: isDir) == nil && OpenIn.folder("file:///tmp/wt", isDir: isDir) == nil
        && OpenIn.folder("/Users/x/proj/a.txt", isDir: isDir) == nil && OpenIn.folder(nil, isDir: isDir) == nil)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all OpenIn laws hold")
