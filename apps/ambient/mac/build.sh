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

# the 1024 px render -> <dir>/AppIcon.icns: the 10 iconset entries at their
# exact pixel sizes, PNG, built and packed in <dir> only (never inside the
# app, which another build may be replacing)
make_icns() {
  local src="$1" dir="$2" set="$2/AppIcon.iconset" sz
  mkdir -p "$set"
  for sz in 16 32 128 256 512; do
    sips -s format png -z "$sz" "$sz" "$src" --out "$set/icon_${sz}x${sz}.png" >/dev/null || return 1
    sips -s format png -z $((sz * 2)) $((sz * 2)) "$src" --out "$set/icon_${sz}x${sz}@2x.png" >/dev/null || return 1
  done
  iconutil -c icns "$set" -o "$dir/AppIcon.icns"
}

case "${1:-}" in
  --check)
    swiftc -typecheck "${FLAGS[@]}" "${SOURCES[@]}"
    echo "ambient mac: type-check ok (${#SOURCES[@]} files)"
    ;;
  --test)
    t="$(mktemp -d "${TMPDIR:-/tmp}/ambient-test.XXXXXX")"
    export AMBIENT_FIXTURES="$HERE/../web/fixtures"   # shared with the web (count.json)
    rc=0
    # the pure sources (a+b: concatenated) with their laws, one interpreter run each
    for pair in KeyMachine:KeyMachineTests PageOpen:PageOpenTests Quiet:QuietTests MenuRows:MenuRowsTests \
                PageOpen+ShowPlan:ShowPlanTests Morning:MorningTests Always:AlwaysTests \
                Visibility:VisibilityTests Settings:SettingsTests Perms:PermsTests Sounds:SoundsTests Support:LaunchTests; do
      srcs="${pair%%:*}"; test="${pair#*:}"
      : > "$t/$test.swift"
      for s in ${srcs//+/ }; do cat "$HERE/src/$s.swift" >> "$t/$test.swift"; done
      cat "$HERE/test/$test.swift" >> "$t/$test.swift"
      swift "$t/$test.swift" || rc=1
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
    # the menu-bar pearl's frames (amb-web renders them, docs/ambient-app.md
    # §9), flat in Resources so NSImage picks @2x/@3x by name
    rm -f "$APP/Contents/Resources/"*.png
    if [ -d "$HERE/Resources/pearl" ]; then
      find "$HERE/Resources/pearl" -name '*.png' -exec cp {} "$APP/Contents/Resources/" \;
    fi
    # ambient's three sounds (Sounds.swift): Resources/sounds/*.wav
    rm -rf "$APP/Contents/Resources/sounds"
    if [ -d "$HERE/Resources/sounds" ]; then
      mkdir -p "$APP/Contents/Resources/sounds"
      cp "$HERE/Resources/sounds/"*.wav "$APP/Contents/Resources/sounds/"
    fi
    # the app icon: the 1024 px render -> AppIcon.icns (sips + iconutil)
    # never fails the build: without it the app shows the generic icon
    if [ -f "$HERE/Resources/icon-1024.png" ]; then
      icon_tmp="$(mktemp -d "${TMPDIR:-/tmp}/ambient-icon.XXXXXX")"
      if make_icns "$HERE/Resources/icon-1024.png" "$icon_tmp" \
        && cp "$icon_tmp/AppIcon.icns" "$APP/Contents/Resources/AppIcon.icns"; then :
      else
        echo "ambient mac: warning: no AppIcon.icns (iconutil failed); the app builds without its icon" >&2
      fi
      rm -rf "$icon_tmp"
    fi
    codesign --force --sign - --identifier dev.bise.ambient "$APP" >/dev/null
    echo "ambient mac: built $APP"
    ;;
esac
