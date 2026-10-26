"""One update for the machine, two projects (update-flow, architect m_45050 §7, m_45106).

Two throwaway projects, each with its own hub, both from version dir A of a throwaway install
(this tree's bise, the runtime linked: version_skew_e2e's version_dir). The machine's cache
(BISE_HOME/cache) names release B as the latest; no fetch (the check's stamp is fresh).

  1. both hubs offer B: one update item each, `bise … is out`;
  2. `later` said once (update-later): both items close as `later` at the next look;
  3. `update now` installed (update-go = B, B's dir is there): both hubs switch to B, one at a
     time (the machine's switch lock, held through each probation: their probations never
     overlap), and neither switch is a failure; the items close as `updated`;
  4. a bad release C (its bise exits at once): `update now` for C: each hub tries it once, its
     probation rolls back to B, and it never tries C again (no retry loop).

Looks every 2 s (BISE_RELEASE_LOOK_SECS), probation 6 s (BISE_PROBATION_SECS).

Run: python3 -u tests/update_flow_e2e.py (after scripts/bins.sh)
"""
import json
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bise_env  # noqa: E402
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import check  # noqa: E402
from version_skew_e2e import env_of, version_dir  # noqa: E402

A, B, C = "aaaa111", "bbbb222", "cccc333"


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        f.write(text)
    os.replace(tmp, path)


def manifest(cache, vid, name):
    write(os.path.join(cache, "latest.json"), json.dumps({"id": vid, "version": name, "notes": ["two projects, one update"]}))


class Hubs:
    """The throwaway machine: an install with A current, two projects."""

    def __init__(self, E):
        self.E = E
        self.prefix = os.path.join(E.tmp, "prefix")
        self.home = os.path.join(E.tmp, "bisehome")
        self.cache = os.path.join(self.home, "cache")
        self.dirs = {v: version_dir(self.prefix, v) for v in (A, B)}
        os.symlink(self.dirs[A], os.path.join(self.prefix, "current"))
        manifest(self.cache, B, "2026.10.9-1")
        # the machine's check was just done: no fetch from a real channel
        write(os.path.join(self.cache, "release-check"), str(int(time.time() * 1000)))
        self.env = dict(env_of(E), BISE_HOME=self.home, BISE_RELEASE_LOOK_SECS="2", BISE_PROBATION_SECS="6",
                        BISE_RELEASE_CHECK_SECS="36000")
        self.env.pop("BISE_NO_UPDATE", None)
        self.ws = [E.ws, os.path.join(E.tmp, "ws2")]
        os.makedirs(self.ws[1])
        e2e.sh(self.ws[1], "git init -q && git config user.email t@t && git config user.name t && git config commit.gpgsign false && echo b > README && git add README && git commit -qm init")
        self.procs = []

    def start(self):
        bise_env.refuse_real_home(self.env)
        bise_env.refuse_real_keys(self.env)
        exe = os.path.join(self.dirs[A], "bise")
        for ws in self.ws:
            err = open(os.path.join(self.E.tmp, "hub-%s.stderr" % os.path.basename(ws)), "a")
            self.procs.append(subprocess.Popen([exe, "sbd", "--workspace", ws], cwd=self.dirs[A], env=self.env,
                                               stdin=subprocess.DEVNULL, stdout=err, stderr=err))
        return [wait.until(lambda ws=ws: self.dir_of(ws), 30, "the hub of %s" % ws, poll=0.1) for ws in self.ws]

    def dir_of(self, ws):
        """ws's hub folder (its hub.log starts with its workspace, its socket up)."""
        base = os.path.join(self.home, "hubs")
        want = "workspace=%s" % os.path.realpath(ws)
        for d in sorted(os.listdir(base)) if os.path.isdir(base) else []:
            d = os.path.join(base, d)
            try:
                first = open(os.path.join(d, "hub.log")).readline()
            except OSError:
                continue
            if want in first and os.path.exists(os.path.join(d, "hub.sock")):
                return d
        return None

    def client(self, d):
        return wait.until(lambda: e2e.Client(os.path.join(d, "hub.sock")), 30, "a client of %s" % d, poll=0.2)

    def root(self, d):
        try:
            return os.path.basename(os.path.realpath(open(os.path.join(d, "hub.root")).read().strip()))
        except OSError:
            return None

    def log(self, d):
        try:
            return open(os.path.join(d, "hub.log")).read()
        except OSError:
            return ""

    def close(self):
        for d in filter(None, (self.dir_of(ws) for ws in self.ws)):
            try:
                e2e.stop_hub(os.path.join(d, "hub.sock"), False)
            except Exception:
                pass
        for p in self.procs:
            if p.poll() is None:
                p.kill()


def update_items(c):
    return [x for x in c.cards() if x.get("kind") == "update"]


def main():
    E = e2e.Env()
    M = Hubs(E)
    try:
        dirs = M.start()
        cs = [M.client(d) for d in dirs]
        # 1. both offer B, one item each
        for c in cs:
            items = c.wait(lambda c=c: update_items(c) or None, 30, "the update item")
            check(len(items) == 1, "one update item per hub: %r" % items)
        print("ok   1: both hubs offer %s, one item each" % B, flush=True)

        # 2. later once: both close
        write(os.path.join(M.cache, "update-later"), B)
        for c in cs:
            c.wait(lambda c=c: not update_items(c), 20, "the item closed after later")
        print("ok   2: later in one place closes both items", flush=True)

        # 3. update now (installed): both switch, in turn, no failure
        os.remove(os.path.join(M.cache, "update-later"))
        write(os.path.join(M.cache, "update-go"), json.dumps({"id": B, "at": int(time.time() * 1000)}))
        both = []

        def on_b():
            """Both on B; each sample notes whether two probations overlap."""
            states = [json.load(open(os.path.join(d, "versions.json"))) if os.path.exists(os.path.join(d, "versions.json")) else {} for d in dirs]
            now = time.time() * 1000
            if all(s.get("probation_until", 0) > now for s in states):
                both.append(now)
            return all(M.root(d) == B for d in dirs)
        wait.until(on_b, 120, lambda: "both hubs on %s: %r" % (B, [M.root(d) for d in dirs]), poll=0.2)
        check(not both, "two probations at once (%d samples): one hub at a time" % len(both))
        for d in dirs:
            st = json.load(open(os.path.join(d, "versions.json")))
            check("failed" not in st, "a waiting turn is not a failed switch: %r" % st)
        cs = [M.client(d) for d in dirs]
        for c in cs:
            c.wait(lambda c=c: not update_items(c), 20, "no update item on %s" % B)
        print("ok   3: update now: both hubs switched to %s in turn, no failure" % B, flush=True)

        # 4. a bad release: tried once per hub, rolled back, never again
        bad = version_dir(M.prefix, C)
        os.remove(os.path.join(bad, "bise"))
        write(os.path.join(bad, "bise"), "#!/bin/sh\nexit 3\n")
        os.chmod(os.path.join(bad, "bise"), 0o755)
        manifest(M.cache, C, "2026.10.9-2")
        write(os.path.join(M.cache, "update-go"), json.dumps({"id": C, "at": int(time.time() * 1000)}))

        def failed_on_c(d):
            try:
                st = json.load(open(os.path.join(d, "versions.json")))
            except (OSError, ValueError):
                return False
            return os.path.basename(st.get("failed", {}).get("version", "")) == C and M.root(d) == B
        for d in dirs:
            wait.until(lambda d=d: failed_on_c(d), 120, "%s rolled back from %s" % (d, C), poll=0.5)
        tries = [M.log(d).count("update-flow: switching to") for d in dirs]
        # several looks (every 2 s): no hub tries C again, both stay on B
        wait.holds(lambda: [M.log(d).count("update-flow: switching to") for d in dirs] == tries
                   and all(M.root(d) == B for d in dirs), 15, "no retry of %s, both on %s" % (C, B), poll=0.5)
        print("ok   4: a bad release fails once per hub, no retry", flush=True)
    finally:
        M.close()
        E.close()


if __name__ == "__main__":
    main()
