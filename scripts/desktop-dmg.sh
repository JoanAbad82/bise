#!/bin/bash
# desktop-dmg.sh: a DMG of bise desktop from one commit, to hand to someone (a colleague's try).
#
#   scripts/desktop-dmg.sh <sha> [--rev <n>]
#
# Everything is in scripts/desktop_dmg.py (its header says what it builds, how, and what never).
exec /usr/bin/env python3 -B "$(cd "$(dirname "$0")" && pwd)/desktop_dmg.py" "$@"
