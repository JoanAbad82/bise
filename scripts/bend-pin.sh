# bend-pin.sh — the bend a source tree pins (sourced by bins.sh, gate.sh,
# versions.sh and sb-dev.sh). bend/VERSION is the one owner of the
# version; release.yml reads it too.
#
#   bend_bin_dir <src> <home>   the dir of the bend <src> pins, on stdout:
#     <home>/.bend/versions/<v>/bin when it holds a bend (each version
#     installed apart, with its own Base next to it); else <home>/.bend/bin
#     when its `bend version` is that version; else rc 1 and the install
#     line on stderr. A tree without bend/VERSION (a commit from before the
#     pin) takes <home>/.bend/bin as it is.
#
# A tree builds and checks with its own bend: a candidate on a new version
# gates with it while every other tree keeps the old one until it rebases,
# and a rollback builds with what its commit pins.

# the user's REAL home (the user database, never $HOME): the tests run on
# a temp HOME where no bend is installed (bins-key, land_every_e2e)
bend_tools_home() {
  local u; u="$(id -un)"
  case "$u" in *[!A-Za-z0-9._-]*|"") echo "$HOME" ;; *) eval "echo ~$u" ;; esac
}

bend_bin_dir() {  # <src> <home>
  local f="$1/bend/VERSION" v got
  if [ ! -f "$f" ]; then echo "$2/.bend/bin"; return 0; fi
  v="$(tr -d ' \t\r\n' < "$f")"
  if [ -x "$2/.bend/versions/$v/bin/bend" ]; then echo "$2/.bend/versions/$v/bin"; return 0; fi
  got="$(BEND_NO_TELEMETRY=1 "$2/.bend/bin/bend" version 2>/dev/null || true)"
  if [ "$got" = "bend $v" ]; then echo "$2/.bend/bin"; return 0; fi
  echo "bend $v (bend/VERSION) is not installed: ${got:-no bend} in $2/.bend/bin. Install it apart:" >&2
  echo "  d=\$(mktemp -d) && curl -fsSL https://github.com/bendlang/bend/releases/download/v$v/bend-$v-\$(uname -s | tr A-Z a-z)-\$(uname -m | sed 's/x86_64/x64/;s/aarch64/arm64/').tar.gz | tar xz -C \"\$d\" && mkdir -p $2/.bend/versions/$v && cp -R \"\$d\"/bend/. $2/.bend/versions/$v/" >&2
  return 1
}
