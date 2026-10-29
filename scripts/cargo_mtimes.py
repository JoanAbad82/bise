#!/usr/bin/env python3
"""cargo_mtimes: cargo builds of fresh checkouts reuse the crates whose files did not change.

  cargo_mtimes.py run --src <checkout> --target <cargo target dir> -- <command...>

cargo decides freshness by mtime. versions.sh builds a commit in a fresh git worktree (every file
just written), so all the workspace crates were rebuilt on each commit, unchanged ones included
(CI's warm release: 2.7 min on darwin-arm64, 7.5 min on x86_64). This wrapper keeps a manifest in
the target dir (.src-mtimes: blob id, mtime, path of every tracked file of the last build that
succeeded there) and, before the command, gives each file whose blob is the manifest's its
recorded mtime back; a changed file keeps its fresh one, so its crate rebuilds.

Why it is safe (no stale code shipped): a recorded mtime is when that content was first checked
out, before any artifact built from it, and every build since then had that same content:
  - the manifest is deleted before the command and written only when it succeeds, so a failed or
    killed build (some crates built from other content) breaks the chain: next time, all fresh;
  - one build at a time per target dir (a flock on .src-mtimes.lock, held through the command);
  - a file of a crate outside the last build's graph keeps its mtime too: an older artifact of it,
    built before that mtime, still looks stale to cargo, and is rebuilt.
A checkout with uncommitted changes (its index is not its files) is built as it is: no restore.
Only for fresh checkouts: the working tree's own build (target-tree) has real mtimes.

Pure parts tested in tests/cargo_mtimes_test.py.
"""
import fcntl
import os
import subprocess
import sys

MANIFEST = ".src-mtimes"
LOCK = ".src-mtimes.lock"


def say(*a):
    print("cargo_mtimes:", *a, file=sys.stderr)


def parse_ls_files(out):
    """`git ls-files -s -z` -> {path: blob} of the regular files (no links, no submodules). Pure."""
    files = {}
    for rec in out.split("\0"):
        if not rec:
            continue
        meta, _, path = rec.partition("\t")
        mode, blob, _stage = meta.split(" ")
        if mode in ("100644", "100755"):
            files[path] = blob
    return files


def parse_manifest(text):
    """the manifest -> {path: (blob, mtime_ns)}; a bad line is skipped (that file stays fresh). Pure."""
    m = {}
    for line in text.splitlines():
        parts = line.split("\t", 2)
        if len(parts) != 3 or not parts[1].isdigit():
            continue
        m[parts[2]] = (parts[0], int(parts[1]))
    return m


def format_manifest(files, mtimes):
    """{path: blob} + {path: mtime_ns} -> the manifest's text, sorted. Pure."""
    return "".join("%s\t%d\t%s\n" % (files[p], mtimes[p], p) for p in sorted(files) if p in mtimes)


def plan(files, manifest):
    """{path: mtime_ns} to give back: the files whose blob is the manifest's. Pure."""
    return {p: manifest[p][1] for p, b in files.items() if p in manifest and manifest[p][0] == b}


def git(src, *args):
    return subprocess.run(["git", "-C", src] + list(args), capture_output=True, text=True, check=True).stdout


def run(src, target, cmd):
    os.makedirs(target, exist_ok=True)
    mpath = os.path.join(target, MANIFEST)
    with open(os.path.join(target, LOCK), "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        files = parse_ls_files(git(src, "ls-files", "-s", "-z"))
        clean = not git(src, "status", "--porcelain", "--untracked-files=no").strip()
        if clean:
            try:
                with open(mpath) as f:
                    manifest = parse_manifest(f.read())
            except FileNotFoundError:
                manifest = {}
            back = plan(files, manifest)
            for p, ns in back.items():
                os.utime(os.path.join(src, p), ns=(ns, ns))
            say("%d of %d files keep their last build's mtime" % (len(back), len(files)))
        else:
            say("uncommitted changes in %s: every file fresh" % src)
        if os.path.exists(mpath):
            os.remove(mpath)
        rc = subprocess.call(cmd)
        if rc == 0 and clean:
            mtimes = {}
            for p in files:
                try:
                    mtimes[p] = os.stat(os.path.join(src, p)).st_mtime_ns
                except FileNotFoundError:
                    pass
            tmp = mpath + ".tmp"
            with open(tmp, "w") as f:
                f.write(format_manifest(files, mtimes))
            os.replace(tmp, mpath)
        return rc


def main(argv):
    if len(argv) < 6 or argv[0] != "run" or argv[1] != "--src" or argv[3] != "--target" or argv[5] != "--":
        say("usage: cargo_mtimes.py run --src <checkout> --target <dir> -- <command...>")
        return 2
    if len(argv) < 7:
        say("no command")
        return 2
    return run(argv[2], argv[4], argv[6:])


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
