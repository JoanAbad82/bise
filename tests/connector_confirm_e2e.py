#!/usr/bin/env python3
"""A connector call that writes asks the user in `auto` (tool-perms; the
Mistral connectors gateway never asks for a confirmation itself, so the
hub does): approvals/connector.rs, judge_connector.

A real hub, live REPLs, the fake provider (`[[ts: CODE]]` runs a
program), a temp HOME and BISE_HOME, the checker off, and a fake MCP
server as the connector (a plugin's remote server: no Mistral, no
account). Its `add_tool` adds tools named like real ones:
  1. yolo: a send runs with no card;
  2. auto: a read runs with no card;
  3. a send: one card (the tool, its arguments, "it sends from your …
     account, as you.", always = the whole tool); allow runs it;
  4. the same send, no with a note: it does not run, the agent reads why;
  5. "always": it runs, the rule is saved for the repo, the next send
     runs with no card;
  6. a delete: its card's sentence is a warning (`warn:`).

python3 -u tests/connector_confirm_e2e.py
"""
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import e2e  # noqa: E402
import wait  # noqa: E402
from e2e import check  # noqa: E402

HELLO = os.path.join(e2e.ROOT, "rust/plugins/tests/fixtures/hello-plugin")
SEND = "remote_one.send_message"


def confirm_cards(c):
    return [cd for cd in c.cards() if cd["kind"] == "confirm"]


def done_lines(c):
    return [l for l in c.lines("main") if "done: tool run_typescript" in l]


def start(c, code):
    """The program starts; the count of results before it."""
    before = len(done_lines(c))
    c.say("[[ts: %s]]" % code)
    return before


def result(c, before, timeout=90):
    c.wait(lambda: len(done_lines(c)) > before, timeout, "the program's result")
    c.wait_idle("main")
    return done_lines(c)[before]


def run(c, code):
    return result(c, start(c, code))


def card(c):
    return c.wait(lambda: (confirm_cards(c) or [None])[0], 60, "a confirm card")


def plugin(root, name, servers):
    d = os.path.join(root, name)
    shutil.copytree(HELLO, d)
    shutil.rmtree(os.path.join(d, "skills"))
    m = json.load(open(os.path.join(d, "plugin.json")))
    m["name"] = name
    json.dump(m, open(os.path.join(d, "plugin.json"), "w"))
    json.dump({"mcpServers": servers}, open(os.path.join(d, "mcp.json"), "w"))


def main():
    E = e2e.Env()
    import scripted_ts
    E.env.update(scripted_ts.jsrt_env())
    home = os.path.join(E.tmp, "home")
    bise = os.path.join(E.tmp, "bise")
    os.makedirs(home)
    os.makedirs(bise)
    with open(os.path.join(bise, "config.toml"), "w") as f:
        f.write('[roles]\nclassify = "off"\n')
    E.env.update(HOME=home, BISE_HOME=bise, XDG_STATE_HOME=os.path.join(home, "state"))
    E.env.pop("BISE_APPROVALS", None)
    user = os.path.join(E.tmp, "user-plugins")
    os.makedirs(user)
    E.env["BEND_PLUGINS_HOME"] = user
    E.env["BEND_PLUGINS_DATA"] = os.path.join(E.tmp, "plugin-data")
    E.env["BEND_PLUGINS_STATE"] = os.path.join(E.tmp, "plugins.json")
    E.env["BEND_MCP_STATUS"] = os.path.join(E.tmp, "mcp-status")
    E.env["BEND_MCP_SECRETS"] = os.path.join(E.tmp, "secrets")
    port_file = os.path.join(E.tmp, "mcp-port")
    web = subprocess.Popen([sys.executable, os.path.join(HERE, "fake_mcp_http.py"), "--mode", "streamable",
                            "--port-file", port_file], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ok = False
    try:
        port = wait.until(lambda: open(port_file).read().strip(), 10, "the fake MCP server's port file", poll=0.05)
        plugin(user, "remote-one", {"web": {"url": "http://127.0.0.1:%s/mcp" % port}})
        c = E.start_hub()
        c.wait_idle("main")
        check(c.approvals_set().get("result", {}) is not None, "approvals read")

        # 1. yolo: the tools are added, a send runs, nothing asks
        for t in ("send_message", "list_items", "delete_item"):
            got = run(c, "return await tools.remote_one.add_tool({name: '%s'})" % t)
            check("added" in got, "add_tool %s: %r" % (t, got[:200]))
        got = run(c, "return await tools.remote_one.send_message({text: 'yolo'})")
        check("added-tool:send_message" in got, "yolo ran the send: %r" % got[:300])
        check(not confirm_cards(c), "no card in yolo: %r" % c.cards())

        # 2. auto: a read runs at once
        check(c.approvals_set("auto").get("result") == {}, "/approvals auto answered")
        got = run(c, "return await tools.remote_one.list_items({})")
        check("added-tool:list_items" in got, "the read ran: %r" % got[:300])
        check(not confirm_cards(c), "no card for a read: %r" % c.cards())

        # 3. a send: one card; allow runs it
        before = start(c, "return await tools.remote_one.send_message({text: 'hello nina'})")
        cd = card(c)
        q = cd["question"]
        check(q.startswith("wants to call %s" % SEND), q)
        check('"text": "hello nina"' in q, "the card shows what goes out: %r" % q)
        check("reason: it sends from your Remote One account, as you." in q, q)
        check("always: %s" % SEND in q, "always = the whole tool: %r" % q)
        c.wait(lambda: c.agent("main")["waiting_on"] == "you", 30, "main waits on you")
        c.say("/answer %d 1" % cd["id"])
        got = result(c, before)
        check("added-tool:send_message" in got, "allow ran it: %r" % got[:300])
        c.wait(lambda: not confirm_cards(c), 30, "the card folded")

        # 4. the same send, no: it does not run
        before = start(c, "return await tools.remote_one.send_message({text: 'hello nina'})")
        cd = card(c)
        c.say("/answer %d no: not to nina" % cd["id"])
        got = result(c, before)
        check("added-tool:send_message" not in got and "not to nina" in got, "no stopped it: %r" % got[:300])
        c.wait_feed("main", "approval", 10, how="no", who="main", note="not to nina")

        # 5. always: runs, saved for the repo; the next send asks nothing
        before = start(c, "return await tools.remote_one.send_message({text: 'one'})")
        cd = card(c)
        c.say("/answer %d 2" % cd["id"])
        got = result(c, before)
        check("added-tool:send_message" in got, "always ran it: %r" % got[:300])
        rules = open(os.path.join(bise, "approvals.toml")).read()
        check('tool = "%s"' % SEND in rules, "the rule is saved: %r" % rules)
        got = run(c, "return await tools.remote_one.send_message({text: 'two'})")
        check("added-tool:send_message" in got, "the remembered send ran: %r" % got[:300])
        check(not confirm_cards(c), "no card after always: %r" % c.cards())

        # 6. a delete: the sentence is a warning; no
        before = start(c, "return await tools.remote_one.delete_item({id: 'i1'})")
        cd = card(c)
        check("warn: it deletes from your Remote One account. it may not be undone." in cd["question"], cd["question"])
        c.say("/answer %d 3" % cd["id"])
        got = result(c, before)
        check("added-tool:delete_item" not in got, "no stopped the delete: %r" % got[:300])
        ok = True
        print("connector confirm: ok")
    finally:
        web.kill()
        if not ok:
            os.environ["SB_KEEP"] = "1"
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
