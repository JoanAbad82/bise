#!/usr/bin/env bash
# sign-identity.sh <dir> — make bise's stable code-signing identity when it is missing, never
# otherwise. Owner: amb-mac. Moved from apps/ambient/mac/build.sh (the Swift app's), same name and
# same files, so an identity that build made is used as is.
#
# Why: ad hoc, macOS keys a permission grant (Accessibility, the mic, the screen) on the binary's
# hash, and every build loses it. A self-signed identity made once gives every build the same
# designated requirement (its identifier + this certificate), so the grants stay. It lives in its
# own keychain file with its own password: never his login keychain, never a prompt, never in his
# keychain search list (electron-builder.mjs adds it only while codesign runs).
#
#   <dir>/sign.keychain-db   the keychain, holding the identity 'bise ambient dev'
#   <dir>/pass               its password (0600)
#
# <dir> missing: made, then the identity's hash on stdout. <dir> holding both files: nothing is
# changed, the hash on stdout. <dir> there but incomplete: refused (exit 2): a half-made identity
# is never removed or remade here, a person decides. Exit 1: making it failed (the caller signs
# ad hoc).
set -euo pipefail
dir="${1:?usage: sign-identity.sh <dir>}"
NAME="bise ambient dev"
kc="$dir/sign.keychain-db"

if [ -e "$dir" ] && { [ ! -f "$kc" ] || [ ! -f "$dir/pass" ]; }; then
  echo "sign-identity: $dir exists without sign.keychain-db and pass: left as is" >&2
  exit 2
fi

if [ ! -e "$dir" ]; then
  mkdir -p "$dir"; chmod 700 "$dir"
  LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32 > "$dir/pass"; chmod 600 "$dir/pass"
  pw="$(cat "$dir/pass")"
  printf '[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n[dn]\nCN=%s\n[ext]\nbasicConstraints=critical,CA:false\nkeyUsage=critical,digitalSignature\nextendedKeyUsage=critical,codeSigning\n' "$NAME" > "$dir/cs.cnf"
  openssl req -x509 -newkey rsa:2048 -nodes -keyout "$dir/key.pem" -out "$dir/cert.pem" -days 3650 -config "$dir/cs.cnf" >/dev/null 2>&1 || exit 1
  openssl pkcs12 -export -legacy -inkey "$dir/key.pem" -in "$dir/cert.pem" -out "$dir/id.p12" -passout "pass:$pw" -name "$NAME" >/dev/null 2>&1 \
    || openssl pkcs12 -export -inkey "$dir/key.pem" -in "$dir/cert.pem" -out "$dir/id.p12" -passout "pass:$pw" -name "$NAME" >/dev/null 2>&1 \
    || exit 1
  rm -f "$dir/key.pem"
  security create-keychain -p "$pw" "$kc" >/dev/null 2>&1 || exit 1
  security set-keychain-settings "$kc" >/dev/null 2>&1   # no auto-lock
  security unlock-keychain -p "$pw" "$kc" >/dev/null 2>&1 || exit 1
  security import "$dir/id.p12" -k "$kc" -P "$pw" -T /usr/bin/codesign >/dev/null 2>&1 || exit 1
  security set-key-partition-list -S apple-tool:,apple: -s -k "$pw" "$kc" >/dev/null 2>&1 || exit 1
  rm -f "$dir/id.p12"
fi

security unlock-keychain -p "$(cat "$dir/pass")" "$kc" >/dev/null 2>&1 || exit 1
id="$(security find-identity -p codesigning "$kc" 2>/dev/null | awk -v n="\"$NAME\"" 'index($0, n) { print $2; exit }')"
[ -n "$id" ] || exit 1
echo "$id"
