// Prints NSPasteboard.general.changeCount: read only, it never writes his clipboard (qa-type).
import AppKit
print(NSPasteboard.general.changeCount)
