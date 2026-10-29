// Log: the helper's own lines go to stderr (Electron's main puts them in
// its log); stdout is the typed lines only. Never what he typed or read:
// names and decisions, no content.

import Foundation

enum Log {
    static func say(_ s: String) {
        FileHandle.standardError.write(Data(("helper: " + s + "\n").utf8))
    }
}
