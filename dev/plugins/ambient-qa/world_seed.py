"""ambient-qa world: the seeding (the rich world's parts, the mains' and agents' scripts, the feature,
the approval, the repos). Moved out of world.py as is (the 1,000-line cap, architect S1); world.py
re-exports every name. Import it through world (it reads world's constants)."""

import json
import os
import shlex
import subprocess
import sys
import time

from world_fixtures import (  # noqa: E402
    HERE, LONG_OUT_BYTES, P99_ANSWER, P99_ASK, QUEUED_TEXT, QUOTE_REPLY, QUOTE_WORDS, RICH_DROPPED,
    SCREEN_REPLY, SCREEN_TEXT, SEED_WORDS, STEER_REPLY, STEER_TEXT, STEER_TURN, agent_reply, bar_turns,
    USAGE_TURN, crowd, dash_messages, plan, put_script, queued_count, quoted_message, rich_messages,
    screen_input, scripts_dir)

def try_real(dir_, projects, url):
    """A try home's 'real' dir (BISE_TRY_REAL): projects.json (the world's projects, in order) and a
    config.toml whose main runs on the world's fake provider; never a key of his. The fake provider's
    key comes from a key_command ('echo fake-key'), so the try core's accounts event lists 'fake' as
    signed_in and setup's model step can continue to the project picker (qa-native m_12872, R34);
    key_env names a variable nothing sets, only so the account is listed. Returns the dir."""
    os.makedirs(dir_, exist_ok=True)
    with open(os.path.join(dir_, "projects.json"), "w") as f:
        json.dump({"v": 1, "projects": [{"path": p["ws"], "name": p["project"], "order": i} for i, p in enumerate(projects)]}, f, indent=1)
    base = url.split("/chat/completions")[0]
    with open(os.path.join(dir_, "config.toml"), "w") as f:
        f.write('[roles]\nmain = "fake/mistral-small-latest"\nclassify = "off"\n\n' + FAKE_ACCOUNT % base)
    return dir_


def rich_seed(world, hubs, holds, agents, timeout):
    """The rich world's extra seeding, on the hubs already seeded. Each part runs alone: a part that
    fails is recorded in `errors` (the world stays up, the try gate sees what is missing)."""
    import qa
    by = {h["project"]: c for h, c in zip(hubs, holds)}
    hub = {h["project"]: h for h in hubs}
    d = os.path.join(world, "rich")
    os.makedirs(d, exist_ok=True)
    out = {"errors": []}

    def part(name, fn):
        t0 = time.time()
        try:
            out[name] = fn()
        except Exception as e:  # noqa: BLE001 - one part's failure must not stop the others
            out["errors"].append("%s: %s" % (name, e))
        print("world: rich %s in %.0f s" % (name, time.time() - t0), flush=True)

    sd = scripts_dir(world)

    def bash(project, words, script, reply):
        """his plain words to `project`'s main, which runs the script (the fake provider's script for
        those words: never a marker in his message), then answers `reply`; waits for the script's
        .done file, then main idle."""
        k = len([n for n in os.listdir(d) if n.endswith(".sh")])
        path = os.path.join(d, "%s-%d.sh" % (project, k))
        with open(path, "w") as f:
            f.write("set -u\n{\n%s\n} > %s.log 2>&1\ntouch %s.done\n" % (script, path, path))
        put_script(sd, "%s-%d" % (project, k), words, [("bash", "bash %s" % path)], reply)
        # a say can be lost while main is busy (seen on the crowd step: main idle, the script never
        # asked): idle first, said again once when nothing ran
        for attempt in (1, 2):
            by[project].wait_idle("main", timeout=timeout)
            by[project].say(words)
            try:
                by[project].wait(lambda: os.path.exists(path + ".done"), min(timeout, 60), "%s ran" % path)
                break
            except Exception:  # noqa: BLE001 - wait.until's timeout
                if attempt == 2:
                    raise
        by[project].wait_idle("main", timeout=timeout)
        return path

    def turn(project, agent, text, needle, focus=None):
        """his words to an agent, its answer's first line awaited; said again once when none (a [bise]
        note reaching the agent mid-turn makes its next turn answer the note instead)."""
        c = by[project]
        for attempt in (1, 2):
            c.wait_idle(agent, timeout=timeout)
            c.say(text, focus=focus or agent)
            try:
                c.wait_line(agent, needle, min(timeout, 60))
                return
            except Exception:  # noqa: BLE001 - wait.until's timeout
                if attempt == 2:
                    raise

    def long_main():
        msgs = rich_messages()
        for i, m in enumerate(msgs):
            put_script(sd, "main-%03d" % i, m["match"], (), m["reply"])
        for m in msgs:
            turn("telemetry", "main", m["text"], m["needle"])
        return len(msgs)

    def dash():
        msgs = dash_messages()
        for i, m in enumerate(msgs):
            put_script(sd, "dash-%02d" % i, m["text"], m["calls"], m["reply"])
        for m in msgs:
            turn("telemetry", "dashboards", m["text"], m["needle"])
        return len(msgs)

    def bar():
        # R37/FOLDS2 (an 'other' step + a thinking row) and the 4 KB output cut, on the dashboards agent
        turns = bar_turns()
        for i, t in enumerate(turns):
            put_script(sd, "bar-%d" % i, t["text"], t["calls"], t["reply"])
            if t.get("think") or t.get("stream"):
                f = os.path.join(sd, "bar-%d.json" % i)
                s = json.load(open(f))
                s.update({k: t[k] for k in ("think", "stream") if t.get(k)})
                with open(f + ".tmp", "w") as fh:
                    json.dump(s, fh)
                os.replace(f + ".tmp", f)
        for t in turns:
            turn("telemetry", "dashboards", t["text"], t["needle"])
        return {"other_step": turns[0]["text"], "long_output_bytes": LONG_OUT_BYTES}

    def answered():
        # the docked 'answered … for you' row, last in telemetry's thread so a check reaches it (the
        # seed's PagerDuty answer sits under 110 messages): p99 asks main, main answers for him with why
        f = ask_file(world, "telemetry", "p99-ship")
        os.makedirs(os.path.dirname(f), exist_ok=True)
        q = shlex.quote
        ask = os.path.join(d, "p99-ask.sh")
        with open(ask, "w") as fh:
            fh.write("sb send main --expect-reply %s | sed -n 's/^sent \\(m_[0-9]*\\).*/\\1/p' > %s.tmp && mv %s.tmp %s\n"
                     % (q(P99_ASK), q(f), q(f), q(f)))
        reply = os.path.join(d, "p99-answer.sh")
        with open(reply, "w") as fh:
            fh.write("for i in $(seq 120); do [ -s %s ] && break; sleep 0.5; done\nsb send p99 --reply-to \"$(cat %s)\" --why %s %s\ntouch %s.done\n"
                     % (q(f), q(f), q(P99_ANSWER["why"]), q(P99_ANSWER["text"]), q(reply)))
        words = "ask main whether the p99 fix ships today"
        put_script(sd, "p99-ask", words, [("bash", "bash %s" % ask)], "Asked main: today or after the batch test.")
        put_script(sd, "p99-answer", P99_ASK.split("\n")[0], [("bash", "bash %s" % reply)],
                   "I answered p99 for you: after the batch test, since it runs tomorrow and could move the threshold.")
        c = by["telemetry"]
        c.wait_idle("main", timeout=timeout)
        c.wait_idle("p99", timeout=timeout)
        c.say(words, focus="p99")
        c.wait(lambda: os.path.exists(reply + ".done"), timeout, "main's answer for p99")
        c.wait_idle("main", timeout=timeout)
        return "telemetry: main answered p99 for him (%s)" % P99_ANSWER["text"]

    def messages():
        c = by["telemetry"]
        out_ = {}
        # STEERED: his words reach dashboards while its slow command runs; the turn's next step answers them
        put_script(sd, "steer-turn", STEER_TURN["text"], STEER_TURN["calls"], STEER_TURN["reply"])
        put_script(sd, "steer-words", STEER_TEXT, [("edit", {"file_path": "panels.md", "old_string": "# p99 latency · eu-west (last 24 h, by host)\n",
                                                             "new_string": "# p99 latency · eu-west (last 24 h, by host), with p95\n"})],
                   STEER_REPLY)
        c.wait_idle("dashboards", timeout=timeout)
        c.say(STEER_TURN["text"], focus="dashboards")
        log = hub["telemetry"]["fake_log"]
        c.wait(lambda: os.path.exists(log) and "sleep 6 && echo rebuilt" in open(log, errors="replace").read(), timeout,
               "dashboards' slow command started")
        c.say(STEER_TEXT, focus="dashboards")       # no "queued": a steer, as the window's send while it works
        c.wait_line("dashboards", STEER_REPLY.split(",")[0], timeout)
        out_["steered"] = "telemetry/dashboards: %s" % STEER_TEXT
        # QUOTED: his message to telemetry's main quoting the first line of an earlier long answer
        put_script(sd, "quoted", QUOTE_WORDS, (), QUOTE_REPLY)
        c.wait_idle("main", timeout=timeout)
        c.say(quoted_message())
        c.wait_line("main", QUOTE_REPLY[:40], timeout)
        out_["quoted"] = "telemetry/main: %s" % QUOTE_WORDS
        # QUEUED: behind ingest's 2-hour turn ('working'): it waits for the turn's end, i.e. until world down
        c.wait_status("ingest", ["working", "thinking"], timeout)
        c.say(QUEUED_TEXT, focus="ingest", mode="queued")
        c.wait(lambda: queued_count(c.agent("ingest")) >= 1, timeout, "his message queued on ingest")
        out_["queued"] = "telemetry/ingest: %s" % QUEUED_TEXT
        return out_

    def scheduled():
        bash("telemetry", "check the p99 panel every 30 minutes, and make me the morning page every day at 9",
             "sb every 30m 'check the p99 panel and tell me if it moved' --to dashboards\n"
             "sb every day 09:00 'make the morning page'\nsb every",
             "Two timers are set:\n\n- every 30 min, **dashboards** checks the p99 panel and tells you if it moved\n"
             "- every day at 09:00, the morning page")
        return "2 timers on telemetry"

    def more_agents():
        have = len([a for a in plan(3, True)[0]["agents"]])
        fill = crowd(agents, have) if agents else []
        if fill:
            for a in fill:
                what = a["name"].replace("-", " ")
                put_script(sd, "crowd-%s" % a["name"], a["objective"], (),
                           "Looked into %s.\n\n- nothing urgent: it's within its usual range this week\n"
                           "- one thing to watch: it moved with the tuesday batch change, like the p99\n\n"
                           "I'll keep an eye on it and tell you if that changes." % what)
            bash("telemetry", "split the open telemetry questions between new agents, one each",
                 "\n".join("sb spawn %s --objective %s" % (a["name"], shlex.quote(a["objective"])) for a in fill),
                 "Started %d agents, one per open question. Each one reports here when it has something." % len(fill))
            by["telemetry"].wait(lambda: len((by["telemetry"].state or {}).get("agents", [])) >= agents, timeout,
                                 "%d agents in telemetry" % agents)
        return len(fill)

    def pages():
        made = []
        for project, ex, pid, title in (("bise", "inbox-review", "inbox-review", "inbox review"),
                                        ("bise", "weekly-update", "weekly-update", "weekly update"),
                                        ("shop", "diff-review", "checkout-review", "checkout review")):
            src = os.path.join(qa.KIT_EXAMPLES, ex + ".html")
            if not os.path.exists(src):
                raise RuntimeError("no kit example %s" % src)
            bash(project, "make me a page for the %s" % title,
                 "sb page publish %s --id %s --title %s" % (shlex.quote(src), pid, shlex.quote(title)),
                 "The %s is on its page. Leave notes on it and I'll pick them up." % title)
            made.append("%s:%s" % (project, pid))
        return made

    def screen():
        # as the app sends it: his words, and his fn context as the input op's `context`; the hub
        # renders the screen_context block (fn_context.rs), never his message
        c = by["bise"]
        put_script(sd, "screen", SCREEN_TEXT, (), SCREEN_REPLY)
        c.wait_idle("main", timeout=timeout)
        s = screen_input()     # client-protocol: command/run with SendOpts' context (the core's send)
        c.say(s["text"], focus=s["focus"], context=s["context"])
        c.wait_line("main", SCREEN_REPLY.split("\n")[0][:50], timeout)
        return "bise main"

    def approval():
        h = hub["docs"]
        path = os.path.join(world, "seed", "docs", "feature-dark-mode.sh")
        with open(path, "w") as f:
            f.write(feature_script(world, h["ws"], "dark-mode"))
        words = "the dark mode is ready: open it for review"
        put_script(sd, "feature-dark-mode", words, [("bash", "bash %s" % path)],
                   "The dark mode is ready for you: try it, then merge it or ask for changes.")
        by["docs"].wait_idle("main", timeout=timeout)
        by["docs"].say(words)
        by["docs"].wait(lambda: any(cd.get("kind") == "feature_try" for cd in by["docs"].cards()), timeout, "docs' feature_try card")
        return "docs feature_try (dark-mode)"

    def archived():
        project, name = RICH_DROPPED
        by[project].wait_idle(name, timeout=timeout)
        bash(project, "%s is done, drop it" % name, "sb drop %s" % name,
             "I asked to drop %s: its work is on its branch, nothing is lost." % name)
        # main's drop is a suggestion to him (a 'drop' card): his yes archives the agent
        c = by[project]
        # client-protocol: a drop is bise's own bookkeeping, in hub/cards' `others`, never his `cards`
        # (proto_view.rs his(); the archived part waited on it forever, so 'answered' never ran)
        def drop_card():
            with c.lock:
                others = list((c.hub.get("hub/cards") or {}).get("others", []))
            return next((cd for cd in c.cards() + others if cd.get("kind") == "drop" and cd.get("agent") == name), None)
        card = c.wait(drop_card, timeout, "the drop card")
        c.say("/answer %d yes" % card["id"])
        # client-protocol: an archived agent reads status 'done' with archived: true (proto_view.rs)
        c.wait(lambda: all(a.get("status") == "archived" or a.get("archived") for a in (c.state or {}).get("agents", [])
                           if a.get("name") == name),
               timeout, "%s archived" % name)
        return "%s/%s archived" % (project, name)

    def working():
        # an agent in a long turn (the fake provider holds every request of that message for 2 h):
        # 'working' for the whole try gate, until world down
        c = by["telemetry"]
        words = "keep watching the ingest lag and tell me when it drops"
        put_script(sd, "ingest-watch", words, (), "The ingest lag is back under a second.", slow=7200)
        c.wait_idle("ingest", timeout=timeout)
        c.say(words, focus="ingest")
        c.wait_status("ingest", ["working", "thinking"], timeout)
        return "telemetry/ingest"

    def usage():
        # HEADFIT: p99's last model call is this one, so its head carries 'context 44k · 17%'
        # (after 'answered': main's answer gives p99 one more turn, which would reset the gauge)
        c, t = by["telemetry"], USAGE_TURN
        put_script(sd, "usage", t["text"], (), t["reply"], usage=t["usage"])
        turn("telemetry", "p99", t["text"], t["reply"][:30])
        c.wait(lambda: ((c.agent("p99") or {}).get("usage") or {}).get("words") == t["words"], timeout,
               "p99's head: context %s" % t["words"])
        return "telemetry/p99: context %s" % t["words"]

    for name, fn in (("main_thread", long_main), ("tool_thread", dash), ("bar", bar), ("scheduled", scheduled), ("crowd", more_agents),
                     ("pages", pages), ("screen_context", screen), ("feature_approval", approval), ("archived", archived),
                     ("answered", answered), ("working", working), ("messages", messages), ("usage", usage)):
        part(name, fn)
    return out


def marker(world, project, agent):
    return os.path.join(world, "seeded", "%s.%s" % (project, agent))


def ask_file(world, project, agent):
    return os.path.join(world, "asks", "%s.%s" % (project, agent))


def agent_script(world, project, agent):
    """The bash an agent runs in its own folder (worktree or the shared one): its steps, then the
    seeded marker (before a long `work`, so an agent at work counts as seeded)."""
    out = ["set -u", "cd \"$PWD\""]
    done = "mkdir -p %s && touch %s" % (shlex.quote(os.path.join(world, "seeded")), shlex.quote(marker(world, project, agent["name"])))
    marked = False
    for s in agent["steps"]:
        if "write" in s:
            d = os.path.dirname(s["write"])
            if d:
                out.append("mkdir -p %s" % shlex.quote(d))
            out.append("printf %%s %s > %s" % (shlex.quote(s["text"]), shlex.quote(s["write"])))
        elif "commit" in s:
            out.append("git add -A && git -c commit.gpgsign=false commit -q --no-verify -m %s" % shlex.quote(s["commit"]))
        elif "report" in s:
            out.append("sb report %s %s%s" % (s["report"], shlex.quote(s["text"]),
                                              " --step %s" % shlex.quote(s["step"]) if s.get("step") else ""))
        elif "land" in s:
            out.append("sb land %s" % shlex.quote(s["land"]))
        elif "ask" in s:
            # its question to main; main's script waits for the message id and escalates it
            f = ask_file(world, project, agent["name"])
            out.append("mkdir -p %s" % shlex.quote(os.path.dirname(f)))
            out.append("sb send main --expect-reply %s | sed -n 's/^sent \\(m_[0-9]*\\).*/\\1/p' > %s.tmp && mv %s.tmp %s"
                       % (shlex.quote(s["ask"]), shlex.quote(f), shlex.quote(f), shlex.quote(f)))
        elif "send" in s:
            out.append("sb send %s %s" % (shlex.quote(s["send"]), shlex.quote(s["text"])))
        elif "artifact" in s:
            out.append("sb artifact add %s --title %s" % (shlex.quote(s["artifact"]), shlex.quote(s["title"])))
        elif "work" in s:
            out.append(done)
            marked = True
            out.append("sleep %d" % int(s["work"]))
        else:
            raise ValueError("unknown step %r" % (s,))
    if not marked:
        out.append(done)
    out.append("echo seeded %s" % agent["name"])
    return "\n".join(out) + "\n"


def main_script(world, project, rich=False):
    """The bash the project's fake main runs: its agents (each with its script as the brief's
    {{bash:}}; rich: the objective alone, its script in $FAKE_SCRIPTS), then its cards."""
    out = ["set -u"]
    if project.get("feature"):
        out.append("sb feature new %s" % shlex.quote(project["feature"]))
    for a in project["agents"]:
        script = os.path.join(world, "seed", project["name"], a["name"] + ".sh")
        brief = a["objective"] if rich else "%s {{bash: bash %s}}" % (a["objective"], script)
        if a.get("usage") and not rich:
            brief += " [[usage: %d]]" % a["usage"]
        where = " --feature %s" % shlex.quote(a["feature"]) if a.get("feature") else (" --place %s" % a["place"] if a.get("place") else "")
        out.append("sb spawn %s%s --objective %s" % (a["name"], where, shlex.quote(brief)))
    for c in project["cards"]:
        out.append("sb card %s" % shlex.quote(c))
    # an agent's question: wait (up to 300 s) for its message to main, then the card for it, or
    # main's own answer with its why (main_answers: the hub's 'answered' line)
    for a in project["agents"]:
        for st in a["steps"]:
            if "ask" in st:
                f = shlex.quote(ask_file(world, project["name"], a["name"]))
                out.append("for i in $(seq 600); do [ -s %s ] && break; sleep 0.5; done" % f)
                if st.get("main_answers"):
                    ans = st["main_answers"]
                    out.append("[ -s %s ] && sb send %s --reply-to \"$(cat %s)\" --why %s %s"
                               % (f, shlex.quote(a["name"]), f, shlex.quote(ans["why"]), shlex.quote(ans["text"])))
                else:
                    out.append("[ -s %s ] && sb card --for \"$(cat %s)\" %s" % (f, f, shlex.quote(st["ask"])))
    out.append("echo seeded main")
    return "\n".join(out) + "\n"


FEATURE_FILE = ("FEATURE.md", "# %s\n\nwhat this feature adds, for the review.\n")


def feature_script(world, ws, name):
    """The bash a project's fake main runs for `world feature`: the real dev-flow feature
    (sb feature new), one commit on its branch made in a throwaway worktree of the project's own
    checkout (removed after), then `sb feature ready`, which opens the user's feature_try card
    (an approval kind: Card.approval). Answering it 1 (try it) opens feature_merge, the second."""
    tmp = os.path.join(world, "feature", "%s-%s" % (os.path.basename(ws), name))
    rel, text = FEATURE_FILE
    q = shlex.quote
    return "\n".join([
        "set -eu",
        "sb feature new %s" % q(name),
        "rm -rf %s" % q(tmp),
        "git -C %s worktree add -q %s %s" % (q(ws), q(tmp), q(name)),
        "printf %%s %s > %s" % (q(text % name), q(os.path.join(tmp, rel))),
        "git -C %s add -A" % q(tmp),
        "git -C %s -c commit.gpgsign=false commit -q --no-verify -m %s" % (q(tmp), q("%s: what it adds" % name)),
        "git -C %s worktree remove --force %s" % (q(ws), q(tmp)),
        "sb feature ready %s" % q(name),
        "echo seeded feature %s" % q(name),
    ]) + "\n"


def checker_off(home):
    """The world's bise home has the approvals checker off ([roles] classify = "off"): a gated call
    in auto mode is a card, never a model call (the hubs run yolo anyway, but for approval_seed)."""
    cfg = os.path.join(home, ".bise", "config.toml")
    text = open(cfg).read() if os.path.exists(cfg) else ""
    if "classify" not in text:
        with open(cfg, "a") as f:
            f.write(("\n" if text and not text.endswith("\n") else "") + "[roles]\nclassify = \"off\"\n")


FAKE_ACCOUNT = ('[providers.fake]\nname = "fake"\napi = "openai-chat"\nbase_url = "%s"\nkey_env = "BISE_TRY_FAKE_KEY"\n'
                'key_command = "echo fake-key"\nsmall_model = "mistral-small-latest"\n')


def home_account(home, url):
    """The world's own bise home gets the same signed-in fake account as try-real (qa-native m_12883:
    the gate's window runs on h/.bise, and setup's model step waits for a signed_in account). Only
    the provider: no role points at it, so the world's hubs keep their own fake provider."""
    cfg = os.path.join(home, ".bise", "config.toml")
    text = open(cfg).read() if os.path.exists(cfg) else ""
    if "[providers.fake]" not in text:
        with open(cfg, "a") as f:
            f.write(("\n" if text and not text.endswith("\n") else "") + "\n" + FAKE_ACCOUNT % url.split("/chat/completions")[0])


def approval_command(home, spec):
    """The seeded agent's call the gate asks about: a forced push (tier 0, a card in auto whatever
    the sandbox; a write outside the workspace was let through to the sandbox, no card), to a
    remote that is a missing path in the world's home: it could never reach the network. Pure."""
    return "git push --force %s HEAD:main" % shlex.quote(os.path.join(home, spec["remote"]))


def approval_seed(c, home, spec, timeout, scripts=None):
    """qa-flows m_11510 (a): his answer to a tool approval with a note, in auto mode. The hub goes
    auto for this session (BISE_APPROVALS is set, so config.toml keeps yolo), an agent's call that
    writes outside its workspace raises the gate's card, the world answers '/answer N no: <note>' as
    him (the hold client is the hub's starter), the call never runs, the hub goes back to yolo."""
    # client-protocol: approvals/set's result is the approvals state; every client also gets hub/approvals
    last = {}

    def set_mode(m):
        r = c.rpc("approvals/set", {"project": c.project(), "mode": m}, timeout)
        if "error" in r:
            raise AssertionError("approvals/set %s refused: %r" % (m, r["error"]))
        last["mode"] = (r.get("result") or {}).get("mode")

    def mode():
        note = c.hub.get("hub/approvals") or {}
        return note.get("mode") or last.get("mode")
    set_mode("auto")
    c.wait(lambda: mode() == "auto", timeout, "the hub in auto")
    try:
        if scripts:
            # rich: his /new is plain words, the call comes from the fake provider's script for the brief
            put_script(scripts, "approval-%s" % spec["agent"], spec["objective"], [("bash", approval_command(home, spec))],
                       "Not pushed: you said no. I'll put it on a branch instead.")
            c.say("/new %s: %s" % (spec["agent"], spec["objective"]))
        else:
            c.say("/new %s: %s {{bash: %s}}" % (spec["agent"], spec["objective"], approval_command(home, spec)))
        card = c.wait(lambda: next((cd for cd in c.cards() if cd.get("kind") == "confirm" and cd.get("agent") == spec["agent"]), None),
                      timeout, "the approval card for %s" % spec["agent"])
        c.say("/answer %d no: %s" % (card["id"], spec["note"]))
        c.wait(lambda: not any(cd.get("id") == card["id"] for cd in c.cards()), timeout, "the approval card closed")
        c.wait(lambda: any(approval_said_no(line, spec["agent"]) for line in c.lines("main")), timeout,
               "main's line: the approval for %s said no" % spec["agent"])
    finally:
        last.clear()
        c.hub.pop("hub/approvals", None)
        set_mode("yolo")
        c.wait(lambda: mode() == "yolo", timeout, "the hub back in yolo")


def approval_said_no(line, agent):
    """main's feed line for his 'no' on `agent`'s approval, in either form: the record core-f wrote
    since 322a1ce0, 'sb approval :: {"how": "no", "who": <agent>, …}', or the older text line
    'sb approval : no : <agent>' (tests/e2e.py feed_rec reads both the same way). Pure."""
    if line.startswith("sb approval :: "):
        try:
            rec = json.loads(line[len("sb approval :: "):])
        except ValueError:
            return False
        return isinstance(rec, dict) and rec.get("how") == "no" and rec.get("who") == agent
    return ("sb approval : no : %s" % agent) in line


def seed_words(project, rich):
    """What main is told to seed `project`: plain words (rich: run by $FAKE_SCRIPTS), else the marker. Pure."""
    if rich:
        return SEED_WORDS[project["name"]]
    return "[[bash: bash %s]]" % project["_main"]


def write_seeds(world, projects, rich=False):
    """The scripts on disk (rich: and the fake providers' scripts for the seed words and each brief);
    returns the markers to wait for."""
    want = []
    for p in projects:
        d = os.path.join(world, "seed", p["name"])
        os.makedirs(d, exist_ok=True)
        p["_main"] = os.path.join(d, "main.sh")
        with open(p["_main"], "w") as f:
            f.write(main_script(world, p, rich))
        if rich:
            put_script(scripts_dir(world), "seed-%s" % p["name"], SEED_WORDS[p["name"]], [("bash", "bash %s" % p["_main"])],
                       "The %s team is started: %s. I'll tell you when one of them needs you."
                       % (p["name"], ", ".join(a["name"] for a in p["agents"])))
        for a in p["agents"]:
            path = os.path.join(d, a["name"] + ".sh")
            with open(path, "w") as f:
                f.write(agent_script(world, p["name"], a))
            if rich:
                put_script(scripts_dir(world), "brief-%s-%s" % (p["name"], a["name"]), a["objective"],
                           [("bash", "bash %s" % path)], agent_reply(a))
            want.append(marker(world, p["name"], a["name"]))
    return want


def make_repo(ws, files, origin=None):
    """A project's git repo on main, its files committed; `origin` its remote (never fetched or pushed:
    only the world's fake gh reads it)."""
    os.makedirs(ws, exist_ok=True)
    for rel, text in files.items():
        p = os.path.join(ws, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w") as f:
            f.write(text)
    env = dict(os.environ, GIT_AUTHOR_NAME="qa", GIT_AUTHOR_EMAIL="qa@world.test", GIT_COMMITTER_NAME="qa", GIT_COMMITTER_EMAIL="qa@world.test")
    for cmd in (["git", "init", "-q", "-b", "main"], ["git", "config", "user.email", "qa@world.test"], ["git", "config", "user.name", "qa"],
                ["git", "config", "commit.gpgsign", "false"], ["git", "add", "-A"], ["git", "commit", "-q", "--no-verify", "-m", "init"]):
        r = subprocess.run(cmd, cwd=ws, capture_output=True, text=True, env=env)
        if r.returncode != 0:
            raise RuntimeError("make_repo %s: %s: %s" % (ws, " ".join(cmd), (r.stderr or r.stdout).strip()))
    if origin:
        subprocess.run(["git", "remote", "add", "origin", origin], cwd=ws, check=True, capture_output=True)
        subprocess.run(["git", "config", "remote.origin.pushurl", "DISABLED-in-world"], cwd=ws, check=True, capture_output=True)


def fake_gh(world, projects):
    """<world>/bin/gh: the world's gh (fake_gh.py) over the PRs of every project with an origin, put
    first on the world hubs' PATH. Returns the bin folder."""
    bindir = os.path.join(world, "bin")
    os.makedirs(bindir, exist_ok=True)
    for p in projects:
        if p.get("origin"):
            ref = p["origin"].rstrip("/").removesuffix(".git").split("/")
            with open(os.path.join(world, "prs-%s.json" % p["name"]), "w") as f:
                json.dump({"owner": ref[-2], "name": ref[-1], "prs": p.get("prs", [])}, f, indent=1)
    gh = os.path.join(bindir, "gh")
    with open(gh, "w") as f:
        # one gh for every hub: the PR data of the repo the hub asks about (its owner/name in the query)
        f.write("#!/bin/sh\n# the world's fake gh (dev/plugins/ambient-qa/fake_gh.py): never his gh, his login or the network\n"
                "exec %s %s %s \"$@\"\n" % (shlex.quote(sys.executable), shlex.quote(os.path.join(HERE, "fake_gh.py")),
                                              shlex.quote(world)))
    os.chmod(gh, 0o755)
    return bindir


