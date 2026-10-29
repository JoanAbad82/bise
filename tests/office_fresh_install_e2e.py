#!/usr/bin/env python3
"""The office plugins on a fresh install (docs/office.md, docs/plugins.md).

What a new user gets with nothing installed but bise: a built tarball
installed in a temp HOME (its install.sh), or the desktop app's bundled
bise (Contents/Resources/bin, copied where its core installs it). A new
project (a fresh git repo), the installed bise's hub, the scripted
provider (fake_provider.py), a fresh agent t1:

  t1's system prompt lists slides:slides, sheets:sheets, docs:docs in
    <available-skills> and the slides, sheets, docs plugins in ## Plugins
  `bise` in t1's bash is the hub's own (<state>/bin/bise), with a PATH of
    system dirs only: no CLI install needed (the desktop app has none)
  told "make a 3-slide pptx", t1 loads slides:slides (the skill tool
    answers its SKILL.md) and runs a script with `bise office run`
    (bend-jsrt, the bundled office.js: no node, pip or npm): otters.pptx
    is written in its worktree, an artifact, and `bise office inspect`
    finds 3 slides

  tests/office_fresh_install_e2e.py --tarball <bise-*.tar.gz>
  tests/office_fresh_install_e2e.py --app <bise.app>
Fake data only, a throwaway HOME; nothing of the user's is read.
"""
import glob
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wait  # noqa: E402
import e2e  # noqa: E402
import placing  # noqa: E402
from e2e import Client, Env, check, refuse_real_home, refuse_real_keys, refuse_real_run_dir  # noqa: E402

SYS_PATH = "/usr/bin:/bin:/usr/sbin:/sbin"

DECK = r'''
import { slides, run } from "@bise/office";
const deck = await slides.create();
const points = [
  ["Otters", ["Sea otters and river otters", "13 species"]],
  ["Tools", ["Sea otters crack shells with stones", "They keep a favourite stone"]],
  ["Habitat", ["Kelp forests hold them in place", "They sleep holding hands"]],
];
for (const [title, body] of points) {
  const s = deck.addSlide({ layout: "title-body" });
  s.placeholder("title")!.setText(title as string);
  s.placeholder("body")!.setText(body as string[]);
}
console.log(JSON.stringify(deck.check()));
console.log(await run.write("otters.pptx", await deck.save(), { artifact: true }));
'''


def install_tarball(tmp, tarball):
    """install.sh from the extracted bundle into tmp/home, like curl | sh:
    the installed bise (current/bise) and the HOME."""
    home = os.path.join(tmp, "home")
    dl = os.path.join(tmp, "dl")
    os.makedirs(home)
    os.makedirs(dl)
    subprocess.run(["tar", "-C", dl, "-xzf", tarball], check=True)
    bundle = glob.glob(os.path.join(dl, "*", "install.sh"))
    check(len(bundle) == 1, "one install.sh in the tarball: %s" % bundle)
    env = {"HOME": home, "PATH": SYS_PATH, "SHELL": "/bin/zsh", "TERM": "dumb", "USER": os.environ.get("USER", "me"),
           "LANG": "en_US.UTF-8"}
    r = subprocess.run(["sh", bundle[0]], env=env, capture_output=True, text=True, timeout=300)
    check(r.returncode == 0, "install.sh: %s %s" % (r.stdout[-800:], r.stderr[-800:]))
    exe = os.path.join(home, ".local", "share", "bise", "current", "bise")
    check(os.access(exe, os.X_OK), "installed bise at %s" % exe)
    return home, os.path.realpath(exe)


def install_app(tmp, app):
    """The app's bundled runtime (Contents/Resources/bin, a version dir),
    copied as its core installs it (<prefix>/versions/<id>): its bise."""
    home = os.path.join(tmp, "home")
    os.makedirs(home)
    src = os.path.join(app, "Contents", "Resources", "bin")
    check(os.path.isfile(os.path.join(src, "VERSION")), "a version dir in %s" % src)
    dst = os.path.join(home, "Library", "Application Support", "bise-test", "versions", "app")
    shutil.copytree(src, dst, symlinks=True)
    return home, os.path.join(dst, "bise")


def app_root(exe):
    """The app root of a bise: <root>/<x>.app/Contents/MacOS with a VERSION in <root> is <root>
    (a release's bise.app, cli-sign), else the exe's dir. A copy of the rule's owner,
    bise_home::exe_home_dir (rust/home/src/lib.rs): change both together."""
    d = os.path.dirname(exe)
    up = os.path.dirname(os.path.dirname(os.path.dirname(d)))
    bundled = (os.path.basename(d) == "MacOS" and os.path.basename(os.path.dirname(d)) == "Contents"
               and os.path.dirname(os.path.dirname(d)).endswith(".app"))
    return up if bundled and os.path.isfile(os.path.join(up, "VERSION")) else d


def main():
    args = sys.argv[1:]
    if len(args) != 2 or args[0] not in ("--tarball", "--app"):
        print(__doc__)
        return 2
    E = Env()
    ok = False
    try:
        home, exe = (install_tarball if args[0] == "--tarball" else install_app)(E.tmp, os.path.abspath(args[1]))
        root = app_root(exe)
        for p in ("slides", "sheets", "docs"):
            check(os.path.isfile(os.path.join(root, "plugins", p, "plugin.json")), "plugins/%s shipped in %s" % (p, root))
        check(os.path.isfile(os.path.join(root, "office", "dist", "office.js")), "office/dist/office.js shipped")
        check(os.access(os.path.join(root, "bend-jsrt"), os.X_OK), "bend-jsrt shipped")
        # system dirs only: no bise, node or python of the caller's on PATH
        E.env.update(HOME=home, PATH=SYS_PATH, SHELL="/bin/sh")
        refuse_real_run_dir(E.env, E.tmp)
        refuse_real_home(E.env)
        refuse_real_keys(E.env)
        err = open(os.path.join(E.tmp, "hub.stderr"), "a")
        E.hub = subprocess.Popen([exe, "sbd", "--workspace", E.ws], cwd=E.ws, env=E.env,
                                 stdin=subprocess.DEVNULL, stdout=err, stderr=err)
        sock = os.path.join(E.state, "hub.sock")
        wait.until(lambda: os.path.exists(sock), 30, "the hub's socket", poll=0.05)
        c = Client(sock)
        c.wait_status("main", "idle", 90)
        hub_root = open(os.path.join(E.state, "hub.root")).read().strip()
        check(os.path.realpath(hub_root) == os.path.realpath(root), "the hub runs from the installed bise: %s" % hub_root)

        script = os.path.join(E.tmp, "deck.ts")
        open(script, "w").write(DECK)
        brief = ("make a 3-slide pptx about otters "
                 "[[skill: slides:slides]] "
                 "[[bash: command -v bise && bise --version]] "
                 "[[bash: cp %s \"$TMPDIR/deck.ts\" && bise office run \"$TMPDIR/deck.ts\"]] "
                 "[[bash: bise office inspect otters.pptx]]" % script)
        env = {**E.env, "SB_SOCKET": os.path.join(E.state, "agent.sock"), "SB_AGENT": "main"}
        r = subprocess.run([os.path.join(E.state, "bin", "sb"), "spawn", "t1", "--place", "new", "--objective", brief],
                           cwd=E.ws, env=env, capture_output=True, text=True, timeout=60)
        check(r.returncode == 0 and "t1" in r.stdout, "spawn: %s %s" % (r.stdout, r.stderr))
        wt, _ = placing.placed_worktree(E.ws, "t1")
        c.wait(lambda: any(q["agent"] == "t1" and len(q["tool_texts"]) >= 4 for q in E.fake_requests()), 240,
               "t1 ran its four calls")
        c.wait_idle("t1", timeout=120)
        reqs = [q for q in E.fake_requests() if q["agent"] == "t1"]
        first = reqs[0]["system"]
        # the list itself (the prompt names the tag in prose before it)
        skills = first.split("</available-skills>")[0].rsplit("<available-skills>", 1)[-1]
        for s in ("slides:slides", "sheets:sheets", "docs:docs"):
            check("<name>%s</name>" % s in skills, "%s in t1's <available-skills>: %s" % (s, skills[:1500]))
        check("pptx" in skills and "xlsx" in skills and "docx" in skills, "the descriptions name pptx, xlsx, docx")
        plugins = first.split("## Plugins")[1][:3000] if "## Plugins" in first else ""
        for p in ("slides", "sheets", "docs"):
            check("- `%s`" % p in plugins and "(skills: `%s:%s`)" % (p, p) in plugins,
                  "plugin %s and its skill %s:%s in t1's ## Plugins: %s" % (p, p, p, plugins[:800]))
        texts = reqs[-1]["tool_texts"]
        check("# Slides (pptx)" in texts[0] and "bise office run" in texts[0], "the skill tool gave SKILL.md: %s" % texts[0][:300])
        own = os.path.join(E.state, "bin", "bise")
        check(own in texts[1], "t1's bise is the hub's link %s: %s" % (own, texts[1][:300]))
        check(os.path.realpath(own) == os.path.realpath(exe), "the link is the hub's own executable")
        version = open(os.path.join(root, "VERSION")).read().split()[0].split("=")[-1]
        check(version in texts[1], "bise --version names the hub's build %s: %s" % (version, texts[1][:300]))
        check("otters.pptx" in texts[2] and "v1" in texts[2], "office run wrote the artifact: %s" % texts[2][:600])
        pptx = os.path.join(wt, "otters.pptx")
        check(os.path.isfile(pptx) and open(pptx, "rb").read(2) == b"PK", "otters.pptx in t1's worktree")
        out = texts[3]
        # the outline as the agent read it (its tool text: one node per slide)
        n = out.count('"type":"slide"')
        check(n == 3, "bise office inspect: 3 slides, got %d: %s" % (n, out[:400]))
        check("Otters" in out and "Habitat" in out, "the slides' text is in the deck")
        print("ok: fresh install (%s): office skills listed and loaded, otters.pptx written with bise office run"
              % args[0][2:])
        ok = True
    finally:
        if not ok:
            os.environ["SB_KEEP"] = "1"
        E.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
