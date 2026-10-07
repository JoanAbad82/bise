#!/usr/bin/env python3
"""ambient-qa's MCP server (stdio, JSON-RPC 2.0, one message per line).
The tools are qa.py's and world.py's functions: throwaway hubs, fake accounts, pages, scripted
product runs and the QA world. The Swift app's tools (launch with an app, fn, keys, clicks,
snapshots, scenes, menus) are gone with the app (amb-mac's delete plan, step 2); the desktop
app's checks live in apps/desktop/tests. A PNG comes back as an image block (made smaller with
sips when big) next to its path."""
import base64
import json
import os
import subprocess
import sys
import tempfile
import traceback

sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
import qa  # noqa: E402

TOOLS = [
    ("launch", "A throwaway hub, its page server and the fake accounts (no app). hub=fake (default): tests/e2e.py's scripted provider, main answers 'ack: <your words>'; hub=model: the same throwaway hub with the user's model and keys (costs credits). The real workspace is refused: it needs a client the user started. Returns pages_url and the outbox file.",
     {"hub": {"type": "string", "enum": ["fake", "model"]}, "bise": {"type": "string", "description": "a bise with ambient-core (default: found)"},
      "connectors": {"type": "boolean", "description": "the user's REAL connectors: refused unless real_accounts_approved_by_user"},
      "computer": {"type": "boolean", "description": "the computer plugin (the user's browser): refused unless real_accounts_approved_by_user"},
      "real_accounts_approved_by_user": {"type": "string", "description": "the id of the user's own message asking for this one run on his real accounts; never set it on your own"}}, []),
    ("stop", "Stop the throwaway hub (its own pids only).", {}, []),
    ("world", "bise desktop's throwaway world (world.py): one isolated HOME under ~/.bise/gate with bise's home hub and 2-3 projects (telemetry, shop, docs), each its own fake-provider hub, seeded by its fake main: agents in worktrees, a committed diff ready to merge, an agent at work in a dirty worktree, cards with options, a merge question, a blocked agent, an artifact, a message between two agents, a question main answers for him, a tool approval he refused with a note. do: up (projects 2|3, bise?, root?; takes the heavy lock only to compile stale helpers), state (each hub's agents, commits, diffs, cards, socket), say (project or 'bise', text: words to that project's fake main; [[bash: ...]] scripts it), feature (project, name: a real approval card), down (always, when done: stops every hub by pid).",
     {"do": {"type": "string", "enum": ["up", "state", "say", "feature", "down"]}, "projects": {"type": "integer"}, "bise": {"type": "string"}, "root": {"type": "string"},
      "project": {"type": "string"}, "text": {"type": "string"}, "name": {"type": "string"}}, ["do"]),
    ("page_publish", "On the throwaway hub, main publishes a page (sb page publish): `file` or amb-kit's weekly-update example, `edit` {old: new} for a v2, `done` note ids, `answers` {note id: text}. Returns its url.",
     {"file": {"type": "string"}, "id": {"type": "string"}, "title": {"type": "string"}, "edit": {"type": "object"}, "done": {"type": "array", "items": {"type": "string"}}, "answers": {"type": "object"}}, []),
    ("page_notes", "Draft notes on a page through its API (as notes.js would), optionally send them to the page's agent. A note: {block, kind: note|keep|drop|unsure|edit|voice|pin, quote?, text?, before?, after?}.",
     {"id": {"type": "string"}, "notes": {"type": "array"}, "send": {"type": "boolean"}}, ["id", "notes"]),
    ("page_drive", "A page in a throwaway headless Chrome (its own profile, no logins, local URLs only; never the user's browser): steps [{eval, key, mouse: [x,y], click, type, wait, shot}] run once per color scheme, shots at 2x. The page id on the throwaway hub, or a local url.",
     {"id": {"type": "string"}, "url": {"type": "string"}, "steps": {"type": "array"}, "schemes": {"type": "array", "items": {"type": "string"}}, "name": {"type": "string"}}, []),
    ("page_meta", "A page's meta: versions, state, notes with their status (draft, sent, done, answered).", {"id": {"type": "string"}}, ["id"]),
    ("page_fixture", "ambient's fixture: the weekly-update page at v1, four notes sent (a note, a voice note, an edit, an unsure on a block v2 renames: moved), then v2 marking one done and answering one. Returns both urls and the notes.",
     {"id": {"type": "string"}}, []),
    ("outbox", "What the QA hub's main wrote to the fake accounts (drafts, sends, Slack posts, Linear issues, calendar events, GitHub comments): QA hubs only have fake Gmail, Slack, Linear, calendar, GitHub, HN, Reddit, X and Bluesky accounts with fixture data, never the user's.", {}, []),
    ("ask", "Asks to main on the running throwaway hub (launch {hub: 'model'} first), one after the other, through a bise ambient-core child like the desktop app's (capsule: false = as the TUI): main's words, their length, the time until all idle, the pages made or updated, the cards.",
     {"texts": {"type": "array", "items": {"type": "string"}}, "capsule": {"type": "boolean"}, "timeout": {"type": "integer"}}, ["texts"]),
    ("tick", "The fake launch's next batch of HN/Reddit/X/Bluesky comments comes in now, and its points, rank and likes move (they also come every 30 min of hub time).", {"n": {"type": "integer"}}, []),
    ("run", "A scripted product run, measured the same way every time: a model hub (the user's model and keys, costs credits) with the fake accounts only; the scenario's ask through a bise ambient-core child; times the page's first appearance, v1, then 3 scripted notes, send, v2 and the notes' outcomes; the outbox (no send on 'don't send'); main's line length. Returns the one-screen report and its folder (run.json, report.txt, page bodies). Takes minutes.",
     {"scenario": {"type": "string", "enum": sorted(qa.SCENARIOS)},
      "timeout": {"type": "integer"}, "keep": {"type": "boolean"}, "require": {"type": "array", "items": {"type": "string"}, "description": "commits the bise tree must have, else refused"}}, ["scenario"]),
]


def image_block(path, max_px=1800):
    """The PNG as an MCP image, made smaller (sips, no copy kept) when big."""
    src = path
    tmp = None
    try:
        if os.path.getsize(path) > 900_000:
            tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
            subprocess.run(["sips", "-Z", str(max_px), path, "--out", tmp], capture_output=True, check=True)
            src = tmp
        with open(src, "rb") as f:
            return {"type": "image", "data": base64.b64encode(f.read()).decode(), "mimeType": "image/png"}
    except (OSError, subprocess.CalledProcessError):
        return None
    finally:
        if tmp:
            try:
                os.unlink(tmp)
            except OSError:
                pass


def run(name, a):
    images = []
    if name == "launch":
        r = qa.launch(a.get("hub", "fake"), a.get("bise"), a.get("connectors", False), a.get("computer", False),
                      a.get("real_accounts_approved_by_user", ""))
    elif name == "stop":
        r = qa.stop()
    elif name == "world":
        import world
        d = a["do"]
        if d == "up":
            r = world.up(a.get("projects", 3), a.get("bise"), a.get("root"))
        elif d == "say":
            r = world.say(a["project"], a["text"])
        elif d == "feature":
            r = world.feature(a["project"], a["name"])
        elif d in ("down", "state"):
            r = getattr(world, d)()
        else:
            raise qa.QAError("world: do up|state|say|feature|down")
    elif name == "page_publish":
        r = qa.page_publish(a.get("file"), a.get("id", "weekly-update"), a.get("title", "weekly update"), a.get("done"), a.get("answers"), a.get("edit"))
    elif name == "page_notes":
        r = qa.page_notes(a["id"], a["notes"], a.get("send", False))
    elif name == "page_drive":
        r = qa.page_drive(a.get("id"), a.get("url"), a.get("steps"), a.get("schemes") or ["light", "dark"], a.get("name"))
        images += [x["shot"] for run in r["runs"] for x in run.get("results", []) if x.get("shot")][:2]
    elif name == "page_meta":
        r = qa.page_meta(a["id"])
    elif name == "page_fixture":
        r = qa.page_fixture(a.get("id", "weekly-update"))
    elif name == "ask":
        full = qa.ask(a["texts"], a.get("capsule", True) is not False, int(a.get("timeout") or 600))
        r = {"report": full["report"], "file": full["file"], "asks": full["asks"]}
    elif name == "tick":
        r = qa.tick(int(a.get("n") or 1))
    elif name == "outbox":
        r = qa.outbox()
    elif name == "run":
        full = qa.run(a["scenario"], int(a.get("timeout") or 900), bool(a.get("keep")), require=a.get("require"))
        r = {"report": full["report"], "dir": full["dir"], "fails": full["fails"], "t": full["t"]}
    else:
        raise qa.QAError("unknown tool %s" % name)
    content = [{"type": "text", "text": json.dumps(r, ensure_ascii=False)}]
    for p in images:
        b = image_block(p)
        if b:
            content.append(b)
    return content


def reply(id_, result=None, error=None):
    m = {"jsonrpc": "2.0", "id": id_}
    if error is not None:
        m["error"] = error
    else:
        m["result"] = result
    sys.stdout.write(json.dumps(m) + "\n")
    sys.stdout.flush()


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except ValueError:
            continue
        method, id_ = msg.get("method"), msg.get("id")
        if id_ is None:
            continue   # a notification (initialized, cancelled)
        if method == "initialize":
            reply(id_, {"protocolVersion": msg.get("params", {}).get("protocolVersion", "2025-06-18"),
                        "capabilities": {"tools": {}}, "serverInfo": {"name": "ambient-qa", "version": "0.2.0"}})
        elif method == "ping":
            reply(id_, {})
        elif method == "tools/list":
            reply(id_, {"tools": [{"name": n, "description": d, "inputSchema": {"type": "object", "properties": p, "required": r}} for n, d, p, r in TOOLS]})
        elif method == "tools/call":
            p = msg.get("params", {})
            try:
                reply(id_, {"content": run(p.get("name"), p.get("arguments") or {})})
            except qa.QAError as e:
                reply(id_, {"content": [{"type": "text", "text": "ambient-qa: %s" % e}], "isError": True})
            except Exception as e:   # noqa: BLE001 - one tool's bug must not kill the server
                reply(id_, {"content": [{"type": "text", "text": "ambient-qa: %s\n%s" % (e, traceback.format_exc()[-1500:])}], "isError": True})
        else:
            reply(id_, error={"code": -32601, "message": "no method %s" % method})


if __name__ == "__main__":
    main()
