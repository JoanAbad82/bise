#!/usr/bin/env python3
"""publish-release.sh tags unsigned and says each step before it runs (release-32).

-30, -31 and -32 hung at `git tag -a`: the user's git config signs tags
(tag.gpgsign + gpg.format ssh, a key in Secretive), git waited on a prompt
nobody saw, and the script had printed nothing yet. Here, offline: a repo
whose config asks to sign every tag with a key that does not exist, a bare
repo as the remote, a fake `gh` (no run ever passes). The script must make
an unsigned tag, push it, and say 'tagging' then 'pushing' before it stops
on the fake run, all within a few seconds.

Run: python3 tests/publish_release_test.py
"""
import os
import subprocess
import sys
import tempfile

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCRIPT = os.path.join(REPO, "packaging", "publish-release.sh")

FAKE_GH = r"""#!/bin/sh
# the fake gh: logged in, the repo readable, no release, no remote tag,
# every commit on GitHub, one run of release.yml that fails
case "$1 $2" in
  "auth status"|"repo view") exit 0 ;;
  "release view") exit 1 ;;
  "run list") echo 7; exit 0 ;;
  "run watch") exit 1 ;;
  "api repos/"*) case "$2" in */git/ref/tags/*) exit 1 ;; *) echo "${2##*/}"; exit 0 ;; esac ;;
esac
exit 1
"""


def git(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


def main():
    with tempfile.TemporaryDirectory() as t:
        bare = os.path.join(t, "remote.git")
        work = os.path.join(t, "work")
        bin_dir = os.path.join(t, "bin")
        os.makedirs(bin_dir)
        with open(os.path.join(bin_dir, "gh"), "w") as f:
            f.write(FAKE_GH)
        os.chmod(os.path.join(bin_dir, "gh"), 0o755)
        git(t, "init", "-q", "--bare", bare)
        git(t, "init", "-q", work)
        os.makedirs(os.path.join(work, "packaging"))
        with open(os.path.join(work, "README"), "w") as f:
            f.write("x\n")
        for k, v in [("user.name", "t"), ("user.email", "t@t"), ("commit.gpgsign", "false"),
                     ("tag.gpgsign", "true"), ("gpg.format", "ssh"),
                     ("user.signingkey", os.path.join(t, "no-such-key.pub")),
                     ("gpg.ssh.program", os.path.join(t, "no-such-signer"))]:
            git(work, "config", k, v)
        git(work, "add", "README")
        git(work, "commit", "-q", "-m", "one")
        git(work, "remote", "add", "origin", bare)
        sha = git(work, "rev-parse", "HEAD")
        # the script finds its repo from its own folder: run a copy inside the fake repo
        script = os.path.join(work, "packaging", "publish-release.sh")
        with open(SCRIPT) as src, open(script, "w") as dst:
            dst.write(src.read())
        os.chmod(script, 0o755)
        env = dict(os.environ, PATH=bin_dir + os.pathsep + os.environ["PATH"], TMPDIR=t,
                   GIT_CONFIG_NOSYSTEM="1", HOME=t)
        p = subprocess.run([script, "v9.9.9", "--rev", sha, "--remote", "origin"], cwd=work, env=env,
                           capture_output=True, text=True, timeout=60, stdin=subprocess.DEVNULL)
        out = p.stderr + p.stdout
        bad = []
        if git(bare, "rev-parse", "-q", "--verify", "refs/tags/v9.9.9^{commit}") != sha:
            bad.append("the tag v9.9.9 did not reach the remote on " + sha)
        else:
            body = git(bare, "cat-file", "-p", "refs/tags/v9.9.9")
            if "BEGIN SSH SIGNATURE" in body or "BEGIN PGP SIGNATURE" in body:
                bad.append("the tag is signed")
        i_tag, i_push = out.find("tagging " + sha[:12] + " v9.9.9"), out.find("pushing v9.9.9 to origin")
        if i_tag < 0 or i_push < 0 or i_push < i_tag:
            bad.append("no 'tagging' then 'pushing' line")
        if p.returncode == 0 or "the run failed" not in out:
            bad.append("the fake run's failure was not reported")
        if bad:
            print("FAIL publish_release_test: " + "; ".join(bad) + "\n--- output:\n" + out)
            sys.exit(1)
        print("ok   publish-release.sh tags unsigned under tag.gpgsign, says tagging/pushing first")


if __name__ == "__main__":
    main()
