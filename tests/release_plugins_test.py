#!/usr/bin/env python3
"""The release's built-in plugins are exactly the shipped list (architect's merge review, B1).

scripts/versions.sh copies the whole repo `plugins/` into a version's app root, and bend_plugins
(rust/plugins/src/resolve.rs builtin_root) loads that folder as built-in, on for every user. So
whatever sits in `plugins/` ships. Only `computer` and the office plugins (`sheets`, `slides`,
`docs`: docs/office.md, plan §3) may be there. The repo's own QA plugin lives in
`dev/plugins/ambient-qa`, which versions.sh never copies (not .agents/plugins: the main checkout's
.git/info/exclude hides that folder, so a land there silently dropped every file, 4e34639a).
Offline, no build: `python3 tests/release_plugins_test.py`."""
import os
import re
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SHIPPED = ["computer", "docs", "sheets", "slides"]


def main():
    fails = []
    plugins = sorted(n for n in os.listdir(os.path.join(REPO, "plugins")) if not n.startswith("."))
    if plugins != SHIPPED:
        fails.append("plugins/ holds %s, the release ships exactly %s (an internal plugin goes in dev/plugins/)"
                     % (plugins, SHIPPED))
    versions = open(os.path.join(REPO, "scripts", "versions.sh")).read()
    if not re.search(r'cp -R "\$src/plugins" "\$tmp/plugins"', versions):
        fails.append("scripts/versions.sh no longer copies plugins/ as a whole: check this law still guards what ships")
    if re.search(r"\$src/dev\b", versions):
        fails.append("scripts/versions.sh mentions dev/: the repo's dev plugins must never ship")
    qa = os.path.join(REPO, "dev", "plugins", "ambient-qa", "plugin.json")
    if not os.path.isfile(qa):
        fails.append("no %s: the QA plugin moved without this law" % os.path.relpath(qa, REPO))
    for f in fails:
        print("FAIL", f)
    print("%d failed" % len(fails) if fails else "release plugins: exactly %s" % SHIPPED)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
