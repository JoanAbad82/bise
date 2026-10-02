#!/usr/bin/env bash
# build.sh — compile bise ambient.app with swiftc and the Command Line Tools
# (no Xcode project). Called by scripts/ambient.sh, which picks the one app
# path and the source hash; never build anywhere else by hand (the EDR
# deletes fresh unsigned binaries: one stable path, ad-hoc signed).
#
#   build.sh --check        type-check every source, no binary
#   build.sh --test         the pure laws (keys, pages, quiet) through the swift interpreter
#                           (JIT in memory: no binary on disk)
#   build.sh <app dir>      build the bundle there, in place, and sign it
#
# MACOSX_DEPLOYMENT_TARGET: from the caller (ambient.sh reads it from
# rust/.cargo/config.toml), 14.0 at least (ScreenCaptureKit screenshots).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TARGET="${MACOSX_DEPLOYMENT_TARGET:-14.0}"
ARCH="$(uname -m)"
SDK="$(xcrun --show-sdk-path)"
SOURCES=("$HERE"/src/*.swift)
FLAGS=(-swift-version 5 -target "$ARCH-apple-macos$TARGET" -sdk "$SDK"
       -framework AppKit -framework WebKit -framework ScreenCaptureKit
       -framework UserNotifications -framework AVFoundation -framework ApplicationServices
       -framework CoreAudio -framework EventKit)

case "${1:-}" in
  --check)
    swiftc -typecheck "${FLAGS[@]}" "${SOURCES[@]}"
    echo "ambient mac: type-check ok (${#SOURCES[@]} files)"
    ;;
  --test)
    t="$(mktemp -d "${TMPDIR:-/tmp}/ambient-test.XXXXXX")"
    rc=0
    # each pure source with its laws, one interpreter run each
    for pair in KeyMachine:KeyMachineTests PageOpen:PageOpenTests Quiet:QuietTests; do
      cat "$HERE/src/${pair%%:*}.swift" "$HERE/test/${pair#*:}.swift" > "$t/${pair%%:*}.swift"
      swift "$t/${pair%%:*}.swift" || rc=1
    done
    rm -rf "$t"
    exit $rc
    ;;
  ""|-*)
    echo "usage: build.sh --check | --test | <app dir>" >&2; exit 2 ;;
  *)
    APP="$1"
    BIN="$APP/Contents/MacOS/bise ambient"
    mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
    # unlink first: a running copy keeps its inode, we never write into it
    rm -f "$BIN"
    swiftc -O "${FLAGS[@]}" -o "$BIN" "${SOURCES[@]}"
    sed "s/__MINOS__/$TARGET/" "$HERE/Info.plist" > "$APP/Contents/Info.plist"
    codesign --force --sign - --identifier dev.bise.ambient "$APP" >/dev/null
    echo "ambient mac: built $APP"
    ;;
esac
