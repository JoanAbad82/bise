#!/usr/bin/env python3
"""The release's built-in plugins are exactly the shipped list (architect's merge review, B1).

scripts/versions.sh copies the whole repo `plugins/` into a version's app root, and bend_plugins
(rust/plugins/src/resolve.rs builtin_root) loads that folder as built-in, on for every user. So
whatever sits in `plugins/` ships. Only `computer` may be there. The repo's own QA plugin lives in
`.agents/plugins/ambient-qa`: this workspace's plugins, which versions.sh never copies.
Offline, no build: `python3 tests/release_plugins_test.py`."""
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SHIPPED = ["computer"]


def main():
    fails = []
    plugins = sorted(n for n in os.listdir(os.path.join(REPO, "plugins")) if not n.startswith("."))
    if plugins != SHIPPED:
        fails.append("plugins/ holds %s, the release ships exactly %s (an internal plugin goes in .agents/plugins/)"
                     % (plugins, SHIPPED))
    versions = open(os.path.join(REPO, "scripts", "versions.sh")).read()
    if not re.search(r'cp -R "\$src/plugins" "\$tmp/plugins"', versions):
        fails.append("scripts/versions.sh no longer copies plugins/ as a whole: check this law still guards what ships")
    if re.search(r"\.agents", versions):
        fails.append("scripts/versions.sh mentions .agents: the repo's workspace plugins must never ship")
    qa = os.path.join(REPO, ".agents", "plugins", "ambient-qa", "plugin.json")
    if not os.path.isfile(qa):
        fails.append("no %s: the QA plugin moved without this law" % os.path.relpath(qa, REPO))
    for f in fails:
        print("FAIL", f)
    print("%d failed" % len(fails) if fails else "release plugins: exactly %s" % SHIPPED)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
