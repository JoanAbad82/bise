#!/bin/bash
# desktop.sh: build, open and stop his bise desktop app (the Electron app, apps/desktop).
#
#   scripts/desktop.sh build --bise <exe>      build when its sources changed; the .app path
#   scripts/desktop.sh path                    the .app path
#   scripts/desktop.sh key --bise <exe>        what the build is keyed on
#   scripts/desktop.sh open [--workspace <ws> | --home] --bise <exe>
#   scripts/desktop.sh stop                    quit it (by the bundle's path, never by name)
#   scripts/desktop.sh status
#
# `bise ambient` runs `desktop.sh open`. One app at <build dir>/desktop/bise.app, signed with the
# stable identity. Everything is in scripts/desktop_app.py (its header says how and why).
exec /usr/bin/env python3 -B "$(cd "$(dirname "$0")" && pwd)/desktop_app.py" "$@"
