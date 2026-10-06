import Foundation

// DropRules: a file, a folder, an image or a link dropped on the menu-bar
// pearl (S9, lead m_9025; agreed with amb-web m_9033). Pure: the status
// item reads the pasteboard, this decides what the page gets:
// {ev:'app_drop', files:[{name, path, kind:'file'|'image'|'folder'}], url?}.
// The page opens the spotlight with them; his ⏎ sends them like any typed
// message (the core routes it).

struct DropItem: Equatable {
    var path: String
    var isDir: Bool
}

enum DropRules {
    static let maxFiles = 20
    static let imageExts: Set<String> = ["png", "jpg", "jpeg", "gif", "heic", "heif", "webp", "tiff", "tif", "bmp"]

    static func kind(_ i: DropItem) -> String {
        if i.isDir { return "folder" }
        let ext = (i.path as NSString).pathExtension.lowercased()
        return imageExts.contains(ext) ? "image" : "file"
    }

    // only web links travel as a url (a file:// is a file)
    static func link(_ s: String?) -> String? {
        guard let s, let scheme = s.split(separator: ":", maxSplits: 1).first?.lowercased(),
              scheme == "http" || scheme == "https" else { return nil }
        return s
    }

    // the page's event; nil: nothing worth sending
    static func event(_ items: [DropItem], url: String?) -> [String: Any]? {
        var seen = Set<String>()
        let files = items.filter { $0.path.hasPrefix("/") && seen.insert($0.path).inserted }.prefix(maxFiles)
        let u = link(url)
        if files.isEmpty && u == nil { return nil }
        var ev: [String: Any] = ["ev": "app_drop", "files": files.map {
            ["name": ($0.path as NSString).lastPathComponent, "path": $0.path, "kind": kind($0)] as [String: Any]
        }]
        if let u { ev["url"] = u }
        return ev
    }
}
