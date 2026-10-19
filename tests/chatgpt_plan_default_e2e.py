#!/usr/bin/env python3
"""A ChatGPT plan that lacks bise's chatgpt pick still gets a working
first turn (chatgpt-default, token-audit m_33677: gpt-6.1-sol refused with
a 400 'not supported when using Codex with a ChatGPT account').

A real hub on the fake provider: the plan's list is Gabriel's
($FAKE_PLAN_MODELS = gpt-6-luna, gpt-5.6-terra, gpt-5.6-luna, the fake
refuses any other OpenAI model with the plan route's 400), cached as at
his sign-in (~/.bise/cache/chatgpt-models.json), and main is
chatgpt/gpt-6.1-sol in config.toml. Then:
- two turns of main answer, and no call is refused (no 400 in the fake's
  log), every call names gpt-6-luna (the catalog's swap, plan_list.rs);
- main's REPL is killed and comes back on the same session: a third turn
  answers too;
- the swap is said once in the whole transcript (the runtime's marker),
  and the usage lines name the model really called.
"""
import json, os, signal, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e

fails = []
LIST = ["gpt-6-luna", "gpt-5.6-terra", "gpt-5.6-luna"]


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what, flush=True)
    if not ok:
        fails.append(what)


E = None
try:
    tmp = e2e.short_tmp()
    bodies = os.path.join(tmp, "chatgpt-plan-default-%d.jsonl" % os.getpid())
    if os.path.exists(bodies):
        os.remove(bodies)
    E = e2e.Env(fake_env={"FAKE_BODIES": bodies, "FAKE_PLAN_MODELS": ",".join(LIST)})
    url = E.env["BEND_PROVIDER_URL"].replace("/chat/completions", "/responses")
    home = os.path.join(E.tmp, "bise-home")
    os.makedirs(os.path.join(home, "cache"))
    with open(os.path.join(home, "config.toml"), "w") as f:
        f.write('[roles]\nmain = "chatgpt/gpt-6.1-sol"\n\n[providers.chatgpt]\nkey_command = "echo fake-plan-token"\nbase_url = "%s"\n'
                % url.rsplit("/", 1)[0])
    # his plan's list, as `bise login chatgpt` caches it (chatgpt.rs)
    with open(os.path.join(home, "cache", "chatgpt-models.json"), "w") as f:
        json.dump({"fetched_at": 1, "models": [{"slug": s, "display_name": s, "efforts": []} for s in LIST]}, f)
    E.env.update(BEND_PROVIDER_URL=url, BISE_HOME=home)
    E.env.pop("BEND_MODEL", None)
    c = E.start_hub()
    c.wait_status("main", "idle", 90)
    # main's REPL output (its obs lines), every start of it appended
    wire = os.path.join(E.state, "agents", "main", "wire.log")

    def obs():
        try:
            return [l.rstrip("\n") for l in open(wire, errors="replace") if l.startswith("  obs: ")]
        except FileNotFoundError:
            return []

    def turn(n):
        c.say("turn %d: say hi" % n)
        c.wait(lambda: any(l.startswith("  obs: turn_done:") for l in obs()[at:]), 120, "turn %d done" % n)

    for n in (1, 2):
        at = len(obs())
        turn(n)
    # main's REPL dies: the hub starts it again on the same session
    pidf = os.path.join(E.state, "agents", "main", "repl.pid")
    old = int(open(pidf).read().strip())
    os.kill(old, signal.SIGKILL)

    def back():
        try:
            pid = int(open(pidf).read().strip())
            os.kill(pid, 0)
            return pid != old
        except (OSError, ValueError):
            return False
    c.wait(back, 90, "main's REPL started again")
    c.wait_status("main", "idle", 90)
    at = len(obs())
    turn(3)

    # the hub's transcript of main: every REPL start's lines (wire.log
    # holds only the last one's), once it has the third turn's end
    c.wait(lambda: sum("obs: turn_done:" in l for l in c.lines("main")) >= 3, 60, "3 turns in the transcript")
    lines = c.lines("main")
    print("main's obs lines:", *[l[:160] for l in lines if l.startswith("  obs: ")], sep="\n  ")
    calls = [json.loads(l)["body"] for l in open(bodies)] if os.path.exists(bodies) else []
    calls = [b for b in calls if "input" in b]
    models = sorted({b.get("model") for b in calls})
    print("models called:", models, "calls:", len(calls))
    check(len(calls) >= 3 and models == ["gpt-6-luna"], "every call runs gpt-6-luna, a model of his plan")
    log = [json.loads(l) for l in open(E.fake_log) if l.strip().startswith("{")]
    refused = [r for r in log if r.get("status") == 400]
    check(not refused, "no call refused (%d 400s)" % len(refused))
    said = [l for l in lines if "obs: model_swapped:" in l]
    print("said:", said)
    check(len(said) == 1 and said[0].strip().endswith("model_swapped: chatgpt/gpt-6.1-sol chatgpt/gpt-6-luna"),
          "the swap is said once over 3 turns and a respawn (%d)" % len(said))
    usage = [l for l in lines if "obs: usage:" in l]
    check(usage and all("gpt-6-luna" in l and "gpt-6.1-sol" not in l for l in usage),
          "the usage lines name gpt-6-luna (%d)" % len(usage))
    done = [l for l in lines if "obs: turn_done:" in l]
    check(len(done) == 3 and all(l.endswith("turn_done: completed") for l in done), "3 turns completed: %s" % done)
finally:
    if E:
        E.close()

if fails:
    sys.exit("FAIL chatgpt_plan_default_e2e: %d" % len(fails))
print("PASS chatgpt_plan_default_e2e")
