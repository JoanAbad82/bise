"""bise desktop S2 step 3: bise's home hub routes his words, on real hubs
(bise sbd, fake provider) and a throwaway BISE_HOME (never ~/.bise, never
~/bise): home + 3 registered projects (shop, atlas, ledger), their hubs
stopped.

- route-name (his m_75, architect m_24939): words that only NAME a project
  ("je les voie pas dans shop non plus") stay with bise's main: no route;
- his words addressed to a project ("@shop ...") are routed by the shell
  (daemon/routing.rs: route::addressed): sb-core holds them (route_held,
  to shop's hub id, why 'you wrote @shop'), sends them at 2 s
  (route_sent), the home hub starts shop's hub and delivers them once as
  his words via bise (shop's main thread: his `you` line with via bise,
  once); bise's main thread has his line and where it went (`routed`, by
  his message's id) and the window's route/done carries that id (its
  pending row settles); the other projects' hubs are never started;
  shop's main's answer comes back to bise's main from @shop.

Run: python3 -u tests/route_e2e.py
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import EXE, ROOT, check  # noqa: E402
from proto_rpc import ok as answered, req  # noqa: E402

PROJECTS = ["shop", "atlas", "ledger"]


def bise(env, *args):
    return subprocess.run([EXE, *args], cwd="/", env=env, capture_output=True, text=True, timeout=60)


def journal(state):
    try:
        lines = open(os.path.join(state, "journal.jsonl")).read().splitlines()
    except OSError:
        return []
    out = []
    for l in lines:
        try:
            out.append(json.loads(l))
        except ValueError:
            pass
    return out


def of_type(state, t):
    return [e for e in journal(state) if e.get("type") == t]


def repo(path, remote):
    os.makedirs(path)
    e2e.sh(path, "git init -q && git config user.email t@t && git config user.name t && git config commit.gpgsign false"
           " && git remote add origin %s && echo base > README && git add README && git commit -qm init" % remote)


tiny_png = e2e.tiny_png


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    home = tempfile.mkdtemp(prefix="br-", dir=e2e.short_tmp())
    home_ws = os.path.realpath(os.path.join(E.tmp, "home-ws"))
    os.makedirs(home_ws)
    E.env.pop("SB_STATE_DIR")
    E.env["BISE_HOME"] = os.path.join(home, "b")
    E.env["BISE_HOME_WORKSPACE"] = home_ws
    hubs_dir = os.path.join(E.env["BISE_HOME"], "hubs")
    hubs = []
    ok = True
    try:
        for p in PROJECTS:
            path = os.path.realpath(os.path.join(E.tmp, "repos")) + "/" + p
            repo(path, "git@github.com:acme/%s.git" % p)
            r = bise(E.env, "project", "add", path)
            check(r.returncode == 0, "bise project add %s: %s %s" % (p, r.stdout, r.stderr))
        rows = json.loads(bise(E.env, "project", "list", "--json").stdout)
        check(len(rows) == 4, "home + 3 projects: %r" % rows)
        home_row = rows[0]
        by_name = {r["name"]: r for r in rows[1:]}
        check(sorted(by_name) == sorted(PROJECTS), "the projects' names: %r" % rows)
        hstate = os.path.join(hubs_dir, home_row["id"])
        pstate = {p: os.path.join(hubs_dir, by_name[p]["id"]) for p in PROJECTS}

        err = open(os.path.join(E.tmp, "hub.stderr"), "a")
        hubs.append(subprocess.Popen([EXE, "sbd", "--workspace", home_ws], cwd=ROOT, env=E.env,
                                     stdin=subprocess.DEVNULL, stdout=err, stderr=err))
        hsock = os.path.join(hstate, "hub.sock")
        wait.until(lambda: os.path.exists(hsock), 30, "the home hub's socket", poll=0.05)
        c = e2e.Client(hsock)
        c.wait_status("main", "idle", 60)

        # his m_75, verbatim but for the name: words ABOUT a project stay
        # with bise's main, whatever they name
        d = e2e.Client(hsock, name="window")
        answered(req(d, "thread/subscribe", agent="main"), "the window follows bise's main")
        for words in ["je les voie pas dans shop non plus", "the checkout on shop is broken again", "tell @shop it's fine"]:
            c.wait_idle("main")
            c.say(words)
            wait.until(lambda: [m for m in of_type(hstate, "message_sent")
                                if m["msg"]["from"] == "user" and words in m["msg"]["text"]], 20, "his message home: %s" % words)
        check(not of_type(hstate, "route_held"), "no route for words that name a project: %r" % of_type(hstate, "route_held"))

        # his words addressed to shop: held, then sent to shop's main
        c.wait_idle("main")
        cid_said = "@shop the checkout is broken again"
        r = answered(req(d, "turn/send", agent="main", text=cid_said, mode="now"), "his addressed words sent")
        # send-reason: no message here, the result says it was routed (no msg_id)
        check(r == {"reason": "routed"}, "turn/send's result says routed: %r" % r)
        wait.until(lambda: of_type(hstate, "route_held"), 10, "the route held")
        held = of_type(hstate, "route_held")
        route = held[0]["route"]
        check(len(held) == 1 and route["to"] == by_name["shop"]["id"] and route["name"] == "shop", "held for shop: %r" % held)
        check("you wrote @shop" in route.get("why", ""), "why: %r" % route)
        wait.until(lambda: of_type(hstate, "route_sent"), 15, "the route sent at 2 s")
        wait.until(lambda: of_type(hstate, "x_acked"), 60, "the delivery's ack")
        pin = of_type(pstate["shop"], "x_in")
        check(len(pin) == 1 and pin[0]["in"]["hub"] == home_row["id"], "shop received it once: %r" % pin)
        said = [m["msg"] for m in of_type(pstate["shop"], "message_sent") if m["msg"]["id"] == pin[0]["in"]["msg"]][0]
        check(said["from"] == "user" and said.get("via") == "bise" and cid_said in said["text"],
              "as his words via bise: %r" % said)
        # shop's main thread: his words once, via bise (what the window and the TUI fold)
        # (its main's folder: whichever agents/<dir> holds its thread)
        def shop_you():
            logs = [os.path.join(pstate["shop"], "agents", a, "transcript.log") for a in os.listdir(os.path.join(pstate["shop"], "agents"))]
            return [l for f in logs if os.path.exists(f) for l in open(f).read().splitlines()
                    if l.split("\t", 1)[-1].startswith("sb you :: ") and cid_said in l]
        try:
            wait.until(shop_you, 60, "shop's main delivered it")
        except Exception:
            pass
        mine = shop_you()
        logs = {a: open(os.path.join(pstate["shop"], "agents", a, "transcript.log")).read()[-1500:]
                for a in os.listdir(os.path.join(pstate["shop"], "agents")) if os.path.exists(os.path.join(pstate["shop"], "agents", a, "transcript.log"))}
        check(len(mine) == 1 and '"via":"bise"' in mine[0], "shop's thread shows his words once via bise: %r in %r" % (mine, logs))
        # bise's main thread: his line, its id, and where it went by that id
        his = [m["msg"]["id"] for m in of_type(hstate, "message_sent") if m["msg"]["from"] == "user" and cid_said in m["msg"]["text"]]
        check(len(his) == 1, "one message of his at home: %r" % his)
        home_main = open(os.path.join(hstate, "agents", "main", "transcript.log")).read()
        routed = [json.loads(l.split("sb routed :: ", 1)[1]) for l in home_main.splitlines() if "\tsb routed :: " in l]
        check(('sb you-id :: {"id":%d}' % his[0]) in home_main
              and routed == [{"to": by_name["shop"]["id"], "name": "shop", "xid": 1, "msg": his[0]}],
              "bise's main thread says where it went: %r" % home_main[-1500:])
        went = [e for e in d.notes("thread/entry") if e.get("agent") == "main" and e["entry"].get("msg_id") == his[0]]
        check(went and went[-1]["entry"].get("went") == {"to": by_name["shop"]["id"], "name": "shop"} and "delivery" not in went[-1]["entry"],
              "the window's entry: sent to shop, no mark: %r" % went)
        done = [e for e in d.notes("route/done") if e.get("rid") == route["rid"]]
        check(done and done[-1].get("msg") == his[0], "route/done carries his message's id (his pending row settles): %r" % done)
        for p in ("atlas", "ledger"):
            check(not of_type(pstate[p], "x_in") and not os.path.exists(os.path.join(pstate[p], "hub.sock")),
                  "%s's hub never started" % p)
        wait.until(lambda: of_type(hstate, "x_settled"), 90, "shop's answer settles the send")
        ans = [m["msg"] for m in of_type(hstate, "message_sent") if m["msg"]["from"] == "@shop"]
        check(len(ans) == 1 and ans[0]["to"] == "main", "shop's answer to bise's main: %r" % ans)

        # an address to atlas goes there, to no other project
        c.wait_idle("main")
        c.say("@atlas the build is red again")
        wait.until(lambda: [e for e in of_type(hstate, "x_out") if "build is red" in e["out"]["text"]], 15, "sent to atlas at 2 s")
        outs = [e["out"] for e in of_type(hstate, "x_out") if "build is red" in e["out"]["text"]]
        check(len(outs) == 1 and outs[0]["project"] == by_name["atlas"]["id"], "forwarded once, to atlas: %r" % outs)

        # (item H's files list, architect m_9875, went in issue 31: his
        # images and files are parts, routed below)

        # R41 (6) (architect m_18164): his message as typed parts, an
        # image by its source (the window's paste, sha A 18a32ce3), routed
        # to shop: the route holds his parts, the out carries them, shop's
        # message keeps them with its b64 in the store, and shop main's
        # model gets the image as an image part, not '[image unavailable]'
        c.wait_idle("main")
        shelf = os.path.join(E.tmp, "shelf.png")
        with open(shelf, "wb") as f:
            f.write(tiny_png())
        iparts = [{"kind": "text", "text": "@shop look at the shelf "}, {"kind": "image", "name": "[Image #1]", "source": shelf}]
        n_req = len(E.fake_requests())
        answered(req(d, "turn/send", agent="main", text="", parts=iparts, mode="now"), "his parts sent")
        wait.until(lambda: [e for e in of_type(hstate, "x_out") if "look at the shelf" in e["out"]["text"]], 15, "the parts' route sent")
        out = [e["out"] for e in of_type(hstate, "x_out") if "look at the shelf" in e["out"]["text"]][0]
        sent_parts = json.loads(out.get("parts", "[]"))
        check([p.get("source") for p in sent_parts if p["kind"] == "image"] == [shelf], "the out carries his parts: %r" % out)
        home_msg = [m["msg"] for m in of_type(hstate, "message_sent") if m["msg"]["from"] == "user" and "look at the shelf" in m["msg"]["text"]]
        check(home_msg and home_msg[-1].get("parts"), "his message at home keeps his parts: %r" % home_msg[-1:])
        wait.until(lambda: [m for m in of_type(pstate["shop"], "message_sent")
                            if m["msg"]["from"] == "user" and "look at the shelf" in m["msg"]["text"]], 60, "shop got the parts")
        pm = [m["msg"] for m in of_type(pstate["shop"], "message_sent") if m["msg"]["from"] == "user" and "look at the shelf" in m["msg"]["text"]][0]
        pimgs = [p for p in json.loads(pm.get("parts") or "[]") if p["kind"] == "image"]
        check(pimgs and pimgs[0]["b64_file"].endswith(".b64") and os.path.isfile(pimgs[0]["b64_file"]) and pimgs[0]["b64_file"] in pm["text"],
              "shop's message keeps the image part, its .b64 in the store and in the text: %r" % pm)

        def shop_saw_image():
            return [r for r in E.fake_requests()[n_req:]
                    if "look at the shelf" in json.dumps(r) and any(i.startswith("data:image/png;base64,") for i in r.get("images", []))]
        try:
            wait.until(shop_saw_image, 90, "shop main's model got the image")
        except Exception:
            check(False, "shop main's request carries the image part: %r" % [(r.get("agent"), r.get("user_tail", "")[-200:], [i[:40] for i in r.get("images", [])])
                                                                             for r in E.fake_requests()[n_req:]][-3:])
        check(not any("image unavailable" in json.dumps(r) and "look at the shelf" in json.dumps(r) for r in E.fake_requests()[n_req:]),
              "no '[image unavailable]' for it")

        # a cancel keeps his parts: his words reach bise's main with them
        c.wait_idle("main")
        answered(req(d, "turn/send", agent="main", text="", mode="now",
               parts=[{"kind": "text", "text": "@shop the shelf again "}, {"kind": "image", "name": "[Image #1]", "source": shelf}]), "his parts sent again")
        held = lambda: [e for e in d.notes("route/held") if "the shelf again" in e.get("text", "")]
        wait.until(held, 10, "the second route held")
        answered(req(d, "route/cancel", rid=held()[0]["rid"]), "route/cancel")
        wait.until(lambda: [m for m in of_type(hstate, "message_sent") if "the shelf again" in m["msg"]["text"]], 15, "the cancel said it to main")
        cm = [m["msg"] for m in of_type(hstate, "message_sent") if "the shelf again" in m["msg"]["text"]][-1]
        check(any(p["kind"] == "image" for p in json.loads(cm.get("parts") or "[]")), "the cancel keeps his parts: %r" % cm)
        check(not [e for e in of_type(hstate, "x_out") if "the shelf again" in e["out"]["text"]], "a cancel forwards nothing")
    except AssertionError as e:
        print("FAIL", e)
        ok = False
    finally:
        for d in (os.listdir(hubs_dir) if os.path.isdir(hubs_dir) else []):
            sock = os.path.join(hubs_dir, d, "hub.sock")
            if os.path.exists(sock):
                try:
                    e2e.stop_hub(sock)
                except Exception:
                    pass
        for h in hubs:
            try:
                h.wait(timeout=30)
            except Exception:
                h.kill()
        for d in (os.listdir(hubs_dir) if os.path.isdir(hubs_dir) else []):
            pid = os.path.join(hubs_dir, d, "hub.pid")
            if os.path.exists(pid):
                try:
                    wait.until(lambda: not os.path.exists(pid), 30, "hub %s stopped" % d, poll=0.2)
                except Exception as e:
                    print("WARN", e)
        E.close()
        shutil.rmtree(home, ignore_errors=True)
    print("route_e2e:", "ok" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
