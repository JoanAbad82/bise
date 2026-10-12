#!/usr/bin/env bash
# dev-sign.sh — sign the dev builds' binaries with ONE stable identity, so
# macOS keeps a permission grant (Files and Folders, Full Disk Access) across
# every version switch.
#
# Why: the linker signs ad hoc, with an identifier made of the binary's hash
# (bise-025287d6df4fb6ae): TCC keys a grant on that, so each new version is a
# new app and asks again ("bise would like to access files in your Documents
# folder"). The hub runs under launchd, so TCC holds the hub's own bise
# responsible for every child (bash, head, repl-live...). Signed here, every
# build has the same designated requirement:
#   identifier "dev.bise.<name>" and certificate leaf = H"<the identity's hash>"
#
# The identity: a self-signed code-signing certificate 'bise ambient dev' in
# its own keychain file, <build dir>/ambient/sign/sign.keychain-db, with its
# password in <dir>/pass (0600): the same one the desktop app's build
# (apps/desktop/scripts/sign-identity.sh, amb-mac) makes and uses, so one
# identity for everything bise builds. Never the login keychain. codesign
# only finds identities in the keychain search list: that file joins the
# user's list for the signing and leaves it right after (under a lock).
#
#   scripts/dev-sign.sh identity            make it when missing; print its hash
#   scripts/dev-sign.sh sign <name> <file>  sign <file> as dev.bise.<name>
#                                           (already so: nothing changes)
#   scripts/dev-sign.sh app <app> <exe> <id>
#                                           make <app> (new) = bise.app, bundle id
#                                           dev.bise.bise, around a copy of <exe>, signed
#
# Path matters too: macOS keys a plain executable's folder grant on its
# PATH and signature, a bundle's on its bundle id and signature (proven
# with throwaway probes, docs/issues/tcc-sign.md). A version dir is a new
# path each time, so its bise is a link to its bise.app (versions.sh).
#
# Never fails a build: no identity, not macOS, or SB_DEV_SIGN=0 -> `sign`
# leaves the file as the linker signed it (ad hoc), `app` exits 1 and
# makes nothing (the caller ships a plain bise), one line on stderr. A
# signed file is a new inode (signed on a copy, then renamed): a running
# binary, or a hard link to it, keeps its own.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
if [ -n "${BISE_HOME:-}" ]; then STATE="$BISE_HOME/dev"
elif [ -e "$HOME/.bise/migrated.json" ]; then STATE="$HOME/.bise/dev"
else STATE="$HOME/.local/state/switchboard"; fi
BUILD="${SB_BUILD_DIR:-$STATE/build}"
DIR="${BISE_SIGN_DIR:-$BUILD/ambient/sign}"
KC="$DIR/sign.keychain-db"
NAME="bise ambient dev"

say() { echo "dev-sign: $*" >&2; }

# make the identity when <dir> is missing; a dir without both files is
# refused (a person decides), exit 2. Prints nothing.
make_identity() {
  if [ -e "$DIR" ]; then
    { [ -f "$KC" ] && [ -f "$DIR/pass" ]; } && return 0
    say "$DIR exists without sign.keychain-db and pass: left as is"; return 2
  fi
  mkdir -p "$DIR"; chmod 700 "$DIR"
  # a bounded read: with SIGPIPE ignored (GitHub's macOS runners) BSD tr
  # never stops on an endless /dev/urandom once head has gone (v2026.10.2-31's
  # CI hung 1h40m here)
  head -c 4096 /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | head -c 32 > "$DIR/pass" || true
  chmod 600 "$DIR/pass"
  local pw; pw="$(cat "$DIR/pass")"
  printf '[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n[dn]\nCN=%s\n[ext]\nbasicConstraints=critical,CA:false\nkeyUsage=critical,digitalSignature\nextendedKeyUsage=critical,codeSigning\n' "$NAME" > "$DIR/cs.cnf"
  openssl req -x509 -newkey rsa:2048 -nodes -keyout "$DIR/key.pem" -out "$DIR/cert.pem" -days 3650 -config "$DIR/cs.cnf" >/dev/null 2>&1 || return 1
  openssl pkcs12 -export -legacy -inkey "$DIR/key.pem" -in "$DIR/cert.pem" -out "$DIR/id.p12" -passout "pass:$pw" -name "$NAME" >/dev/null 2>&1 \
    || openssl pkcs12 -export -inkey "$DIR/key.pem" -in "$DIR/cert.pem" -out "$DIR/id.p12" -passout "pass:$pw" -name "$NAME" >/dev/null 2>&1 \
    || return 1
  rm -f "$DIR/key.pem"
  security create-keychain -p "$pw" "$KC" >/dev/null 2>&1 || return 1
  security set-keychain-settings "$KC" >/dev/null 2>&1 || true  # no auto-lock
  security unlock-keychain -p "$pw" "$KC" >/dev/null 2>&1 || return 1
  security import "$DIR/id.p12" -k "$KC" -P "$pw" -T /usr/bin/codesign >/dev/null 2>&1 || return 1
  security set-key-partition-list -S apple-tool:,apple: -s -k "$pw" "$KC" >/dev/null 2>&1 || return 1
  rm -f "$DIR/id.p12"
  say "made the identity '$NAME' in $KC"
}

# the identity's SHA-1 (unlocks its keychain), or exit 1
identity() {
  make_identity || return $?
  security unlock-keychain -p "$(cat "$DIR/pass")" "$KC" >/dev/null 2>&1 || return 1
  local h
  h="$(security find-identity -p codesigning "$KC" 2>/dev/null | awk -v n="\"$NAME\"" 'index($0, n) { print $2; exit }')"
  [ -n "$h" ] || return 1
  echo "$h"
}

# the designated requirement <file> has when signed as <ident> by <hash>
want_req() { echo "identifier \"$1\" and certificate leaf = H\"$(tr 'A-F' 'a-f' <<<"$2")\""; }

# codesign <path> with the identity <hash> as <ident>; the search list: our
# keychain added for codesign, the user's own list put back after; one
# signer at a time (lockf), so two builds never lose each other's list
codesign_as() {  # <hash> <ident> <path>
  /usr/bin/lockf -k "$DIR/.lock" /bin/bash -c '
    kc="$1"; shift
    orig=(); while IFS= read -r l; do l="${l//\"/}"; l="${l#"${l%%[![:space:]]*}"}"; [ -n "$l" ] && [ "$l" != "$kc" ] && orig+=("$l"); done < <(security list-keychains -d user)
    security list-keychains -d user -s "${orig[@]}" "$kc"
    codesign --force -s "$1" --keychain "$kc" -i "$2" "$3" >/dev/null 2>&1; rc=$?
    security list-keychains -d user -s "${orig[@]}"
    exit $rc' _ "$KC" "$1" "$2" "$3" \
  && [ "$(codesign -d -r- "$3" 2>&1 | sed -n 's/^designated => //p')" = "$(want_req "$2" "$1")" ]
}

off() { [ "${SB_DEV_SIGN:-1}" = 0 ] || [ "$(uname -s)" != Darwin ]; }

sign() {  # <name> <file>
  local ident="dev.bise.$1" f="$2" h
  if off; then return 0; fi
  [ -f "$f" ] || { say "$f: no such file"; return 0; }
  if ! h="$(identity)"; then say "no '$NAME' identity: $f stays ad hoc"; return 0; fi
  if [ "$(codesign -d -r- "$f" 2>&1 | sed -n 's/^designated => //p')" = "$(want_req "$ident" "$h")" ]; then return 0; fi
  local tmp="$f.sign.$$"
  cp "$f" "$tmp"
  if codesign_as "$h" "$ident" "$tmp"; then mv -f "$tmp" "$f"
  else rm -f "$tmp"; say "signing $f failed: it stays ad hoc"; fi
}

# <app> (a new path) = a bundle dev.bise.bise around a copy of <exe>, signed;
# exit 1 (nothing left at <app>, one line) when it cannot be signed
app() {  # <app> <exe> <version id>
  local a="$1" exe="$2" v="$3" h
  if off; then return 1; fi
  if ! h="$(identity)"; then say "no '$NAME' identity: no bise.app, a plain bise (asks again for folders)"; return 1; fi
  mkdir -p "$a/Contents/MacOS"
  cp "$exe" "$a/Contents/MacOS/bise"
  cat > "$a/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key><string>dev.bise.bise</string>
  <key>CFBundleName</key><string>bise</string>
  <key>CFBundleExecutable</key><string>bise</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$v</string>
  <key>LSUIElement</key><true/>
</dict>
</plist>
PLIST
  if codesign_as "$h" dev.bise.bise "$a"; then return 0; fi
  rm -rf "$a"; say "signing $a failed: a plain bise (asks again for folders)"; return 1
}

case "${1:-}" in
  identity) identity ;;
  sign) [ $# -eq 3 ] || { say "usage: dev-sign.sh sign <name> <file>"; exit 2; }; sign "$2" "$3" ;;
  app) [ $# -eq 4 ] || { say "usage: dev-sign.sh app <app> <exe> <version id>"; exit 2; }; app "$2" "$3" "$4" ;;
  *) sed -n '2,37p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
