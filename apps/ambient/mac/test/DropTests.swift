
// The laws of DropRules (S9: a drop on the menu-bar pearl), run by build.sh
// --test after src/DropRules.swift. Fixture paths only.

var failures = 0
func law(_ name: String, _ ok: Bool) {
    if ok { print("ok   \(name)") } else { print("FAIL \(name)"); failures += 1 }
}

func files(_ ev: [String: Any]?) -> [[String: Any]] { ev?["files"] as? [[String: Any]] ?? [] }

let ev = DropRules.event([DropItem(path: "/Users/g/shot.PNG", isDir: false),
                          DropItem(path: "/Users/g/engine", isDir: true),
                          DropItem(path: "/Users/g/notes.md", isDir: false)], url: nil)
law("drop: an image, a folder, a file, each with its kind",
    files(ev).map { $0["kind"] as? String ?? "" } == ["image", "folder", "file"])
law("drop: each names its file", files(ev).map { $0["name"] as? String ?? "" } == ["shot.PNG", "engine", "notes.md"])
law("drop: the event is app_drop with no url for files", ev?["ev"] as? String == "app_drop" && ev?["url"] == nil)

let link = DropRules.event([], url: "https://grafana.internal/d/1")
law("drop: a link alone: its url, no files", link?["url"] as? String == "https://grafana.internal/d/1" && files(link).isEmpty)
law("drop: a non-web link is nothing", DropRules.event([], url: "javascript:alert(1)") == nil && DropRules.event([], url: "file:///etc/passwd") == nil)
law("drop: nothing at all: no event", DropRules.event([], url: nil) == nil)
law("drop: a relative path is not a file", DropRules.event([DropItem(path: "notes.md", isDir: false)], url: nil) == nil)

let twice = DropRules.event([DropItem(path: "/a", isDir: false), DropItem(path: "/a", isDir: false)], url: nil)
law("drop: the same file twice counts once", files(twice).count == 1)
let many = DropRules.event((0..<30).map { DropItem(path: "/f\($0)", isDir: false) }, url: nil)
law("drop: at most 20 files", files(many).count == DropRules.maxFiles)

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all Drop laws hold")
