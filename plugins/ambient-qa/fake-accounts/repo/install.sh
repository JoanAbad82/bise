#!/bin/sh
# acme CLI installer: copies the CLI to ~/.acme/bin and puts it on the PATH.
set -e
BIN="$HOME/.acme/bin"
mkdir -p "$BIN"
cp "$(dirname "$0")/bin/acme" "$BIN/acme"
chmod +x "$BIN/acme"

LINE='export PATH="$HOME/.acme/bin:$PATH"'
for rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
  if ! grep -qs '.acme/bin' "$rc"; then
    echo "$LINE" >> "$rc"
  fi
done

echo "acme installed in $BIN. open a new terminal, then run: acme login"
