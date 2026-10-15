#!/usr/bin/env python3
"""Which e2e/tmux tests a change can break: the full gate's test selection
(docs/loop-speed.md §11, the user's yes on q1, 2026-10-12).

  python3 tests/test_map.py select <changed path>...   # "ALL <why>" or the tests
  python3 tests/test_map.py --self-test                # the map is honest

The Rust part of the full gate (build, every Rust test, clippy) always runs;
this picks the e2e/tmux tests of run_all.sh. Every test still runs nightly
(scripts/nightly_gate.sh) and in a release's gate (gate.sh full --all).

The rules, per changed path, the union of all:
  - docs/, site/, nix/, .github/, office/, the notices, README and bise.toml: no test reads them
    at run time; a test that names the very file (a fixture, a path it
    opens) runs.
  - rust/tui/, rust/vendor/crossterm/: the TUI. Every *_tmux test, and every
    other test that names tmux or the TUI crate.
  - bend/laws/, bend/proofs/: PROOF.
  - apps/desktop/, dev/ (the desktop's QA plugin), scripts/desktop*,
    tests/desktop_*, tests/ambient_qa*: the desktop app's own. No terminal
    e2e/tmux test (but one that names the very file); the gate runs the
    desktop's checks instead (`desktop` below).
  - tests/<file>: that test if it is one, and every test whose file names it
    (an import, a path it runs: fake_provider.py), transitively through the
    helpers. tests/fixtures/<x>: the tests that name x.
  - anything else (rust/ but the TUI, bend/, prompts/, plugins/, .agents/,
    scripts/, packaging/, kit/, computer-use/, the gate itself, a path no
    rule knows): ALL. Shared code runs everything.
The self-test makes every top-level path of the repo known here, so a new
one is a decision, not a silent ALL or a silent nothing.

  python3 tests/test_map.py desktop <changed path>...  # "desktop <why>" or "none"

Whether a change runs the desktop app's checks (gate.sh desktop_check:
`pnpm check` in apps/desktop): a desktop path above, the gate itself, or
a seam the desktop reads: the crate of each generator a generated file
under apps/desktop names in its header (`*.gen.ts`, a law of the
self-test), and the core the app runs (rust/tui/src/ambient, rust/harness's
ambient.rs, approot.rs, update.rs). The terminal's tests of a seam run as
for any path; a desktop path never runs them.
"""
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# top-level paths no e2e/tmux test reads at run time
NONE_PREFIXES = ("docs/", "site/", "nix/", ".github/", "office/")
NONE_FILES = {"LICENSE", "NOTICE", "THIRD_PARTY_NOTICES", "README.md", "flake.nix", "flake.lock",
              "default.nix", ".gitignore", "bise.toml"}
TUI_PREFIXES = ("rust/tui/", "rust/vendor/crossterm/")
PROOF_PREFIXES = ("bend/laws/", "bend/proofs/")
# the gate's own files: a change to them runs everything
GATE_FILES = {"tests/gate.sh", "tests/run_all.sh", "tests/slow_first.py", "tests/test_map.py"}
# every top-level entry of the repo, and what it is: none, tui, mixed (some
# paths in it have a rule), all
TOP = {
    "docs": "none", "site": "none", "nix": "none", ".github": "none", "LICENSE": "none", "NOTICE": "none",
    "THIRD_PARTY_NOTICES": "none", "README.md": "none", "flake.nix": "none", "flake.lock": "none",
    "default.nix": "none", ".gitignore": "none",
    # the repo's tracked config (issue 28): the land reads it, no test hub does
    "bise.toml": "none",
    "rust": "mixed", "bend": "mixed", "tests": "mixed",
    "kit": "all", "prompts": "all", "plugins": "all", ".agents": "all", "scripts": "all",
    "packaging": "all", "computer-use": "all", "run.sh": "all", "apps": "mixed", "dev": "desktop",
    # the office SDK: no e2e/tmux test loads it yet; the gate runs
    # tests/office_check.sh on it instead (office-run moves this when bise embeds it)
    "office": "none",
}
# the desktop app's own paths: its checks, no terminal test
DESKTOP_PREFIXES = ("apps/desktop/", "dev/", "scripts/desktop", "tests/desktop_", "tests/ambient_qa")
# what the desktop's checks read besides its own tree (architect m_19472):
# the generators' crates (pinned by gen_seams_law) and the core the app runs
DESKTOP_SEAMS = ("rust/proto/", "rust/home/", "rust/tui/src/ambient/", "rust/harness/src/ambient.rs",
                 "rust/harness/src/approot.rs", "rust/harness/src/update.rs")
GEN_SUFFIX = ".gen.ts"
TUI_WORDS = re.compile(r"tmux|rust/tui|bend[-_]tui")


def run_all_tests(root=ROOT):
    """The e2e/tmux tests of run_all.sh, in its order."""
    s = open(os.path.join(root, "tests", "run_all.sh")).read()
    return s.split('TESTS="', 1)[1].split('"', 1)[0].split()


def texts(root=ROOT):
    """{stem: text} of every tests/*.py."""
    out = {}
    d = os.path.join(root, "tests")
    for f in os.listdir(d):
        if f.endswith(".py"):
            with open(os.path.join(d, f), errors="replace") as fh:
                out[f[:-3]] = fh.read()
    return out


def naming(word, txt):
    """The stems whose file names `word` (a whole word: e2e is not repl_start_e2e)."""
    rx = re.compile(r"(?<![\w-])" + re.escape(word) + r"(?![\w-])")
    return {s for s, t in txt.items() if rx.search(t)}


def closure(stems, txt):
    """The stems and every file naming one of them, transitively."""
    seen, todo = set(), list(stems)
    while todo:
        s = todo.pop()
        if s in seen:
            continue
        seen.add(s)
        todo.extend(naming(s, txt) - seen)
    return seen


def select(changed, tests, txt):
    """(None, why) for every test, or (set of tests, whys)."""
    picked, whys = set(), []
    tset = set(tests)
    for p in changed:
        p = p.strip()
        if not p:
            continue
        top = p.split("/", 1)[0]
        if p in GATE_FILES:
            return None, "the gate itself (%s)" % p
        if p.startswith(NONE_PREFIXES) or p in NONE_FILES:
            named = {s for s in naming(p, txt) if s in tset}
            picked |= named
            whys.append("%s: %s" % (p, "named by %s" % " ".join(sorted(named)) if named else "no test"))
        elif p.startswith(DESKTOP_PREFIXES):
            named = {s for s in naming(p, txt) if s in tset}
            picked |= named
            whys.append("%s: the desktop's (its checks)%s" % (p, ", named by %s" % " ".join(sorted(named)) if named else ""))
        elif p.startswith(TUI_PREFIXES):
            tui = {t for t in tests if t.endswith("_tmux") or (t in txt and TUI_WORDS.search(txt[t]))}
            picked |= tui
            whys.append("%s: the TUI's tests" % p)
        elif p.startswith(PROOF_PREFIXES):
            picked.add("PROOF")
            whys.append("%s: PROOF" % p)
        elif top == "tests" and p.endswith(".py") and "/" not in p[len("tests/"):]:
            stem = p[len("tests/"):-3]
            got = {s for s in closure({stem}, txt) if s in tset}
            picked |= got
            whys.append("%s: %d tests name it" % (p, len(got)))
        elif p.startswith("tests/fixtures/"):
            name = p.split("/")[2]
            got = {s for s in closure(naming(name, txt), txt) if s in tset}
            if not got:
                return None, "%s: no test names it (a fixture of a helper?)" % p
            picked |= got
            whys.append("%s: %d tests name it" % (p, len(got)))
        else:
            return None, "%s (shared code or no rule)" % p
    return picked, whys


def desktop(changed):
    """Why the desktop's checks run for this change, or None."""
    for p in changed:
        p = p.strip()
        if p.startswith(DESKTOP_PREFIXES):
            return "%s (the desktop's)" % p
        if p.startswith(DESKTOP_SEAMS):
            return "%s (a seam the desktop reads)" % p
        if p in GATE_FILES:
            return "%s (the gate itself)" % p
    return None


def generators(header):
    """The repo files a generated file's header names as its generator:
    the `rust/....rs` paths in its first lines."""
    return re.findall(r"\b(rust/[\w./-]+\.rs)\b", header)


def gen_seams_law(gen_files):
    """Every generated file under apps/desktop names its generator, and the
    generator's crate (rust/<crate>/) is a desktop seam: a change there
    reruns the checks that read its output. [(path, header)] -> faults."""
    faults = []
    for path, header in gen_files:
        gens = generators(header)
        if not gens:
            faults.append("%s names no generator (rust/<crate>/....rs) in its first lines" % path)
        for g in gens:
            crate = "/".join(g.split("/")[:2]) + "/"
            if not crate.startswith(DESKTOP_SEAMS):
                faults.append("%s: its generator %s (crate %s) is not in DESKTOP_SEAMS" % (path, g, crate))
    return faults


def gen_files(root=ROOT):
    """(path, first lines) of every *.gen.ts git knows under apps/desktop."""
    out = subprocess.run(["git", "ls-files", "apps/desktop"], cwd=root, capture_output=True, text=True).stdout.split()
    got = []
    for p in out:
        if p.endswith(GEN_SUFFIX):
            with open(os.path.join(root, p), errors="replace") as fh:
                got.append((p, "".join(fh.readline() for _ in range(4))))
    return got


def git_tops(root=ROOT):
    out = subprocess.run(["git", "ls-files"], cwd=root, capture_output=True, text=True).stdout.split()
    return {p.split("/", 1)[0] for p in out}


def self_test():
    tests, txt = run_all_tests(), texts()
    bad = [t for t in tests if t != "PROOF" and t not in txt]
    assert not bad, "run_all.sh names tests with no tests/<t>.py: %s" % bad
    unknown = sorted(git_tops() - set(TOP))
    assert not unknown, ("top-level paths with no rule in tests/test_map.py TOP: %s "
                         "(say what they are: none, all, or a rule)" % unknown)
    # the TUI: every tmux test, and the tests that drive the TUI otherwise
    sel, _ = select(["rust/tui/src/feed.rs"], tests, txt)
    tmux = {t for t in tests if t.endswith("_tmux")}
    assert sel is not None and tmux <= sel and "e2e" in sel and "repl_start_e2e" not in sel, sorted(sel or [])
    # docs: nothing, unless a test names the file
    assert select(["docs/loop-speed.md"], tests, txt)[0] == set()
    # a helper runs every test naming it, transitively (e2e.py: nearly all)
    sel, _ = select(["tests/wait.py"], tests, txt)
    assert "tui_tmux" in sel and "e2e" in sel, sorted(sel)
    sel, _ = select(["tests/fake_provider.py"], tests, txt)
    assert "e2e" in sel and "core_restart" in sel, sorted(sel)
    # a test alone: itself (and the tests naming it)
    sel, _ = select(["tests/every_e2e.py"], tests, txt)
    assert "every_e2e" in sel and "tui_tmux" not in sel, sorted(sel)
    # the laws: PROOF
    assert select(["bend/laws/hub.bend"], tests, txt)[0] == {"PROOF"}
    assert select(["bend/proofs/lib/hub-1.bend"], tests, txt)[0] == {"PROOF"}
    # shared code and the unknown: everything
    for p in ("bend/hub/core.bend", "rust/switchboard/src/core.rs", "prompts/prompt-bise.txt",
              "tests/run_all.sh", "newdir/x"):
        assert select([p], tests, txt)[0] is None, p
    # the union
    sel, _ = select(["docs/a.md", "bend/proofs/hub.bend", "rust/tui/src/feed.rs"], tests, txt)
    assert "PROOF" in sel and "tui_tmux" in sel
    # the desktop's paths: no terminal test, its checks; a seam: both
    for p in ("apps/desktop/src/thread/rows.tsx", "dev/plugins/ambient-qa/plugin.json", "scripts/desktop_try.py",
              "tests/desktop_try_test.py", "tests/ambient_qa_test.py"):
        assert select([p], tests, txt)[0] == set(), p
        assert desktop([p]), p
    for p in ("rust/proto/src/draft.rs", "rust/home/src/env.rs", "rust/harness/src/update.rs"):
        assert select([p], tests, txt)[0] is None and desktop([p]), p
    sel, _ = select(["rust/tui/src/ambient/core/hubs.rs"], tests, txt)
    assert "tui_tmux" in sel and desktop(["rust/tui/src/ambient/core/hubs.rs"])
    for p in ("rust/tui/src/feed.rs", "rust/switchboard/src/core.rs", "bend/hub/core.bend", "docs/a.md",
              "scripts/versions.sh", "apps/other/x"):
        assert desktop([p]) is None, p
    assert select(["apps/other/x"], tests, txt)[0] is None
    # every generated file under apps/desktop names a generator in a seam
    assert gen_seams_law([("apps/desktop/src/x.gen.ts", "// generated by bise-proto (rust/proto/tests/ts.rs)\n")]) == []
    assert gen_seams_law([("a.gen.ts", "// generated from VARS (rust/switchboard/src/x.rs)\n")])
    assert gen_seams_law([("a.gen.ts", "// hand-written\n")])
    faults = gen_seams_law(gen_files())
    assert not faults, "\n".join(faults)
    print("test_map self-test: ok (%d tests, %d in the TUI group)" % (len(tests), len(select(["rust/tui/x"], tests, txt)[0])))


def main(argv):
    if argv[1:2] == ["--self-test"]:
        return self_test()
    if argv[1:2] == ["desktop"]:
        why = desktop(argv[2:])
        print("desktop " + why if why else "none")
        return None
    if argv[1:2] != ["select"]:
        sys.exit("usage: test_map.py select|desktop <changed path>... | --self-test")
    tests, txt = run_all_tests(), texts()
    sel, why = select(argv[2:], tests, txt)
    if sel is None:
        print("ALL " + why)
    else:
        # run_all.sh's order (the slowest-first sort comes after)
        print(" ".join(t for t in tests if t in sel))
        for w in why:
            print("# " + w, file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv)
