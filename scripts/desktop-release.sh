#!/bin/bash
# desktop-release.sh: bise desktop for a release, signed, notarized, stapled, as a DMG and a zip.
#
#   scripts/desktop-release.sh runtime --out <dir> [--tag <v...>]
#   scripts/desktop-release.sh build --out <dir> --runtime-root <root> [--tag desktop-vYYYY.M.N] [--identity <id>] [--notarize]
#   scripts/desktop-release.sh dmg <bise.app> <out.dmg>
#
# Everything is in scripts/desktop_release.py (its header says what it builds, how, and what never).
exec /usr/bin/env python3 -B "$(cd "$(dirname "$0")" && pwd)/desktop_release.py" "$@"
