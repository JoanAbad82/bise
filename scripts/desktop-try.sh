#!/bin/bash
# desktop-try.sh: the user's first try of bise desktop on a bise home of its own
# (~/.bise/try/desktop), his repos as throwaway clones, his model login read where it is.
#
#   scripts/desktop-try.sh --try [repo…] [--fresh] [--replace]
#   scripts/desktop-try.sh --try --stop
#
# ~/.local/bin/bise-ambient runs it for 'bise-ambient --try …'. Everything is in
# scripts/desktop_try.py (its header says what is isolated and why).
exec /usr/bin/env python3 -B "$(cd "$(dirname "$0")" && pwd)/desktop_try.py" "$@"
