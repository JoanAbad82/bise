"""cand_build: a desktop gate candidate builds only what changed (fast-try p1, architect m_29189).

`scripts/desktop-try.sh --candidate <sha>` builds each sha in a fresh worktree. Before this, every
candidate recompiled all our crates (fresh files = fresh mtimes: 4 min 43 s on c84530b6, every
registry dep already fresh) and installed node_modules from scratch (40 s). These are the lines
desktop_try.build_script puts in their place for a candidate; --try and the release keep theirs.

- cargo: one candidate target, <build>/desktop-cand/target, kept between candidates. Absent, it
  starts as an APFS clone (cp -c, 0 bytes, ~3 s) of the gate seed of the candidate's deps
  (`tests/gate.sh seed-path`: its key and dir stay in gate.sh), else a cold one. Cargo runs through
  scripts/cargo_mtimes.py, as versions.sh does: a file whose blob the last good build there had gets
  that build's mtime back, so cargo rebuilds the crates whose files changed and nothing else. That
  target is never built without the wrapper (the manifest would lie), so not the try's <build>/target.
  The bise is copied into the candidate's dir inside the same locked command: the other heavy slot's
  candidate never packs it. Deleting the target is always safe: the next candidate clones it again.
- node_modules: a clone of <build>/cache/desktop-node_modules-<key> (key: apps/desktop's
  package.json and pnpm-lock.yaml, node -v, pnpm -v; made from the first install for that key; the
  2 newest kept), then `pnpm install --frozen-lockfile` runs anyway and decides (a no-op when it
  matches). The cache is never written but by a rename, never changed once there.
- the Bend bins: scripts/bins.sh's own key and cache, unchanged; the Electron zip: electron-builder's
  own cache.

So a UI-only change (no Rust or Bend source changed) costs the vite build and the pack; nothing
branches on a rule of its own. The pure lines are tested in tests/desktop_try_test.py.
"""
import os
import shlex

TOOLS = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
MODULES = "desktop-node_modules-"


def root_script(root):
    """The try's own app root, a snapshot (ambient-lead m_11624): what a hub reads from
    BISE_APP_ROOT, copied like scripts/versions.sh makes a version dir, so his running try never
    reads this checkout (a checkout moved or rebuilt would change the runtime under his hubs):
    repl-live and sb-core from bins.sh's cache (immutable, one per source hash), bend-jsrt (a hard
    link to its cache file), prompts/, plugins/, kit/, office/dist, computer-use/extension, VERSION.
    Built in <root>.tmp, then one rename. Run from the checkout. Pure."""
    q = shlex.quote
    t = root + ".tmp"
    return ["rm -rf %s && mkdir -p %s/rust/jsrt/target/debug %s/computer-use" % (q(t), q(t), q(t)),
            "b=\"$(scripts/bins.sh path --src \"$PWD\" repl-live)\" && cp \"$b\" %s/repl-live" % q(t),
            "if [ -f bend/hub/main.bend ]; then b=\"$(scripts/bins.sh path --src \"$PWD\" sb-core)\" && cp \"$b\" %s/sb-core; fi" % q(t),
            "js=\"$(scripts/bins.sh path --src \"$PWD\" bend-jsrt)\" && { ln -f \"$js\" %s/bend-jsrt 2>/dev/null || cp -c \"$js\" %s/bend-jsrt 2>/dev/null || cp \"$js\" %s/bend-jsrt; }"
            % (q(t), q(t), q(t)),
            "ln -f %s/bend-jsrt %s/rust/jsrt/target/debug/bend-jsrt" % (q(t), q(t)),
            "cp -R prompts %s/prompts" % q(t),
            "if [ -d plugins ]; then cp -R plugins %s/plugins; fi" % q(t),
            "if [ -d kit ]; then cp -R kit %s/kit; fi" % q(t),
            # the office SDK's bundles: the office skills' `bise office run` and the viewer
            # (versions.sh copies them the same way; without them no agent of the app made a pptx)
            "if [ -d office/dist ]; then mkdir -p %s/office && cp -R office/dist %s/office/dist; fi" % (q(t), q(t)),
            "if [ -d computer-use/extension ]; then cp -R computer-use/extension %s/computer-use/extension && rm -rf %s/computer-use/extension/test; fi"
            % (q(t), q(t)),
            "printf 'id=%%s\\ncommit=%%s\\nrepo=%%s\\n' %s \"$(git rev-parse HEAD)\" \"$PWD\" > %s/VERSION" % (q(os.path.basename(root)), q(t)),
            "rm -rf %s && mv %s %s" % (q(root), q(t), q(root))]


def incremental(lines, repo, paths):
    """A candidate's build_script lines with the cargo and pnpm install steps made incremental
    (cargo_lines, modules_lines): `paths` is the candidate's (its "bise" in its own dir). Pure."""
    lines = list(lines)
    i = next(n for n, l in enumerate(lines) if l.startswith("export CARGO_TARGET_DIR="))
    lines[i:i + 2] = cargo_lines(repo, cand_target(paths["cand"]), paths["bise"])
    i = lines.index("pnpm install --frozen-lockfile")
    lines[i:i + 1] = modules_lines(os.path.join(os.path.dirname(paths["cand"]), "cache"))
    return lines


def cand_target(cand_dir):
    """The one cargo target of every candidate: <build>/desktop-cand/target."""
    return os.path.join(cand_dir, "target")


def cargo_lines(repo, target, bise, tools=TOOLS):
    """The candidate's bise: `target` seeded when absent, cargo through cargo_mtimes, the bise copied to
    `bise` under its lock. Run from anywhere. Pure."""
    q = shlex.quote
    t, b = q(target), q(bise)
    seed = ("if [ ! -d %s ]; then s=\"$(cd %s && %s seed-path || true)\"; tmp=%s.tmp.$$; "
            "if [ -n \"$s\" ] && cp -cR \"$s\" \"$tmp\"; then mv \"$tmp\" %s 2>/dev/null || rm -rf \"$tmp\"; "
            "echo \"cand: cargo target %s, a clone of the seed $s\"; "
            "else rm -rf \"$tmp\"; echo \"cand: no seed to clone: a cold cargo target %s\"; fi; fi"
            % (t, q(repo), q(os.path.join(tools, "tests", "gate.sh")), t, t, target, target))
    build = "cd rust && cargo build -p bend-harness && { cp -c \"$CARGO_TARGET_DIR/debug/bise\" %s.tmp || cp \"$CARGO_TARGET_DIR/debug/bise\" %s.tmp; } && mv -f %s.tmp %s" % (b, b, b, b)
    return ["export CARGO_TARGET_DIR=%s CARGO_INCREMENTAL=0" % t, seed,
            "cd %s && python3 -B %s run --src %s --target %s -- /bin/sh -c %s"
            % (q(repo), q(os.path.join(tools, "scripts", "cargo_mtimes.py")), q(repo), t, q(build))]


def modules_lines(cache, keep=2):
    """apps/desktop's node_modules from the lockfile's cache, then pnpm install; a miss fills the
    cache. Run in apps/desktop. Pure."""
    q = shlex.quote
    c = q(cache)
    rename = "python3 -c 'import os,sys; os.rename(sys.argv[1], sys.argv[2])'"   # never into an existing dir, as mv would
    return [
        "k=\"$({ cat package.json pnpm-lock.yaml; node -v; pnpm -v; } | shasum | cut -c1-12)\"; nm=%s/%s\"$k\"" % (c, MODULES),
        "if [ -d \"$nm\" ] && [ ! -e node_modules ]; then if cp -cR \"$nm\" node_modules.tmp; then mv node_modules.tmp node_modules; touch \"$nm\"; "
        "echo \"cand: node_modules, a clone of $nm\"; else rm -rf node_modules.tmp; fi; fi",
        "pnpm install --frozen-lockfile",
        "if [ ! -d \"$nm\" ]; then mkdir -p %s && rm -rf \"$nm.tmp.$$\" && cp -cR node_modules \"$nm.tmp.$$\" "
        "&& { %s \"$nm.tmp.$$\" \"$nm\" 2>/dev/null || rm -rf \"$nm.tmp.$$\"; }; fi" % (c, rename),
        "{ ls -dt %s/%s* 2>/dev/null || true; } | grep -v '\\.tmp\\.' | tail -n +%d | while read -r d; do rm -rf \"$d\"; done" % (c, MODULES, keep + 1),
    ]
