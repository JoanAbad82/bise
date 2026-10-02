#!/usr/bin/env python3
"""ambient-qa's MCP server (stdio, JSON-RPC 2.0, one message per line).
The tools are qa.py's functions; a PNG comes back as an image block (made
smaller with sips when big) next to its path."""
import base64
import json
import os
import subprocess
import sys
import tempfile
import traceback

sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
import qa  # noqa: E402

EV = {"type": "object", "description": "a contract event (docs/ambient-app.md §4): {ev: ..., ...}"}
TOOLS = [
    ("launch", "Start the real bise ambient.app in QA mode. hub=fake (default): a throwaway scripted hub, main answers 'ack: <your words>'; hub=real: the real workspace, read-only (nothing is ever sent). Builds the app at its one path if its sources changed (refused while the user's own app runs, unless force_build).",
     {"hub": {"type": "string", "enum": ["fake", "model", "real"]}, "workspace": {"type": "string"}, "bise": {"type": "string", "description": "a bise with ambient-core (default: found)"},
      "backdrop": {"type": "string", "description": "dark, bright, busy, none, or a picture file"}, "force_build": {"type": "boolean"}, "restart": {"type": "boolean"},
      "connectors": {"type": "boolean", "description": "the user's REAL connectors: refused unless real_accounts_approved_by_user"},
      "computer": {"type": "boolean", "description": "the computer plugin (the user's browser): refused unless real_accounts_approved_by_user"},
      "real_accounts_approved_by_user": {"type": "string", "description": "the id of the user's own message asking for this one run on his real accounts; never set it on your own"}}, []),
    ("stop", "Quit the QA app and its fake hub.", {"keep_hub": {"type": "boolean"}}, []),
    ("inject", "An event into the app as if real: a core event (hub, state, phase, heard, level, main, word, sent, error, page) or an app/web one (app_fn, app_key, app_perm, app_shot, app_hidden, app_reduce_motion, app_settings, ui_*).",
     {"ev": EV}, ["ev"]),
    ("fn", "The fn key, through the app's real key path: down (talk starts, the glow, the fake shot), up (send), tap, double (hands-free), cancel.",
     {"state": {"type": "string", "enum": ["down", "up", "tap", "double", "cancel"]}, "key": {"type": "string", "enum": ["fn", "right_option"]}}, ["state"]),
    ("key", "fn + a key, through the app's real key path: space 1-9 i 0 o . enter esc.", {"k": {"type": "string"}}, ["k"]),
    ("say", "Hold fn, say the words (heard partials, a fake voice level, no mic), let go: they go to main on the fake hub; waits for main's answer, then 'speaks' it (phase speaking, word by word). Returns main's text.",
     {"text": {"type": "string"}, "per_word_ms": {"type": "number"}, "wait_answer": {"type": "boolean"}}, ["text"]),
    ("snapshot", "PNGs of the app now: panel (the capsule and its needs-you note on the backdrop, glass composited), screen (the main screen: backdrop, edge glow and corners, the capsule), web (the web view alone), both (panel + screen).",
     {"what": {"type": "string", "enum": ["both", "panel", "screen", "web", "all"]}, "backdrop": {"type": "string"}, "name": {"type": "string"}, "image": {"type": "boolean", "description": "return the panel image inline (default true)"}}, []),
    ("state", "The web UI's model and view (what the capsule shows, its size, the orb's pose, the words) and the app's side (panel frame, shape, hidden, glow).", {}, []),
    ("events", "The last n events in and out (core>app, qa>app, qa>page, page>app, app>core...), levels left out unless asked.",
     {"n": {"type": "integer"}, "levels": {"type": "boolean"}}, []),
    ("scenes", "Play every SPEC §2 state (fakecore.js's scenes plus the extra ones) in the real app, shoot each moment, and return a contact sheet per backdrop. `only`: scene ids; `at`: ms to shoot at instead of the automatic moments.",
     {"only": {"type": "array", "items": {"type": "string"}}, "backdrops": {"type": "array", "items": {"type": "string"}}, "at": {"type": "array", "items": {"type": "number"}},
      "what": {"type": "string", "enum": ["both", "panel", "screen"]}, "image": {"type": "boolean"},
      "reduce": {"type": "boolean", "description": "reduced motion on for every scene"}, "tokens": {"type": "string", "description": "a tokens file (.css/.json) on the capsule"},
      "screen_h": {"type": "number", "description": "the screen shots' top in points (default 300, 0 = the whole screen)"}}, []),
    ("list_scenes", "The scene ids, their SPEC §2 states and labels.", {}, []),
    ("frames", "A strip of frames of one scene for the motion (the open/close spring, the hold-fn lean-in, the needs-you edge): a panel PNG every `every` ms over `span` [from, to] ms, and one sheet.",
     {"scene": {"type": "string"}, "every": {"type": "number"}, "span": {"type": "array", "items": {"type": "number"}}, "backdrop": {"type": "string"}, "reduce": {"type": "boolean"}, "tokens": {"type": "string"}}, ["scene"]),
    ("look", "The app's look for what follows: a tokens file (.css as is, .json {name: value} as :root --name; '' = the app's own) and/or reduced motion on/off.",
     {"tokens": {"type": "string"}, "reduce": {"type": "boolean"}}, []),
    ("page_publish", "On the throwaway hub, main publishes a page (sb page publish): `file` or amb-kit's weekly-update example, `edit` {old: new} for a v2, `done` note ids, `answers` {note id: text}. Returns its url (open it in Chrome with the computer plugin).",
     {"file": {"type": "string"}, "id": {"type": "string"}, "title": {"type": "string"}, "edit": {"type": "object"}, "done": {"type": "array", "items": {"type": "string"}}, "answers": {"type": "object"}}, []),
    ("page_notes", "Draft notes on a page through its API (as notes.js would), optionally send them to the page's agent. A note: {block, kind: note|keep|drop|unsure|edit|voice|pin, quote?, text?, before?, after?}.",
     {"id": {"type": "string"}, "notes": {"type": "array"}, "send": {"type": "boolean"}}, ["id", "notes"]),
    ("page_drive", "A page in a throwaway headless Chrome (its own profile, no logins, local URLs only; never the user's browser): steps [{eval, key, mouse: [x,y], click, type, wait, shot}] run once per color scheme, shots at 2x. The page id on the throwaway hub, or a local url.",
     {"id": {"type": "string"}, "url": {"type": "string"}, "steps": {"type": "array"}, "schemes": {"type": "array", "items": {"type": "string"}}, "name": {"type": "string"}}, []),
    ("page_meta", "A page's meta: versions, state, notes with their status (draft, sent, done, answered).", {"id": {"type": "string"}}, ["id"]),
    ("page_fixture", "ambient's fixture: the weekly-update page at v1, four notes sent (a note, a voice note, an edit, an unsure on a block v2 renames: moved), then v2 marking one done and answering one. Returns both urls and the notes.",
     {"id": {"type": "string"}}, []),
    ("play", "A custom timeline into the app: events [[ms, ev], ...], shots [{at: ms, what}] (the core is muted while it plays). Files are named <name>@<s>s.",
     {"events": {"type": "array"}, "shots": {"type": "array"}, "name": {"type": "string"}, "backdrop": {"type": "string"}}, ["events"]),
    ("outbox", "What the QA hub's main wrote to the fake accounts (drafts, sends, Slack posts, Linear issues, calendar events, GitHub comments): QA hubs only have fake Gmail, Slack, Linear, calendar, GitHub and HN accounts with fixture data, never the user's.", {}, []),
    ("reset", "The pages start over (the model back to its start), the panel shown.", {}, []),
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
        r = qa.launch(a.get("hub", "fake"), a.get("workspace"), a.get("bise"), None, a.get("backdrop", "dark"), a.get("force_build", False), a.get("restart", False),
                      a.get("connectors", False), a.get("computer", False), a.get("real_accounts_approved_by_user", ""))
    elif name == "stop":
        r = qa.stop(a.get("keep_hub", False))
    elif name == "inject":
        r = qa.inject(a["ev"])
    elif name == "fn":
        r = qa.fn(a["state"], a.get("key", "fn"))
    elif name == "key":
        r = qa.key(a["k"])
    elif name == "say":
        r = qa.say(a["text"], a.get("per_word_ms", 240), a.get("wait_answer", True))
    elif name == "snapshot":
        r = qa.snapshot(a.get("what", "both"), a.get("backdrop"), a.get("name"))
        if a.get("image", True):
            for k in ("panel", "web", "screen"):
                if r.get(k):
                    images.append(r[k])
                    break
    elif name == "state":
        r = qa.state()
    elif name == "events":
        r = qa.events(a.get("n", 50), a.get("levels", False))
    elif name == "scenes":
        r = qa.scenes(a.get("only"), a.get("backdrops") or ["dark"], None, a.get("at"), a.get("what", "both"),
                      reduce=a.get("reduce", False), tokens=a.get("tokens"), screen_h=a.get("screen_h", 300))
        if a.get("image", True) and r["sheets"]:
            images.append(r["sheets"][0])
        r = {"dir": r["dir"], "sheets": r["sheets"],
             "scenes": [{"id": s["id"], "backdrop": s["backdrop"], "shots": [sh.get("panel") or sh.get("screen") for sh in s["shots"]]} for s in r["scenes"]]}
    elif name == "frames":
        r = qa.scenes(backdrops=[a.get("backdrop", "dark")], frames=a["scene"], every=a.get("every", 80), span=a.get("span"),
                      reduce=a.get("reduce", False), tokens=a.get("tokens"))
        if r["sheets"]:
            images.append(r["sheets"][0])
        r = {"dir": r["dir"], "sheets": r["sheets"], "frames": [sh.get("panel") for s in r["scenes"] for sh in s["shots"]]}
    elif name == "look":
        r = qa.look(a.get("tokens"), a.get("reduce"))
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
    elif name == "list_scenes":
        sc, _ = qa.all_scenes()
        r = [{"id": s["id"], "spec": s["spec"], "label": s["label"]} for s in sc]
    elif name == "play":
        r = qa.play(a["events"], a.get("shots", []), a.get("name", "play"), a.get("backdrop"))
    elif name == "outbox":
        r = qa.outbox()
    elif name == "reset":
        r = qa.reset()
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
                        "capabilities": {"tools": {}}, "serverInfo": {"name": "ambient-qa", "version": "0.1.0"}})
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
