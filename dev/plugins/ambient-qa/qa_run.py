"""ambient-qa: a run end to end: the core child, ask, the run report, run().
Moved out of qa.py as is (the 1,000-line cap, architect S1); qa.py re-exports every name."""

import json
import os
import shutil
import signal
import subprocess
import threading
import time

from qa_core import (  # noqa: E402
    HUB, OUT, QAError, QA_DIR, RUN, _http, _hub,
    _pid_alive, _port, _read, _start_hub, _stop_hub, _wait, find_bise,
    launch_truth, raise_file_limit, require_commits, tick, tree_info)
from qa_pages import (  # noqa: E402
    page_meta, page_notes)
from qa_flows import (  # noqa: E402
    SCENARIOS, SENDS, _agent_settled)
from qa_checks import (  # noqa: E402
    FLOWS, SEEDS, _card_about, _covered, team_asks)


RUN_NOTES = ["make this shorter, two sentences max", "drop this part", "where does this number come from? add the source"]


class _Core:
    """The ask goes through a core like the desktop app's: a `bise ambient-core` child on stdio,
    sent text only (no talk_start: no mic; a text send is never spoken: no speaker)."""

    def __init__(self, bise, root, info, log_dir):
        self.evs, self.lock, self.seen = [], threading.Lock(), 0
        env = {k: v for k, v in os.environ.items() if not k.startswith("SB_") and k not in ("BISE_ROLE", "BISE_EXPORTS_FOR")}
        env.update(info.get("env") or {})
        env["BISE_APP_ROOT"] = root
        if os.path.exists(os.path.join(root, "sb-core")):
            env["SB_CORE_BIN"] = os.path.join(root, "sb-core")
        self.p = subprocess.Popen([bise, "ambient-core", "--workspace", info["ws"]], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=open(os.path.join(log_dir, "core.err"), "a"), text=True, cwd=root, env=env)
        threading.Thread(target=self._read, daemon=True).start()
        self.start = self.seen

    def _read(self):
        for line in self.p.stdout:
            try:
                v = json.loads(line)
            except ValueError:
                continue
            with self.lock:
                self.evs.append(v)

    def send(self, text):
        cmd = {"cmd": "send", "text": text}
        self.p.stdin.write(json.dumps(cmd) + "\n")
        self.p.stdin.flush()

    def new(self):
        """The core's events since the last call."""
        with self.lock:
            out, self.seen = self.evs[self.seen:], len(self.evs)
        return out

    def close(self):
        try:
            self.p.stdin.close()
            self.p.wait(5)
        except (OSError, subprocess.TimeoutExpired):
            self.p.terminate()


def ask(texts, capsule=True, timeout=600, out=None):
    """Asks to main on the running throwaway hub (qa.py launch), one after the other (ambient-pm
    m_5573): through a headless core like the desktop app's (`capsule`, so main reads the
    capsule's hint), else as the TUI does. For each: main's final words to the capsule, their
    length, the time until everyone is idle again, the pages it made or
    updated, the cards. Writes asks-<time>.json in the QA out dir."""
    if isinstance(texts, str):
        texts = [texts]
    info = _read(HUB)
    if not info or not _pid_alive(info.get("pid")):
        raise QAError("no throwaway hub: qa.py launch --hub model first")
    c, _ = _hub()
    _wait(lambda: c.state, 30, "the hub's state")
    root = (_read(RUN) or {}).get("app_root") or find_bise(info.get("bise"))[1]
    d = out or os.path.join(OUT, "asks")
    os.makedirs(d, exist_ok=True)
    core = _Core(info["bise"], root, info, d) if capsule else None
    results = []
    try:
        if core:
            _wait(lambda: any(e.get("ev") == "hub" and e.get("up") for e in core.evs), 60, "the core on the hub")
        for text in texts:
            c.wait_idle("main", timeout=timeout)
            pages0 = {p["id"]: p.get("version", 0) for p in (c.state or {}).get("pages", [])}
            cards0 = {cd.get("id") for cd in c.cards()}
            n0 = len(c.lines("main"))
            if core:
                core.new()
                core.send(text)
            else:
                c.say(text)
            t0, words, busy, quiet = time.time(), [], False, None
            while time.time() - t0 < timeout:
                if core:
                    words += [e["text"] for e in core.new() if e.get("ev") == "main" and e.get("text")]
                agents = (c.state or {}).get("agents", [])
                idle = all(a.get("status") in ("idle", "done", "blocked") for a in agents)
                busy = busy or not idle or bool(words) or len(c.lines("main")) > n0
                quiet = (quiet or time.time()) if idle and (busy or time.time() - t0 > 20) else None
                if quiet and time.time() - quiet > 3:
                    break
                time.sleep(0.5)
            if core:
                words += [e["text"] for e in core.new() if e.get("ev") == "main" and e.get("text")]
            else:
                words = [l for l in c.lines("main")[n0:] if l.strip()][-3:]
            pages = [{"id": p["id"], "version": p.get("version"), "url": p.get("url"), "new": p["id"] not in pages0}
                     for p in (c.state or {}).get("pages", []) if p.get("version", 0) > pages0.get(p["id"], -1)]
            last = words[-1] if words else ""
            results.append({"ask": text, "secs": round(time.time() - t0, 1), "main": last, "len": len(last), "lines": words,
                            "pages": pages, "cards": [cd for cd in c.cards() if cd.get("id") not in cards0],
                            "timed_out": time.time() - t0 >= timeout})
    finally:
        if core:
            core.close()
    path = os.path.join(d, "asks-%s.json" % time.strftime("%Y%m%d-%H%M%S"))
    with open(path, "w") as f:
        json.dump({"capsule": capsule, "hub": info.get("kind"), "load": round(os.getloadavg()[0], 1), "asks": results}, f, indent=1, ensure_ascii=False)
    lines = []
    for x in results:
        pg = ", ".join("%s v%s%s" % (p["id"], p["version"], " (new)" if p["new"] else "") for p in x["pages"]) or "no page"
        lines.append("%-34s %6.1f s  %3d chars  %s%s%s\n    %s" % ('"%s"' % x["ask"][:32], x["secs"], x["len"], pg, ", %d card(s)" % len(x["cards"]) if x["cards"] else "",
                                                             " TIMEOUT" if x["timed_out"] else "", x["main"][:200] or "(no words to the capsule)"))
    return {"file": path, "asks": results, "report": "\n".join(lines)}


def keep_hub_state(state, dst):
    """A copy of a QA hub's state dir for the record: journal.jsonl, hub.log,
    pages' meta and every agent's transcript, wire log, role and repl log;
    no sockets, binaries or temp dirs. Returns dst."""
    keep = ("journal.jsonl", "hub.log", "transcript.log", "wire.log", "role.md", "repl.log", "meta.json", "notes.json")
    for dirpath, dirs, files in os.walk(state):
        dirs[:] = [x for x in dirs if x not in ("bin", "run", "tmp")]
        for n in files:
            if n in keep or n.endswith(".jsonl"):
                src = os.path.join(dirpath, n)
                out = os.path.join(dst, os.path.relpath(src, state))
                os.makedirs(os.path.dirname(out), exist_ok=True)
                shutil.copy2(src, out)
    return dst


def run_report(r):
    """One screen of text from a run's JSON."""
    s = lambda v: "-" if v is None else "%.1f s" % v
    L = ["%s  (%s, model hub, fake accounts)  %s" % (r["scenario"], "headless" if r["headless"] else "app", r["at"]),
         "ask: %s" % r["ask"]]
    tr = r.get("tree") or {}
    if tr:
        L.append("build: %s%s%s" % (tr.get("head", "")[:60], ", %s behind ambient-app (STALE: a fail may be the build)" % tr["behind_ambient_app"] if tr.get("behind_ambient_app") else ", at ambient-app's tip",
                                   ", has %s" % ",".join(tr["required"]) if tr.get("required") else ""))
    hp = r.get("helpers") or {}
    if hp:
        L.append("helpers: rebuilt by bins.sh from %s's sources (%s)" % (hp.get("from", "?"), ", ".join("%s %s" % kv for kv in sorted(hp.get("keys", {}).items()))))
    if r.get("load"):
        L.append("machine load %s at start, %s at end%s" % (r["load"].get("start"), r["load"].get("end", "-"),
                                                           " (loaded: times are an upper bound)" if max(r["load"].values()) > 30 else ""))
    m = r["main_lines"]
    if m:
        L.append("main's line: %d chars at %s: %s" % (m[0]["len"], s(m[0]["at"]), m[0]["text"][:160]))
        if len(m) > 1:
            L.append("  then %d more lines, longest %d chars" % (len(m) - 1, max(x["len"] for x in m[1:])))
    else:
        L.append("main's line: none reached the core")
    p = r.get("page")
    if p:
        L.append("page %s: first seen %s, v1 %s, %d blocks: %s" % (p["id"], s(r["t"].get("page_first")), s(r["t"].get("v1")), len(p["blocks"]),
                                                                    " ".join(b["kit"] for b in p["blocks"])[:120]))
        cov = r.get("coverage") or {}
        if cov:
            L.append("needs an answer in v1: %d of %d%s" % (cov["v1"]["found"], cov["v1"]["of"], " (missing: %s)" % ", ".join(cov["v1"]["missing"]) if cov["v1"]["missing"] else ""))
            for k in sorted(x for x in cov if x.startswith("tick")):
                n = k[4:]
                L.append("tick %s at %s: republished as v%s %s after, its new ones: %d of %d" % (
                    n, s(r["t"].get("tick" + n)), r["t"].get("v2_n"), s(r["t"].get("republish%s_after_tick" % n)), cov[k]["found"], cov[k]["of"]))
        if r.get("notes"):
            L.append("notes sent at %s; v%s %s after send" % (s(r["t"].get("send")), r["t"].get("v2_n") or "2", s(r["t"].get("v2_after_send"))))
            for n in r["notes"]:
                L.append("  %-10s %-9s %s -> %s" % (n.get("block"), n.get("status"), n.get("text", "")[:40], (n.get("answer") or "")[:60]))
    elif (r.get("flow") or {}).get("meetings"):
        for e, m in sorted(r["flow"]["meetings"].items()):
            L.append("%s %s: brief %s%s" % (e, m.get("id", "-"), "%+d s from its start" % m["v1_at"] if "v1_at" in m else "none",
                                            ", follow-ups %+d s after its end" % m["v2_at"] if "v2_at" in m else ""))
    else:
        L.append("page: none in %s" % s(r["t"].get("end")))
    ob = r["outbox"]
    L.append("outbox: %d writes (%s), %d sends" % (len(ob["writes"]), ", ".join(sorted({w["service"] + "." + w["action"] for w in ob["writes"]})) or "none",
                                                   len(ob["sends"])))
    if r["cards"]:
        L.append("cards: " + "; ".join("#%s %s" % (c.get("id"), (c.get("text") or "")[:60]) for c in r["cards"]))
    L.append("verdict: " + ("pass" if not r["fails"] else "FAIL: " + "; ".join(r["fails"])))
    if r.get("capsule"):
        L.append("capsule (spoken ask, s from fn held):")
        for k in r["capsule"][:14]:
            L.append("  %6s  %s" % (k.get("at", ""), k.get("what") or k.get("error")))
    if r.get("hub_state"):
        L.append("hub state kept: %s" % r["hub_state"])
    L.append("files: %s" % r["dir"])
    return "\n".join(L)


def run(scenario, timeout=900, keep=False, out=None, require=None):
    """A scripted product run (ambient-lead m_5306): a model hub (the user's
    model and keys, throwaway state) with the fake accounts only; the
    scenario's ask through the core like the capsule's; times the page's
    first appearance (sb page start), v1, then 3 scripted notes over the
    page API, send, v2 and the notes' outcomes; the outbox (no send for a
    'don't send' ask); main's capsule line length. Writes run.json and
    report.txt in its folder; stops what it started unless `keep`."""
    if scenario not in SCENARIOS:
        raise QAError("scenario: %s" % ", ".join(SCENARIOS))
    sc = SCENARIOS[scenario]
    raise_file_limit()   # a launchd shell's 256 files ran out mid-run (ambient-pm m_5837)
    # one run at a time per QA dir: two runs shared one throwaway hub (ambient-pm m_5841)
    lock = os.path.join(QA_DIR, "run.lock")
    held = _read(lock)
    if held and held.get("pid") != os.getpid() and _pid_alive(held.get("pid")):
        raise QAError("a run is live in %s (%s, pid %s, since %s): one at a time, or another AMBIENT_QA_DIR"
                      % (QA_DIR, held.get("scenario"), held.get("pid"), held.get("at")))
    os.makedirs(QA_DIR, exist_ok=True)
    with open(lock, "w") as f:
        json.dump({"pid": os.getpid(), "scenario": scenario, "at": time.strftime("%H:%M:%S")}, f)
    # a TERM (kill <pid>) stops the run the way ^C does: the finally clauses stop its hub. before,
    # a TERM ended the process on the spot and left its throwaway hub running (05:58, amb-tools-m)
    signal.signal(signal.SIGTERM, _term_to_interrupt)
    try:
        return _run(scenario, sc, timeout, keep, out, require)
    finally:
        if (_read(lock) or {}).get("pid") == os.getpid():
            os.unlink(lock)


def _term_to_interrupt(*_):
    raise KeyboardInterrupt("SIGTERM")


def _run(scenario, sc, timeout, keep, out, require):
    if "tick_min" in sc:
        # the fake clock's batches only on qa.py tick (0), never on their own mid-run
        os.environ["AMBIENT_QA_TICK_MIN"] = str(sc["tick_min"])
    headless = True     # a bise ambient-core child: the Swift app (the old --app/--voice runs) is gone
    bise, root = find_bise()
    build = require_commits(root, require)
    seeded = None
    if sc.get("seed"):
        # the night on a scripted hub (no credits), kept; then the model hub on its state
        s_info = _start_hub(bise, root, "fake", keep=True, sets=sc.get("set", ""))
        try:
            seeded = SEEDS[sc["seed"]](s_info)
        finally:
            _stop_hub()
        info = _start_hub(bise, root, "model", reuse=s_info["tmp"], sets=sc.get("set", ""))
    else:
        info = _start_hub(bise, root, "model", sets=sc.get("set", ""))
    d = out or os.path.join(OUT, "runs", "%s-%s" % (scenario, time.strftime("%Y%m%d-%H%M%S")))
    os.makedirs(d, exist_ok=True)
    r = {"scenario": scenario, "ask": sc["ask"], "headless": headless, "at": time.strftime("%Y-%m-%d %H:%M"), "dir": d, "tree": dict(tree_info(root), required=build["required"]),
         "t": {}, "main_lines": [], "cards": [], "page": None, "notes": [], "fails": [], "load": {"start": round(os.getloadavg()[0], 1)},
         "seeded": seeded, "helpers": _read(os.path.join(QA_DIR, "helpers.json"))}
    c, _ = _hub()
    core = None
    try:
        _wait(lambda: c.state, 30, "the hub's state")
        c.wait_idle("main", timeout=300)
        core = _Core(bise, root, info, d)
        _wait(lambda: any(e.get("ev") == "hub" and e.get("up") for e in core.evs), 60, "the core on the hub")
        before = {p["id"] for p in c.state.get("pages", [])}
        t0 = time.time()
        rel = lambda: round(time.time() - t0, 1)
        cards = {}

        def poll():
            for e in core.new():
                if e.get("ev") == "main" and e.get("text"):
                    r["main_lines"].append({"at": rel(), "text": e["text"], "len": len(e["text"])})
            for cd in c.cards():
                # the latest view of each card, kept fields it no longer shows (its page link once
                # closed: ambient-pm m_5904), first seen time
                old = cards.get(cd.get("id")) or {}
                cards[cd.get("id")] = dict(old, **{k: v for k, v in cd.items() if v is not None}, at=old.get("at", rel()))
            pages = [p for p in (c.state or {}).get("pages", []) if p["id"] not in before]
            return pages[0] if pages else None

        def settled():
            return all(_agent_settled(a) for a in (c.state or {}).get("agents", []))

        core.send(sc["ask"])
        page, quiet = None, None
        if sc.get("timed"):
            # pages that come later, on the hub's timers (the meetings): the flow waits for them itself
            FLOWS[sc["flow"]](dict(r=r, c=c, page=None, body="", d=d, poll=poll, settled=settled, rel=rel, timeout=timeout,
                                   info=info, core=core, cards=cards, before=before))
        while not sc.get("timed") and time.time() - t0 < timeout:
            page = poll()
            if page and "page_first" not in r["t"]:
                r["t"]["page_first"] = rel()
            if page and page.get("version", 0) >= 1 and "v1" not in r["t"]:
                r["t"]["v1"] = rel()
            # done: v1 out and everyone idle for 3 s; no page: everyone idle for 60 s
            quiet = (quiet or time.time()) if settled() and rel() > 5 else None
            if quiet and time.time() - quiet > (3 if "v1" in r["t"] else 60):
                break
            time.sleep(0.5)
        r["t"]["end"] = rel()
        if sc.get("timed"):
            pass
        elif not page or "v1" not in r["t"]:
            r["fails"].append("no page v1 in %.0f s" % r["t"]["end"])
        else:
            meta = page_meta(page["id"])
            last = meta["versions"][-1]
            r["page"] = {"id": page["id"], "url": page.get("url"), "title": page.get("title"), "v1_n": last["n"],
                         "blocks": [{"id": b["id"], "kit": b["kit"]} for b in last.get("blocks", [])]}
            port = _port(info["state"])
            st, body = _http(port, "GET", "/p/%s/v/%d/body" % (page["id"], last["n"]))
            open(os.path.join(d, "v%d.body.html" % last["n"]), "w").write(body)
            if sc.get("flow") in FLOWS:
                # roadmap A, C, D: what the user does after v1, and what must follow
                FLOWS[sc["flow"]](dict(r=r, c=c, page=page, port=port, last=last, body=body, d=d, poll=poll, settled=settled, rel=rel,
                                       timeout=timeout, info=info, core=core, cards=cards, pick=sc.get("pick"), picks=sc.get("picks"), note_texts=sc.get("note_texts")))
            elif not sc.get("notes", True):
                # launch watch (roadmap B): v1 holds batch 0's needs-an-answer items;
                # after a tick the page republishes with the new batch's
                truth0 = launch_truth(1)
                r["coverage"] = {"v1": _covered(body, [c for c in launch_truth(1)["new"] if c["needs_answer"]])}
                for k in range(int(sc.get("ticks", 1))):
                    tick()
                    r["t"]["tick%d" % (k + 1)] = rel()
                    t_tick = time.time()
                    want = launch_truth(k + 2)["new_needs_answer"]
                    nv, found = last["n"], None
                    while time.time() - t_tick < timeout:
                        poll()
                        m = page_meta(page["id"])
                        n = m["versions"][-1]["n"]
                        if n > nv:
                            st, b2 = _http(port, "GET", "/p/%s/v/%d/body" % (page["id"], n))
                            if _covered(b2, want)["found"] and settled():
                                found = (n, b2)
                                break
                        time.sleep(3)
                    if found:
                        r["t"]["republish%d_after_tick" % (k + 1)] = round(time.time() - t_tick, 1)
                        r["t"]["v2_n"] = found[0]
                        open(os.path.join(d, "v%d.body.html" % found[0]), "w").write(found[1])
                        r["coverage"]["tick%d" % (k + 1)] = _covered(found[1], want)
                        last = {"n": found[0]}
                    else:
                        r["fails"].append("no republish with tick %d's new comments in %d s" % (k + 1, timeout))
                        break
                r["truth"] = {"needs_answer_v1": truth0["needs_answer"], "batches": int(sc.get("ticks", 1)) + 1}
                blocks = []
            else:
                blocks = last.get("blocks", [])
        if page and "v1" in r["t"] and sc.get("notes", True):
            blocks = last.get("blocks", [])
            prose = [b for b in blocks if b["kit"] in ("prose", "callout", "table", "heading")]
            picks = (prose + [b for b in blocks if b not in prose])[:3]
            notes = [{"block": b["id"], "kind": "note", "text": t} for b, t in zip(picks, RUN_NOTES)]
            r["t"]["send"] = rel()
            sent = page_notes(page["id"], notes, send=True)
            ids = [n["id"] for n in sent["saved"]]
            t_send = time.time()
            v2 = None
            while time.time() - t_send < timeout:
                poll()
                m = page_meta(page["id"])
                mine = [n for n in m.get("notes", []) if n["id"] in ids]
                if m["versions"][-1]["n"] > last["n"] and mine and all(n["status"] not in ("draft", "sent", "open") for n in mine) and settled():
                    v2 = m
                    break
                time.sleep(2)
            if v2:
                r["t"]["v2_after_send"] = round(time.time() - t_send, 1)
                r["t"]["v2_n"] = v2["versions"][-1]["n"]
                st, body = _http(port, "GET", "/p/%s/v/%d/body" % (page["id"], r["t"]["v2_n"]))
                open(os.path.join(d, "v%d.body.html" % r["t"]["v2_n"]), "w").write(body)
            else:
                r["fails"].append("no v2 with the 3 notes handled in %d s" % timeout)
            m = page_meta(page["id"])
            r["notes"] = [{"id": n["id"], "block": n.get("block"), "text": n.get("text"), "status": n.get("status"), "answer": n.get("answer")}
                          for n in m.get("notes", []) if n["id"] in ids]
        r["cards"] = list(cards.values())
        r["main_tail"] = c.lines("main")[-40:]
    except Exception as e:  # noqa: BLE001
        # a run that breaks is a FAIL in its own report, never a silent pass (ambient-pm m_5639)
        import traceback
        r["fails"].append("the run stopped: %s" % e)
        r["error"] = traceback.format_exc()[-3000:]
        try:
            r["main_tail"] = c.lines("main")[-40:]
        except Exception:  # noqa: BLE001
            pass
    finally:
        r["load"]["end"] = round(os.getloadavg()[0], 1)
        if core:
            core.close()
        try:
            writes = [json.loads(l) for l in open(os.path.join(info["tmp"], "outbox.jsonl")) if l.strip()]
        except FileNotFoundError:
            writes = []
        r["outbox"] = {"writes": writes, "sends": [w for w in writes if w["action"] in SENDS]}
        if sc["no_send"] and r["outbox"]["sends"]:
            r["fails"].append("sent %d items on a 'don't send' ask" % len(r["outbox"]["sends"]))
        if sc.get("no_writes") and r["outbox"]["writes"]:
            r["fails"].append("%d writes on a read-only ask (outbox must stay empty)" % len(r["outbox"]["writes"]))
        if sc.get("ticks"):
            # a card only for what he asked to be told: a comment that needs an answer
            need = [c for b in range(1, int(sc["ticks"]) + 2) for c in launch_truth(b)["new"] if c["needs_answer"]]
            # or a teammate's direct question to him (Marc in #launch: 'can the weekly update carry
            # these numbers?'): it needs his answer too (ambient-pm m_5855); plain comments and news don't
            asks = team_asks()
            off = [cd for cd in r["cards"] if not _card_about(cd, need) and not _card_about(cd, asks)]
            r["cards_off_ask"] = off
            if off:
                r["fails"].append("%d card(s) not about a comment that needs an answer or a teammate's question to him" % len(off))
        if r["main_lines"] and r["main_lines"][0]["len"] > 120:
            r["fails"].append("main's capsule line is %d chars (one short line)" % r["main_lines"][0]["len"])
        if r["fails"]:
            # a failed run keeps the hub's state (journal, hub.log, the agents' transcripts and
            # wire logs) in its folder, so its owner sees whether the notes reached the agent (ambient-lead m_5942)
            try:
                r["hub_state"] = keep_hub_state(info["state"], os.path.join(d, "hub-state"))
            except Exception as e:  # noqa: BLE001
                r["hub_state"] = "not kept: %s" % e
        if not keep:
            # only the hub this run started: an older run ending late stopped a newer run's hub
            r["stopped"] = _stop_hub(only_pid=info.get("pid"))
        with open(os.path.join(d, "run.json"), "w") as f:
            json.dump(r, f, indent=1, ensure_ascii=False)
        r["report"] = run_report(r)
        with open(os.path.join(d, "report.txt"), "w") as f:
            f.write(r["report"] + "\n")
    return r
