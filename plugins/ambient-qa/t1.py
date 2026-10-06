"""ambient-qa t1: the first-try scenario of bise desktop (ambient-lead m_8964), on the world.

The flows the user will try by hand, one after the other, on the harness app (off-screen, never
in front) over a running `qa.py world` (bise's home hub + its projects, fake providers only):

  1 the pearl's dropdown: 'open bise' opens the window on bise
  2 ⌘0 from the bar opens the window
  3 the sidebar lists every project and its agents
  4 words in bise's thread get bise's answer
  5 words in a project's main get its answer
  6 an agent's thread opens
  7 a question card above the composer, answered by text
  8 an approval answered by 1, then the next one by 2
  9 fn held with the fake voice: the words reach bise
 10 fn space, typed words, ⏎: they reach bise
 11 ⏎ in the spotlight on an agent's name opens its thread in the window
 12 the environments screen lists the projects' worktrees
 13 a card while the window is in front stays there; the window closes: it comes to the bar

  qa.py world up --projects 3     (once)
  qa.py real t1 [--out DIR]       the run: t1.json + report.txt + shots, a verdict per step

Each step records what it did, the window's or the bar's text, the app's events, a shot, and a
verdict (pass/fail + why). The proof (his front app unchanged, no window on a screen, never
active, no Dock icon) is taken before and after; the app is stopped by its pid at the end.
"""
import glob
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, HERE)
import qa  # noqa: E402
import world  # noqa: E402
sys.path.insert(0, os.path.join(qa.REPO, "tests"))
try:
    from wait import load_factor  # noqa: E402
except ImportError:
    def load_factor():
        return 1.0

QA_JS = ("(() => JSON.stringify([...document.querySelectorAll('[data-qa]')].filter(e => { const b = e.getBoundingClientRect(); "
         "return b.width > 0 && b.height > 0; }).map(e => [e.getAttribute('data-qa'), (e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60)])))()")
TEXT_JS = "document.body.innerText.replace(/\\s+/g,' ')"


class Run:
    def __init__(self, out):
        self.out = out
        os.makedirs(out, exist_ok=True)
        self.R = {"steps": [], "started": time.strftime("%Y-%m-%d %H:%M:%S")}
        self.last = 0
        info = world._read(world._paths(world.world_dir())["json"])
        if not info:
            raise qa.QAError("no world up: `qa.py world up --projects 3` first")
        self.info = info
        self.W = world.state()
        self.ids = {x["name"]: x["id"] for x in (self.W.get("registry") or {}).get("list", [])}

    # ---- reads
    def save(self):
        with open(os.path.join(self.out, "t1.json"), "w") as f:
            json.dump(self.R, f, indent=1, default=str, ensure_ascii=False)

    def events(self):
        e = qa.real_op("events", since=self.last)
        self.last = e.get("last", self.last)
        out = []
        for x in e.get("events", []):
            b = x.get("body")
            if isinstance(b, dict) and (b.get("ev") in ("level", "app_settings", "app_size", "projects", "agents", "artifacts")
                                        or b.get("cmd") in ("app_size", "win_size")):
                continue
            out.append([x.get("kind"), b])
        return out

    def text(self, window="win"):
        try:
            return qa.real_op("eval", window=window, js=TEXT_JS).get("value") or ""
        except qa.QAError as e:
            return "(%s)" % e

    def qas(self):
        try:
            return json.loads(qa.real_op("eval", window="win", js=QA_JS).get("value") or "[]")
        except (qa.QAError, ValueError):
            return []

    def find(self, pred):
        for k, t in self.qas():
            if pred(k, t):
                return k
        return None

    def click(self, key):
        if not key:
            raise qa.QAError("no such data-qa in the window")
        return qa.real_click('[data-qa="%s"]' % key, "win")

    def st(self):
        s = qa.real_op("state")
        return {"bar": {k: (s.get("bar") or {}).get(k) for k in ("visible", "test_key")},
                "win": {k: (s.get("win") or {}).get(k) for k in ("visible", "test_key", "route", "title")}}

    def hub(self, project):
        return [h for h in self.info["hubs"] if h["project"] == project or (project == world.HOME_NAME and h["home"])][0]

    def transcript(self, project):
        p = os.path.join(self.hub(project)["state"], "agents", "main", "transcript.log")
        return open(p, errors="replace").read() if os.path.exists(p) else ""

    def cards(self, project):
        return world._hub_state(self.hub(project)["sock"]).get("cards", [])

    def applog(self):
        p = os.path.join(self.W["home"], ".bise", "dev", "ambient", "app.log")
        return open(p, errors="replace").read().splitlines() if os.path.exists(p) else []

    @staticmethod
    def wait(pred, timeout=30.0, every=0.4):
        t0 = time.time()
        while time.time() - t0 < timeout * load_factor():
            try:
                v = pred()
            except Exception:  # noqa: BLE001
                v = None
            if v:
                return v
            time.sleep(every)
        return None

    # ---- one step
    def step(self, n, name, act, check, window="win", settle=1.5):
        r = {"n": n, "name": name}
        t0 = time.time()
        try:
            r["did"] = act()
        except Exception as e:  # noqa: BLE001
            r["error"] = repr(e)[-500:]
        time.sleep(settle)
        try:
            ok, why = check() if "error" not in r else (False, r["error"])
        except Exception as e:  # noqa: BLE001
            ok, why = False, "check failed: %r" % e
        r.update(verdict="pass" if ok else "fail", why=why, s=round(time.time() - t0, 1))
        try:
            r["events"] = self.events()[-25:]
            r["state"] = self.st()
            r["text"] = self.text(window)[:900]
            r["shot"] = qa.real_op("shot", what=window).get("png")
        except Exception as e:  # noqa: BLE001
            r["read_error"] = repr(e)[-300:]
        self.R["steps"].append(r)
        self.save()
        return r

    # ---- the flows
    def run(self, bise=None):
        W, ids = self.W, self.ids
        projects = [h for h in W["hubs"] if not h["home"]]
        shop = "shop" if any(h["project"] == "shop" for h in projects) else projects[0]["project"]
        agent = next((a["name"] for a in [h for h in projects if h["project"] == shop][0]["agents"] if a["name"] != "main" and a.get("mode") == "worktree"), None)
        other = [h["project"] for h in projects if h["project"] != shop][0]
        self.R["front_start"] = qa._front()
        run = qa.real_launch(bise=bise or self.info["bise"], world=True)
        pid = run["pid"]
        watch = open(os.path.join(qa.REAL_APP_DIR, "watch.log")).read().splitlines()[-1:]
        self.R["launch"] = {"pid": pid, "watch": watch, "app_log_1": self.applog()[:1],
                            "web": subprocess.run(["git", "-C", qa.REPO, "log", "-1", "--format=%h"], capture_output=True, text=True).stdout.strip()}
        if not any("watching pid" in l for l in watch):
            raise qa.QAError("the watchdog didn't attach: stopped")
        time.sleep(2.5)
        self.events()
        try:
            self._flows(shop, agent, other, ids)
            ops = (qa.real_alive() or {}).get("ops") or []
            if "front" in ops:
                self._s9(ops)
            self.R["violations"] = qa.real_violations(pid)
        finally:
            self.R["front_end"] = qa._front()
            self.R["stop"] = qa.real_stop()
            self.R["app_log"] = [l for l in self.applog() if any(w in l for w in ("activation refused", "GUARD", "card", "window:", "error"))][-40:]
            self.save()
        return self.report()

    def _flows(self, shop, agent, other, ids):
        S, wait = self.step, self.wait
        rest = lambda: [qa.real_keys("esc") for _ in range(2)]  # noqa: E731

        def pearl():
            clicks = []
            for _ in range(2):      # the first click may close a menu the hello left open
                clicks.append(qa.real_op("status_click", button="left").get("menu"))
                time.sleep(0.6)
                if self.wait(lambda: qa.real_op("eval", window="bar", js="!!document.querySelector('[data-qa=\"open-bise\"]')").get("value") in (True, "true"), 3):
                    break
            self.R["pearl_menu"] = clicks
            return qa.real_click('[data-qa="open-bise"]', "bar")
        S(1, "pearl dropdown -> open bise", pearl,
          lambda: (self.st()["win"]["visible"] and self.st()["win"]["route"] == "bise", "window %s" % self.st()["win"]), settle=2.5)

        def cmd0():
            qa.real_win("close")
            time.sleep(0.6)
            qa.real_op("fn", kind="down"); qa.real_keys("space"); qa.real_op("fn", kind="up")
            time.sleep(0.6)
            return qa.real_keys("cmd+0", window="bar")
        S(2, "⌘0 from the bar opens the window", cmd0,
          lambda: (self.st()["win"]["visible"], "window %s" % self.st()["win"]), settle=2.5)

        def sidebar():
            # every project's row on bise; a project's agents show under it once it is open
            keys = [k for k, _ in self.qas()]
            missing = ["route:%s" % ids.get(h["project"], h["project"]) for h in self.W["hubs"] if not h["home"]]
            missing = [w for w in missing if w not in keys]
            rows = 0
            for h in self.W["hubs"]:
                if h["home"]:
                    continue
                pid = ids.get(h["project"], h["project"])
                qa.real_win("deeplink", route="project/%s" % pid)
                time.sleep(1.0)
                keys = [k for k, _ in self.qas()]
                for a in h["agents"]:
                    if a["name"] != "main":
                        rows += 1
                        if "route:%s/%s" % (pid, a["name"]) not in keys:
                            missing.append("route:%s/%s" % (pid, a["name"]))
            qa.real_win("deeplink", route="bise")
            return not missing, "missing %s" % missing if missing else "every project and its %d agents" % rows
        S(3, "the sidebar: every project + its agents", lambda: qa.real_win("deeplink", route="bise"), sidebar, settle=1.0)

        def say_in(route, words):
            def act():
                qa.real_win("deeplink", route=route)
                time.sleep(1.2)
                # a card in the dock makes the composer answer it ('answering … esc write a plain
                # message'): plain words to main need that esc first, as he would press it
                if "esc write a plain message" in self.text():
                    qa.real_keys("esc", window="win")
                    time.sleep(0.4)
                qa.real_op("type", window="win", text=words)
                time.sleep(0.2)
                return qa.real_keys("enter", window="win")
            return act
        import re

        def answered(words):
            # the fake main answers 'ack: <words>', bise wraps them ('ack: <user_message …> words …')
            return bool(re.search(r"ack: (<user_message[^>]*> )?%s" % re.escape(words), self.text()))
        w4 = "what is on today"
        S(4, "words in bise's thread, bise answers", say_in("bise", w4),
          lambda: (bool(wait(lambda: answered(w4))), "bise's answer %s in the thread" % ("seen" if answered(w4) else "NOT seen")),
          settle=1.0)
        w5 = "how is the cart going"
        S(5, "words in %s's main, it answers" % shop, say_in("project/%s" % ids.get(shop, shop), w5),
          lambda: (bool(wait(lambda: answered(w5))), "main's answer %s" % ("seen" if answered(w5) else "NOT seen")),
          settle=1.0)
        S(6, "an agent's thread (%s)" % agent, lambda: self.click("route:%s/%s" % (ids.get(shop, shop), agent)),
          lambda: (agent in (self.st()["win"]["title"] or ""), "title %r" % self.st()["win"]["title"]), settle=2.0)

        def card_text():
            world.say(other, "[[bash: sb card $'which day for the review?\\n1. monday\\n2. friday']]")
            before = wait(lambda: [c for c in self.cards(other) if "which day" in (c.get("text") or c.get("question") or "")], 30)
            self.R["q_card"] = before
            qa.real_win("deeplink", route="project/%s" % ids.get(other, other))
            time.sleep(1.5)
            qa.real_op("type", window="win", text="friday works, after lunch")
            time.sleep(0.2)
            return qa.real_keys("enter", window="win")
        S(7, "a question card answered by text (%s)" % other, card_text,
          lambda: (bool(wait(lambda: not [c for c in self.cards(other) if "which day" in (c.get("text") or c.get("question") or "")], 20)),
                   "the card %s in the hub" % ("left" if not [c for c in self.cards(other) if "which day" in (c.get("text") or "")] else "is STILL open")),
          settle=1.0)

        feat = "t1-%d" % (int(time.time()) % 100000)
        shop_ws = [h for h in self.W["hubs"] if h["project"] == shop][0]["ws"]

        def approval():
            f = world.feature(shop, feat)
            self.R["approval"] = f
            qa.real_win("deeplink", route="project/%s" % ids.get(shop, shop))
            time.sleep(1.5)
            # '1' with the composer empty decides the approval (lead m_8868); if it doesn't, the
            # run says so and clicks opt:1, so the merge and the review are still reached
            keyed = []
            for kind in ("feature_try", "feature_merge"):
                if kind == "feature_merge":
                    self.R["approval_merge_card"] = wait(lambda: [c for c in self.cards(shop) if c.get("kind") == kind], 60)
                    time.sleep(1.0)
                qa.real_keys("1", window="win")
                if wait(lambda: not [c for c in self.cards(shop) if c.get("kind") == kind], 6):
                    keyed.append("%s: 1 decided" % kind)
                else:
                    keyed.append("%s: 1 did NOTHING, clicked opt:1" % kind)
                    qa.real_keys("delete", window="win")     # the '1' may have gone into the composer
                    time.sleep(0.5)
                    opt = self.wait(lambda: self.find(lambda k, t: k == "opt:1"), 5)
                    if not opt:
                        self.R["approval_qa"] = self.qas()
                    self.click(opt)
            self.R["approval_keys"] = keyed
            return keyed

        def main_log():
            return subprocess.run(["git", "-C", shop_ws, "log", "-5", "--format=%H %s", "main"], capture_output=True, text=True).stdout

        def approval_ok():
            fid = self.R["approval"]["card"]["id"]
            try_gone = not [c for c in self.cards(shop) if c.get("id") == fid]
            merge = self.R.get("approval_merge_card")
            merged = wait(lambda: [l.split()[0] for l in main_log().splitlines() if feat in l], 30)
            self.R["merged_sha"] = merged[0] if merged else None
            keys_ok = all("decided" in k for k in self.R.get("approval_keys", []))
            return keys_ok and try_gone and bool(merge) and bool(merged), "%s; try card %s; merge card %s; merge: %s" % (
                "; ".join(self.R.get("approval_keys", [])), "answered" if try_gone else "STILL open", "came" if merge else "NEVER came",
                "on main %s" % merged[0][:7] if merged else "NOT on main")
        S(8, "an approval by 1, then the merge by 1 (%s)" % shop, approval, approval_ok, settle=1.5)

        def review():
            qa.real_win("deeplink", route="project/%s" % ids.get(shop, shop))
            time.sleep(1.2)
            self.click("tab:changes")
            time.sleep(1.5)
            sha = self.R.get("merged_sha") or ""
            row = self.find(lambda k, t: k.startswith("route:commit/") and sha[:7] and sha[:7] in (k + t)) \
                or self.find(lambda k, t: k.startswith("route:commit/"))
            self.R["review_row"] = row
            self.R["changes_text"] = self.text()[:900]
            return self.click(row)

        def review_ok():
            sha = (self.R.get("merged_sha") or "")[:7]
            route = self.st()["win"]["route"] or ""
            t = self.text()
            return (route.startswith("commit/") and sha in route and "merged · %s" % sha in t,
                    "'merged today' row %s; route %r; 'merged · %s' %s" % (self.R.get("review_row"), route, sha, "seen" if "merged · %s" % sha in t else "NOT seen"))
        S(9, "the review: changes -> merged today -> the commit", review, review_ok, settle=2.0)

        def voice():
            rest()
            qa.real_op("voice", words="what needs me today")
            return qa.real_op("fn", kind="hold", ms=1500)
        S(10, "fn held, fake voice: the words reach bise", voice,
          lambda: (bool(wait(lambda: "what needs me today" in self.transcript(world.HOME_NAME), 20)),
                   "bise's main %s the words" % ("got" if "what needs me today" in self.transcript(world.HOME_NAME) else "did NOT get")),
          window="bar", settle=1.0)

        def typed():
            rest()
            qa.real_op("fn", kind="down"); qa.real_keys("space"); qa.real_op("fn", kind="up")
            time.sleep(0.6)
            qa.real_op("type", window="bar", text="remind me at five")
            time.sleep(0.2)
            return qa.real_keys("enter", window="bar")
        S(11, "fn space, typed, ⏎: the words reach bise", typed,
          lambda: (bool(wait(lambda: "remind me at five" in self.transcript(world.HOME_NAME), 20)),
                   "bise's main %s the words" % ("got" if "remind me at five" in self.transcript(world.HOME_NAME) else "did NOT get")),
          window="bar", settle=1.0)

        def spot():
            rest()
            qa.real_win("close")
            time.sleep(0.5)
            qa.real_op("fn", kind="down"); qa.real_keys("space"); qa.real_op("fn", kind="up")
            time.sleep(0.6)
            qa.real_op("type", window="bar", text=agent)
            time.sleep(0.6)
            return qa.real_keys("enter", window="bar")
        S(12, "⏎ in the spotlight on %r opens its thread" % agent, spot,
          lambda: (bool(wait(lambda: self.st()["win"]["visible"] and agent in (self.st()["win"]["route"] or ""), 10)),
                   "window %s" % self.st()["win"]), settle=1.5)

        trees = [a["branch"] for h in self.W["hubs"] for a in h["agents"] if a.get("mode") == "worktree" and a.get("branch")]

        def env_ok():
            t = self.text()
            missing = [b for b in trees if b not in t]
            return not missing and "worktree" in t, "worktrees %s; missing %s" % (len(trees) - len(missing), missing) if missing \
                else "every agent worktree listed (%s)" % ", ".join(trees)
        S(13, "the environments screen: the real worktrees", lambda: qa.real_win("deeplink", route="environments"), env_ok, settle=2.0)

        def c2b():
            qa.real_win("deeplink", route="bise")
            time.sleep(1.0)
            world.say(other, "[[bash: sb card $'ship the release notes now?\\n1. yes\\n2. later']]")
            self.R["c2b_held"] = wait(lambda: [l for l in self.applog() if "stays in the window" in l], 20)
            time.sleep(0.5)
            return qa.real_win("close")
        S(14, "a card held by the window comes to the bar on close", c2b,
          lambda: (bool(self.R.get("c2b_held")) and self.st()["bar"]["visible"] and any("comes to the bar" in l for l in self.applog()),
                   "held %s, bar visible %s, 'comes to the bar' %s" % (bool(self.R.get("c2b_held")), self.st()["bar"]["visible"],
                                                                        any("comes to the bar" in l for l in self.applog()))),
          window="bar", settle=2.0)

        # a project whose folder is gone: its hub stopped, its folder moved away (restored after)
        gone = [h for h in self.info["hubs"] if not h["home"] and h["project"] not in (shop, other)]
        if not gone:
            return
        g = gone[0]
        lock_js = ("(() => { const f = document.querySelector('.w-composer textarea, .w-composer input'); "
                   "return JSON.stringify({ro: !!(f && f.readOnly), text: document.body.innerText.replace(/\\s+/g,' ') + ' ' + ((f && f.placeholder) || '')}); })()")

        def folder_gone():
            rest()
            qa.real_win("open")
            import e2e
            e2e.Client(g["sock"]).send({"op": "stop_hub"})
            wait(lambda: not world._alive(g["hub_pid"]), 30)
            world.guard(self.info["world"], [g["ws"], g["ws"] + ".gone"])
            os.rename(g["ws"], g["ws"] + ".gone")
            self.R["gone"] = g["ws"]
            qa.real_win("deeplink", route="project/%s" % ids.get(g["project"], g["project"]))
            time.sleep(2.0)
            qa.real_op("type", window="win", text="fix the guide")
            time.sleep(0.2)
            return qa.real_keys("enter", window="win")

        def gone_ok():
            v = json.loads(qa.real_op("eval", window="win", js=lock_js).get("value") or "{}")
            sent = [e for s in self.R["steps"][-1:] for e in s.get("events", []) if isinstance(e[1], dict) and e[1].get("cmd") == "send"]
            sent += [e for e in self.events() if isinstance(e[1], dict) and e[1].get("cmd") == "send"]
            line = "folder is gone · find it or remove the project" in v.get("text", "")
            sbd = [l for l in subprocess.run(["ps", "-axww", "-o", "pid=,args="], capture_output=True, text=True).stdout.splitlines()
                   if "sbd" in l and g["ws"] in l]
            self.R["gone_sbd"] = sbd
            return v.get("ro") and line and not sent and not sbd, "composer read-only %s, line %s, sent %d, hub started %s" % (
                v.get("ro"), "shown" if line else "NOT shown", len(sent), bool(sbd))
        try:
            S(15, "%s's folder gone: composer locked, nothing sent, no hub" % g["project"], folder_gone, gone_ok, settle=2.0)
        finally:
            if os.path.isdir(g["ws"] + ".gone") and not os.path.exists(g["ws"]):
                os.rename(g["ws"] + ".gone", g["ws"])

    # ---- S9 on fixtures (amb-mac's harness ops front, drop, away; ambient-lead m_9117)
    def _s9(self, ops):
        S, wait = self.step, self.wait
        rest = lambda: [qa.real_keys("esc") for _ in range(2)]  # noqa: E731

        def spot():
            qa.real_op("fn", kind="down"); qa.real_keys("space"); qa.real_op("fn", kind="up")
            time.sleep(0.8)

        # the flows above leave cards open (the bar would show them over the S9 panes): withdrawn
        for h in self.W["hubs"]:
            for c in self.cards(h["project"]):
                world.say(h["project"], '[[bash: sb card --withdraw %s "cleared before S9"]]' % c["id"])
        wait(lambda: not any(self.cards(h["project"]) for h in self.W["hubs"]), 30)

        def ctx_sent():
            return [e[1] for e in self.events() if isinstance(e[1], dict) and e[1].get("cmd") == "fn_context"]

        def front():
            rest()
            qa.real_win("close")
            self.events()
            r = qa.real_op("front", app="Google Chrome", bundle="com.google.Chrome", title="Pricing · Acme",
                           url="https://acme.test/pricing", tab_url="https://acme.test/pricing", selection="Team plan, 12 € a seat")
            self.R["front_reply"] = r
            spot()
            self.R["front_ctx"] = ctx_sent()
            return r

        def front_ok():
            t = self.text("bar")
            ctx = self.R.get("front_ctx") or []
            got = any("acme.test" in json.dumps(c) for c in ctx)
            row = "in front" in t and ("Acme" in t or "acme.test" in t)
            return row and got, "spotlight row %s; fn_context to the core %s (%d sent)" % (
                "'in front: …' shown" if row else "NOT shown", "with the URL" if got else "WITHOUT the URL", len(ctx))
        S(16, "fn space with a browser in front: 'in front' row + fn_context", front, front_ok, window="bar", settle=1.0)

        def excluded():
            rest()
            self.events()
            r = qa.real_op("front", app="1Password", bundle="com.1password.1password", title="Vault · bank", selection="secret")
            self.R["excluded_reply"] = r
            spot()
            self.R["excluded_ctx"] = ctx_sent()
            return r

        def excluded_ok():
            t = self.text("bar")
            r = self.R.get("excluded_reply") or {}
            leak = any(("bank" in json.dumps(c) or "1Password" in json.dumps(c) or "secret" in json.dumps(c)) for c in self.R.get("excluded_ctx") or [])
            return (not r.get("context")) and not (r.get("front") or {}).get("app") and "in front" not in t and not leak, \
                "reply context %r front %r; row %s; leaked to the core %s" % (r.get("context"), r.get("front"),
                                                                             "shown" if "in front" in t else "none", leak)
        S(17, "an excluded app in front (1Password): nothing read", excluded, excluded_ok, window="bar", settle=1.0)
        qa.real_op("front", clear=True)

        f = os.path.join(self.info["world"], "fixtures", "q3-notes.md")
        os.makedirs(os.path.dirname(f), exist_ok=True)
        with open(f, "w") as fh:
            fh.write("# q3 notes\n\n- churn down 2 points\n- the pricing page ships friday\n")

        def drop():
            rest()
            r = qa.real_op("drop", paths=[f])
            time.sleep(1.0)
            self.R["drop_bar"] = self.text("bar")
            qa.real_op("type", window="bar", text="what stands out here")
            time.sleep(0.3)
            qa.real_keys("enter", window="bar")
            return r
        S(18, "a file dropped on the pearl -> the spotlight -> sent to bise", drop,
          lambda: (bool(wait(lambda: "q3-notes.md" in self.transcript(world.HOME_NAME), 20)) and "q3-notes.md" in (self.R.get("drop_bar") or ""),
                   "spotlight %s the file; bise's main %s it" % ("names" if "q3-notes.md" in (self.R.get("drop_bar") or "") else "does NOT name",
                                                                 "got" if "q3-notes.md" in self.transcript(world.HOME_NAME) else "did NOT get")),
          window="bar", settle=1.5)

        def away():
            rest()
            time.sleep(0.5)
            return qa.real_op("away", away_ms=45 * 60 * 1000)
        S(19, "back after 45 min away: the away card first", away,
          lambda: (bool(wait(lambda: self.st()["bar"]["visible"] and "while you were away" in self.text("bar"), 15)),
                   "bar %s; 'while you were away' %s" % (self.st()["bar"]["visible"], "shown" if "while you were away" in self.text("bar") else "NOT shown")),
          window="bar", settle=1.5)

        def empty_spot():
            rest()
            time.sleep(0.5)
            spot()
            return None
        names = [h["project"] for h in self.W["hubs"] if not h["home"]]
        S(20, "the empty spotlight's sections, several projects", empty_spot,
          lambda: (self.st()["bar"]["visible"] and sum(n in self.text("bar") for n in names) >= 2,
                   "projects named: %s" % [n for n in names if n in self.text("bar")]), window="bar", settle=1.0)
        if "quiet" not in ops:
            return
        others = names[:2]

        def quiet():
            rest()
            qa.real_win("close")
            time.sleep(0.5)
            on = qa.real_op("quiet", why="call")
            time.sleep(0.8)
            for i, p in enumerate(others):
                world.say(p, "[[bash: sb card $'quiet check %d: go ahead?\\n1. yes\\n2. no']]" % i)
            wait(lambda: all(any("quiet check %d" % i in (c.get("text") or "") for c in self.cards(p)) for i, p in enumerate(others)), 30)
            time.sleep(2.0)
            s = qa.real_op("state")
            self.R["quiet_during"] = {"bar": (s.get("bar") or {}).get("visible"), "icon": s.get("icon"), "on": on,
                                      "bar_shot": qa.real_op("shot", what="bar").get("png")}
            return qa.real_op("quiet", why="")

        def quiet_ok():
            d = self.R.get("quiet_during") or {}
            t = wait(lambda: self.st()["bar"]["visible"] and "question" in self.text("bar") and self.text("bar"), 15) or self.text("bar")
            batch = "questions · about" in t or "question · about" in t
            return (d.get("bar") is False) and batch, "during the call: bar %s, pearl %s; after: %s" % (
                "hidden" if d.get("bar") is False else "SHOWN", json.dumps(d.get("icon"))[:80], "one batch '%s'" % t[:60] if batch else "NO batch (%s)" % t[:80])
        S(21, "quiet (a call): cards wait, the pearl counts, then one batch", quiet, quiet_ok, window="bar", settle=1.5)

    # ---- the one-screen report
    def report(self):
        R = self.R
        lines = ["t1 first-try  %s  web %s  app pid %s" % (R["started"], R.get("launch", {}).get("web"), R.get("launch", {}).get("pid")),
                 "proof: front %s -> %s, violations %s, stop %s" % ((R.get("front_start") or {}).get("name"), (R.get("front_end") or {}).get("name"),
                                                                      R.get("violations"), R.get("stop")), ""]
        for s in R["steps"]:
            lines.append("%-4s %2d %-52s %5.1fs  %s" % (s["verdict"].upper(), s["n"], s["name"][:52], s["s"], s["why"][:110]))
        passed = sum(1 for s in R["steps"] if s["verdict"] == "pass")
        lines += ["", "%d/%d pass; shots and events in %s" % (passed, len(R["steps"]), os.path.join(self.out, "t1.json"))]
        txt = "\n".join(lines) + "\n"
        with open(os.path.join(self.out, "report.txt"), "w") as f:
            f.write(txt)
        R["report"] = txt
        self.save()
        return txt


def run(out=None, bise=None):
    out = out or os.path.join(world.world_dir(), "t1-%s" % time.strftime("%Y%m%d-%H%M%S"))
    return Run(out).run(bise)
