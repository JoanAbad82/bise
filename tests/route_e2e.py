"""bise desktop S2 step 3: bise's home hub routes his words, on real hubs
(bise sbd, fake provider) and a throwaway BISE_HOME (never ~/.bise, never
~/bise): home + 3 registered projects (shop, atlas, ledger), their hubs
stopped.

- his words to bise's main naming a project ("... on shop ...") are
  routed by the shell (daemon/routing.rs: route::guess + route::target):
  sb-core holds them (route_held, to shop's hub id, why 'you named shop'),
  sends them at 2 s (route_sent), the home hub starts shop's hub and
  delivers them once as his words via bise; the other projects' hubs are
  never started; shop's main's answer comes back to bise's main from
  @shop;
- words naming no project stay home: plain user input to bise's main, no
  route.

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
    # S2 step 5: unclear words ask the route model (the fake provider)
    E.env["BISE_ROUTE_MODEL"] = "mistral/mistral-small-latest"
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

        # his words about shop: held, then sent to shop's main
        c.say("the checkout on shop is broken again")
        wait.until(lambda: of_type(hstate, "route_held"), 10, "the route held")
        held = of_type(hstate, "route_held")
        route = held[0]["route"]
        check(len(held) == 1 and route["to"] == by_name["shop"]["id"] and route["name"] == "shop", "held for shop: %r" % held)
        check("you named shop" in route.get("why", ""), "why: %r" % route)
        wait.until(lambda: of_type(hstate, "route_sent"), 15, "the route sent at 2 s")
        wait.until(lambda: of_type(hstate, "x_acked"), 60, "the delivery's ack")
        pin = of_type(pstate["shop"], "x_in")
        check(len(pin) == 1 and pin[0]["in"]["hub"] == home_row["id"], "shop received it once: %r" % pin)
        said = [m["msg"] for m in of_type(pstate["shop"], "message_sent") if m["msg"]["id"] == pin[0]["in"]["msg"]][0]
        check(said["from"] == "user" and said.get("via") == "bise" and "the checkout on shop is broken again" in said["text"],
              "as his words via bise: %r" % said)
        for p in ("atlas", "ledger"):
            check(not of_type(pstate[p], "x_in") and not os.path.exists(os.path.join(pstate[p], "hub.sock")),
                  "%s's hub never started" % p)
        wait.until(lambda: of_type(hstate, "x_settled"), 90, "shop's answer settles the send")
        ans = [m["msg"] for m in of_type(hstate, "message_sent") if m["msg"]["from"] == "@shop"]
        check(len(ans) == 1 and ans[0]["to"] == "main", "shop's answer to bise's main: %r" % ans)

        # words naming no project: bise's main, as today
        c.wait_idle("main")
        c.say("what is on my list today?")
        wait.until(lambda: [m for m in of_type(hstate, "message_sent")
                            if m["msg"]["from"] == "user" and "on my list today" in m["msg"]["text"]], 20, "his message home")
        targeted = [e for e in of_type(hstate, "route_held") if e["route"]["to"]]
        check(len(targeted) == 1, "no route for it: %r" % of_type(hstate, "route_held"))
        # S2 step 5: unclear words waited 1.5 s for BISE_ROUTE_MODEL (the
        # fake answered none), then went plain to bise's main
        unclear = [e for e in of_type(hstate, "route_held") if not e["route"]["to"]]
        check(len(unclear) == 1 and "on my list today" in unclear[0]["route"]["text"], "held unclear first: %r" % unclear)

        # S2 step 5: unclear words the route model places (the fake picks
        # the 2nd project listed): held 2 s for it, then sent there
        c.wait_idle("main")
        c.say("the build is red again [[route: 2]]")
        wait.until(lambda: [e for e in of_type(hstate, "route_held") if e["route"]["to"] == by_name["atlas"]["id"]], 15, "the model's pick held")
        picked = [e["route"] for e in of_type(hstate, "route_held") if e["route"]["to"] == by_name["atlas"]["id"]][0]
        check(picked["name"] == "atlas" and "bise's model picked atlas" in picked["why"], "picked atlas: %r" % picked)
        wait.until(lambda: len(of_type(hstate, "route_sent")) >= 2, 15, "sent to atlas at 2 s")
        outs = [e["out"] for e in of_type(hstate, "x_out") if "build is red" in e["out"]["text"]]
        check(len(outs) == 1 and outs[0]["project"] == by_name["atlas"]["id"], "forwarded once, to atlas: %r" % outs)

        # item H (architect m_9875): his attached files travel with routed
        # words, rendered once on the home hub: the image as its
        # image-store marker (one store for every hub), once though he
        # attached it twice; another file by its path
        c.wait_idle("main")
        png = os.path.join(E.tmp, "cart.png")
        with open(png, "wb") as f:
            f.write(tiny_png())
        notes = os.path.join(E.tmp, "q3-notes.md")
        with open(notes, "w") as f:
            f.write("q3")
        c.say("look at the cart on shop", files=[png, notes, png])
        wait.until(lambda: [e for e in of_type(hstate, "x_out") if "look at the cart" in e["out"]["text"]], 15, "the files' route sent")
        sent = [e["out"]["text"] for e in of_type(hstate, "x_out") if "look at the cart" in e["out"]["text"]][0]
        nl = chr(10)
        check(sent.count('<image name="cart.png"') == 1 and ("[files he attached:]" + nl + notes) in sent and sent.count(notes) == 1,
              "the routed text carries the marker once and the notes' path: %r" % sent)
        b64 = sent.split('b64="', 1)[1].split('"', 1)[0]
        check(os.path.exists(b64), "the marker names the shared image store: %s" % b64)
        wait.until(lambda: [m for m in of_type(pstate["shop"], "message_sent")
                            if m["msg"]["from"] == "user" and "look at the cart" in m["msg"]["text"]], 60, "shop got it")
        got = [m["msg"]["text"] for m in of_type(pstate["shop"], "message_sent")
               if m["msg"]["from"] == "user" and "look at the cart" in m["msg"]["text"]][0]
        check('<image name="cart.png"' in got and notes in got, "shop's main has his files: %r" % got)

        # R41 (6) (architect m_18164): his message as typed parts, an
        # image by its source (the window's paste, sha A 18a32ce3), routed
        # to shop: the route holds his parts, the out carries them, shop's
        # message keeps them with its b64 in the store, and shop main's
        # model gets the image as an image part, not '[image unavailable]'
        d = e2e.Client(hsock, name="window")
        c.wait_idle("main")
        shelf = os.path.join(E.tmp, "shelf.png")
        with open(shelf, "wb") as f:
            f.write(tiny_png())
        iparts = [{"kind": "text", "text": "look at the shelf on shop "}, {"kind": "image", "name": "[Image #1]", "source": shelf}]
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
               parts=[{"kind": "text", "text": "the shelf again on shop "}, {"kind": "image", "name": "[Image #1]", "source": shelf}]), "his parts sent again")
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
