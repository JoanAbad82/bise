"""Computer use in a real terminal (tmux; docs/computer-use-design.md §8,
designer m_3551, m_3554, m_3896), against a fake `bise computer-use`
(BISE_COMPUTER_USE: it answers setup-check from a file the test writes
and logs every call) and a fake C6 state.json / events.jsonl in a temp
BEND_RUN_DIR. Never the user's browser or apps: the fake gets the
`open` calls too.

- /computer-use: chrome isn't open → the extension's load-unpacked steps
  (⏎ opens chrome://extensions, copies the folder: the flash) → the live
  test runs by itself (∿), then ✓ ready; with the helper, the "for apps"
  rows: ⏎ asks Accessibility, the cursor moves on when it turns ✓,
  Screen Recording's relaunch shows its wait until the reopened helper
  says yes; an agent driving: its line and x stop all.
- the marks: `↖` in main's row, `· ↖ Chrome` in its divider; paused:
  `? you took the wheel · ⏎ give it back`, ⏎ resumes it; /stop main
  stops it; the hub's line in main's feed from events.jsonl.

SB_DUMP=<dir>: every screen checked is written there (designer's review).

python3 -u tests/tui_computer_use_tmux.py
"""
import json
import os
import shutil
import socket
import sys
import tempfile
import threading

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from tui_tmux import tui_session, run  # noqa: E402

COLS, ROWS = 150, 40
# the setup screen again at 80 columns (Benjamin's steps were cut there)
NARROW = 80

FAKE = r'''#!/usr/bin/env python3
import json, os, sys, time
d = os.environ["CU_FAKE_DIR"]
with open(os.path.join(d, "calls.log"), "a") as f:
    f.write(" ".join(sys.argv[1:]) + "\n")
cmd = sys.argv[1] if len(sys.argv) > 1 else ""
if cmd == "setup-check":
    print(open(os.path.join(d, "check.json")).read())
elif cmd == "live-test":
    time.sleep(3)
    print(json.dumps({"ok": True}))
elif cmd == "request":
    print(json.dumps({"what": sys.argv[2], "relaunching": sys.argv[2] == "screen_recording"}))
else:
    print("{}")
'''


def row(id, state, detail="", fix=None):
    return {"id": id, "state": state, "detail": detail, "fix": fix}


NO_HELPER = [row("accessibility", "not_yet", "", "install_helper"), row("screen_recording", "not_yet", "", "install_helper")]


def main():
    d = tempfile.mkdtemp(prefix="cu-", dir=e2e.short_tmp())
    run_dir = os.path.join(d, "run")
    cu = os.path.join(run_dir, "computer-use")
    os.makedirs(cu)
    fake = os.path.join(d, "fake-cu")
    with open(fake, "w") as f:
        f.write(FAKE)
    os.chmod(fake, 0o755)
    ext = os.path.join(d, "dev", "try", "computer-use", "extension")
    clip = os.path.join(d, "clipboard")

    helper = os.path.join(d, "app", "bise Computer Use.app")

    def check(rows, browser="Chrome"):
        apps = any(r["id"] == "accessibility" and r["fix"] != "install_helper" for r in rows)
        v = {"browser": browser, "min_major": 116, "extension": {"id": "bogffepmbkbmbfejcadaipgphgkocgob", "dir": ext},
             "browsers": [{"key": "chrome", "name": "Chrome", "app": "/Applications/Google Chrome.app"}], "rows": rows,
             "helper": helper if apps else None}
        tmp = os.path.join(d, "check.json.tmp")
        with open(tmp, "w") as f:
            json.dump(v, f)
        os.replace(tmp, os.path.join(d, "check.json"))

    # computer use's state.json v2 (issue 18 step 2, b00f93b1): agents
    # keyed <hub tag id>.<dir> with their name and hub; the TUI shows only
    # its own hub's (computer_use::parse_state), the hash of the socket it
    # talks to (set once the hub is up, below)
    hub = [None]

    def state(agents):
        rows = {"%s.%s" % (hub[0], name): dict(a, name=name, hub=hub[0]) for name, a in agents.items()}
        tmp = os.path.join(cu, "state.json.tmp")
        with open(tmp, "w") as f:
            json.dump({"v": 2, "agents": rows, "browsers": [], "apps": {}}, f)
        os.replace(tmp, os.path.join(cu, "state.json"))

    def calls():
        try:
            return open(os.path.join(d, "calls.log")).read()
        except FileNotFoundError:
            return ""

    def called(what, timeout=10):
        wait.until(lambda: what in calls(), timeout, lambda: "a call %r in\n%s" % (what, calls()))

    dump = os.environ.get("SB_DUMP")
    n = [0]

    def shot(t, name, sc):
        if dump:
            os.makedirs(dump, exist_ok=True)
            n[0] += 1
            with open(os.path.join(dump, "%02d-%s.txt" % (n[0], name)), "w") as f:
                f.write(sc)
            with open(os.path.join(dump, "%02d-%s.ansi" % (n[0], name)), "w") as f:
                f.write(t.screen(colors=True))

    check([row("browser", "waits", "Chrome isn't open", "open_browser"), row("extension", "not_yet"), row("live_test", "not_yet")] + NO_HELPER)
    state({})
    # computer use's commands socket (docs/issues/18): /stop stops by the
    # agent's key there (bise_computer_use::cli::stop_agent), not through
    # the fake binary; a fake broker logs each command as 'ctl <op> <key>'
    ctl = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    ctl.bind(os.path.join(run_dir, "computer-use-ctl.sock"))
    ctl.listen(8)

    def ctl_serve(conn):
        f = conn.makefile("rwb")
        for line in f:
            try:
                m = json.loads(line)
            except ValueError:
                continue
            if "id" not in m:
                continue
            agent = (m.get("args") or {}).get("agent", "")
            with open(os.path.join(d, "calls.log"), "a") as log:
                log.write("ctl %s %s\n" % (m.get("op"), agent))
            if m.get("op") == "status":
                # the broker's status: who drives, by key (the state file)
                with open(os.path.join(cu, "state.json")) as sf:
                    res = {"agents": json.load(sf).get("agents", {})}
            else:
                res = {"stopped": [agent]}
            f.write((json.dumps({"id": m["id"], "ok": True, "result": res}) + "\n").encode())
            f.flush()

    def ctl_accept():
        while True:
            try:
                c, _ = ctl.accept()
            except OSError:
                return
            threading.Thread(target=ctl_serve, args=(c,), daemon=True).start()

    threading.Thread(target=ctl_accept, daemon=True).start()
    # BISE_EXPORTS_FOR empty: an inherited stamp (the agent's shell, tmux's
    # server) would make bise_home drop BEND_RUN_DIR as stale
    env = "BISE_EXPORTS_FOR= BISE_COMPUTER_USE=%s CU_FAKE_DIR=%s BEND_CLIPBOARD_FILE=%s" % (fake, d, clip)
    # the TUI and the hub: this run dir, never the user's (E.env's
    # BEND_ vars come after extra_env on the TUI's command line)
    E = e2e.Env()
    E.env["BEND_RUN_DIR"] = run_dir
    # the hash of the socket the TUI talks to (its short path if relocated)
    hub[0] = e2e.hub_tag(e2e.short_sock(os.path.join(E.state, "hub.sock")))
    try:
        with tui_session(COLS, ROWS, env=env, E=E) as t:
            t.wait("bise :*")
            # ---- the setup screen ----
            # /computer-use takes a word (6865115c): ⏎ on the command's row
            # fills '/computer-use ' and opens its rows (plugin off: one
            # 'on' row), a second ⏎ runs the bare command
            t.typed("/computer-use")
            t.keys("Enter")
            t.wait("turn computer use on and set it up")
            t.keys("Enter")
            # the whole screen: the rows, the hub's approvals mode and the
            # provider come from different states (red under load when it
            # waited on the rows then asserted the mode line)
            sc = t.wait_all(["Chrome isn't open. open it, i'll wait",
                             "computer use · agents can drive Chrome",
                             "? Chrome", "· Chrome extension    after Chrome", "· live test           last",
                             "⏎ open Chrome   ↑↓ step   esc later",
                             "in yolo, agents act without asking, purchases included. ⇧⇥ for auto.",
                             "what the agents see goes only to their model:"])
            assert "for apps" not in sc and "accessibility" not in sc, sc
            shot(t, "chrome-not-open", sc)
            t.keys("Enter")
            called("open -a /Applications/Google Chrome.app")
            # Chrome open: the extension's steps
            check([row("browser", "done", "Chrome 154"), row("extension", "waits", "add bise to Chrome", "add_extension"), row("live_test", "not_yet")] + NO_HELPER)
            # Benjamin (13 Oct): every step whole, the folder to pick named
            sc = t.wait_all(["4  i'll see it here, no key needed",
                             "✓ Chrome              Chrome 154", "? Chrome extension    add bise to Chrome",
                             "1  ⏎ opens chrome://extensions and copies bise's folder",
                             "2  turn on Developer mode, top right",
                             # one line at 150 (designer m_21219)
                             "3  click Load unpacked, then cmd+shift+g, cmd+v, return and Select",
                             "   the folder: " + ext,
                             "⏎ open chrome://extensions   c copy the path"])
            assert "…" not in sc.split("? Chrome extension")[1].split("· live test")[0], sc
            shot(t, "extension-steps", sc)
            t.keys("Enter")
            sc = t.wait("opened chrome://extensions · path copied")
            called("open -a /Applications/Google Chrome.app chrome://extensions")
            # a first setup: ⏎ writes the native host too
            called("repair")
            assert open(clip).read() == ext
            os.remove(clip)
            t.typed("c")
            t.wait("path copied")
            assert open(clip).read() == ext
            shot(t, "extension-flash", sc)
            # the extension connects: the live test runs by itself
            check([row("browser", "done", "Chrome 154"), row("extension", "done", "v0.1.0"), row("live_test", "waits", "last", "run_live_test")] + NO_HELPER)
            sc = t.wait("∿ live test           opening a tab in the background…")
            called("live-test --json")
            # the extension is in: the step-2 flash is gone, the key bar back
            sc = t.wait("↑↓ step   esc later")
            assert "path copied" not in sc, sc
            shot(t, "live-test-running", sc)
            check([row("browser", "done", "Chrome 154"), row("extension", "done", "v0.1.0"), row("live_test", "done", "ready")] + NO_HELPER)
            sc = t.wait_all(["✓ Chrome is ready. ask any agent to use it.",
                             "✓ live test           opened a tab, clicked a button. all set"], timeout=15)
            assert "checks it again" not in sc, sc
            shot(t, "ready", sc)
            # the live test failed: try again (contractions)
            check([row("browser", "done", "Chrome 154"), row("extension", "done", "v0.1.0"), row("live_test", "failed", "the click did not land", "run_live_test")] + NO_HELPER)
            sc = t.wait_all(["✗ live test           the click didn't land", "⏎ try again"])
            shot(t, "live-test-failed", sc)
            # the helper installed: the apps rows after the live test
            web = [row("browser", "done", "Chrome 154"), row("extension", "done", "v0.1.0"), row("live_test", "done", "ready")]
            # the helper doesn't answer yet (Benjamin, 13 Oct: no ⏎ then):
            # the rows act all the same
            check(web + [row("accessibility", "checking"), row("screen_recording", "checking")])
            t.wait_all(["for apps", "agents can drive your apps and Chrome"])
            sc = t.wait_all(["∿ accessibility       waiting for bise Computer Use to answer…",
                             "1  ⏎ opens Privacy & Security › Accessibility",
                             "⏎ open System Settings   c copy the path"])
            shot(t, "apps-helper-silent", sc)
            t.keys("Enter")
            # the pane, by its URL: from the TUI, whatever the helper does
            called("open x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
            called("request accessibility")
            t.wait("opened System Settings · path copied")
            assert open(clip).read() == helper
            check(web + [row("accessibility", "waits", "", "request_accessibility"), row("screen_recording", "waits", "", "request_screen_recording")])
            t.wait_all(["2  turn on bise Computer Use", "not in the list? click +, then cmd+shift+g, cmd+v, return, Open", "3  i'll see it here"])
            sc = t.wait_all(["⏎ open System Settings", "? accessibility       lets agents click and type in apps"])
            shot(t, "apps-accessibility", sc)
            check(web + [row("accessibility", "done"), row("screen_recording", "waits", "", "request_screen_recording")])
            sc = t.wait_all(["macOS reopens it, i'll wait", "✓ accessibility       bise can click and type in apps"])
            shot(t, "apps-screen-recording", sc)
            t.keys("Enter")
            called("open x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
            called("request screen_recording")
            check(web + [row("accessibility", "done"), row("screen_recording", "checking")])
            sc = t.wait("∿ screen recording    bise Computer Use reopens…")
            shot(t, "apps-reopening", sc)
            check(web + [row("accessibility", "done"), row("screen_recording", "done")])
            sc = t.wait("✓ screen recording    bise can see app windows")
            sc = t.wait("✓ ready. ask any agent to use Chrome or an app.")
            shot(t, "apps-done", sc)
            # an agent drives: its line, x stops them all
            state({"main": {"driving": "Chrome", "where": "amazon.fr", "since_ms": 1, "paused": False, "stopped": False}})
            sc = t.wait_all(["↖ main drives Chrome", "x stop all"])
            shot(t, "stop-all", sc)
            t.typed("x")
            called("stop --all")
            t.keys("Escape")
            t.wait_gone("computer use · agents can drive")
            # ---- the marks ----
            # the divider's mark and the panel row's ↖ (one state, maybe
            # two frames)
            def marks(sc):
                return " · ↖ Chrome" in sc and any(l.rstrip(" │").endswith("↖") for l in sc.split("\n") if " main " in l and ":*" in l and "│" in l)
            marks.__doc__ = "the divider's ↖ Chrome and main's ↖ in the panel"
            sc = t.wait_any([marks])[1]
            div = [l for l in sc.split("\n") if "you → main" in l][-1]
            assert div.rstrip().endswith("↖ Chrome ─────────────────────────────────────────────────────────┤") or "↖ Chrome" in div, div
            mrow = [l for l in sc.split("\n") if " main " in l and ":*" in l and "│" in l]
            assert any(l.rstrip(" │").endswith("↖") for l in mrow), mrow
            shot(t, "driving-marks", sc)
            # paused: the divider asks, ⏎ gives it back
            state({"main": {"driving": "Chrome", "where": "amazon.fr", "since_ms": 1, "paused": True, "stopped": False}})
            sc = t.wait("? you took the wheel · ⏎ give it back")
            shot(t, "paused", sc)
            t.keys("Enter")
            called("resume main")
            # /stop main: stop, then the hub's line in main's feed
            state({"main": {"driving": "Chrome", "where": "amazon.fr", "since_ms": 1, "paused": False, "stopped": False}})
            t.wait_gone("you took the wheel")
            t.typed("/stop main")
            t.keys("Enter")
            # by main's key (<this hub's tag id>.main) on the commands socket
            called("ctl stop ")
            assert any(l.startswith("ctl stop ") and l.endswith(".main") and len(l.split(" ")[2].split(".")[0]) == 16 for l in calls().splitlines()), calls()
            with open(os.path.join(cu, "events.jsonl"), "a") as f:
                # events v2: by key, with its name and hub (the hub's Watch
                # feeds main only its own hub's)
                f.write(json.dumps({"t": 1, "agent": "%s.main" % hub[0], "name": "main", "hub": hub[0], "event": "stopped", "by": "you", "driving": "Chrome"}) + "\n")
            state({"main": {"driving": None, "where": None, "paused": False, "stopped": True}})
            def stopped(sc):
                return "↖ main stopped driving Chrome · you stopped it" in sc and " · ↖ Chrome" not in sc
            stopped.__doc__ = "the stopped line, the divider's ↖ Chrome gone"
            sc = t.wait_any([stopped], 15)[1]
            # one line only (m_3904): no echo of /stop, no "no turn to interrupt"
            assert "stopped main:" not in sc and "no turn in progress" not in sc, sc
            shot(t, "stopped-feed-line", sc)
        # ---- 80 columns: every step whole, wrapped under its number ----
        state({})
        check([row("browser", "done", "Chrome 154"), row("extension", "waits", "add bise to Chrome", "add_extension"), row("live_test", "not_yet")] + NO_HELPER)
        with tui_session(NARROW, ROWS, env=env, E=E) as t:
            t.wait("bise :*")
            t.typed("/computer-use")
            t.keys("Enter")
            # its menu: 'on' or 'setup', as this session reads the plugin
            t.wait_any(["turn computer use on and set it up", "the setup steps: browsers, extension, apps"])
            t.keys("Enter")
            # two lines at 80 (designer m_21219)
            sc = t.wait_all(["3  click Load unpacked, then cmd+shift+g, cmd+v,",
                             "   return and Select", "4  i'll see it here, no key needed",
                             "⏎ open chrome://extensions   c copy the path"])
            assert "…" not in sc.split("? Chrome extension")[1].split("· live test")[0], sc
            shot(t, "narrow-extension-steps", sc)
            web = [row("browser", "done", "Chrome 154"), row("extension", "done", "v0.1.0"), row("live_test", "done", "ready")]
            check(web + [row("accessibility", "waits", "", "request_accessibility"), row("screen_recording", "waits", "", "request_screen_recording")])
            sc = t.wait_all(["? accessibility       lets agents click and type in apps",
                             "1  ⏎ opens Privacy & Security › Accessibility",
                             "   not in the list? click +, then cmd+shift+g, cmd+v,",
                             "   return, Open", "⏎ open System Settings   c copy the path"])
            shot(t, "narrow-apps", sc)
    finally:
        ctl.close()
        shutil.rmtree(d, ignore_errors=True)


if __name__ == "__main__":
    run(main)
