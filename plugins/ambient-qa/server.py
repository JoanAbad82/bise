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
      "real_accounts_approved_by_user": {"type": "string", "description": "the id of the user's own message asking for this one run on his real accounts; never set it on your own"},
      "no_app": {"type": "boolean", "description": "the throwaway hub (fake or model), its page server and the fake accounts only: never builds or opens the app; returns pages_url and the outbox file"}}, []),
    ("stop", "Quit the QA app and its fake hub.", {"keep_hub": {"type": "boolean"}}, []),
    ("inject", "An event into the app as if real: a core event (hub, state, phase, heard, level, main, word, sent, error, page) or an app/web one (app_fn, app_key, app_perm, app_shot, app_hidden, app_reduce_motion, app_settings, ui_*).",
     {"ev": EV}, ["ev"]),
    ("fn", "The fn key, through the app's real key path: down (talk starts, the glow, the fake shot), up (send), tap, double (hands-free), cancel.",
     {"state": {"type": "string", "enum": ["down", "up", "tap", "double", "cancel"]}, "key": {"type": "string", "enum": ["fn", "right_option"]}}, ["state"]),
    ("key", "fn + a key, through the app's real key path: space 1-9 i 0 o . enter esc.", {"k": {"type": "string"}}, ["k"]),
    ("click", "One real mouse click on a capsule element (CSS selector): a CGEvent left down/up at its screen point, posted to the QA app's own pid (never the HID tap: his pointer never moves), with bise not frontmost. Returns what each layer saw: window_at_point (the window server's top window), panel mouse settings, hit_view, appkit events, dom events (pointerdown/click and on what), clicked. Can't catch: another app's window above the panel taking a real click (window_at_point says it), hover under a moving pointer.",
     {"selector": {"type": "string"}, "route": {"type": "string", "enum": ["appkit", "point", "window"], "description": "appkit (default): the routed event into the app queue; point/window: a CGEvent posted to the pid (AppKit gives it no window)"}, "frontmost": {"type": "boolean", "description": "leave bise active (default: not frontmost)"}}, ["selector"]),
    ("fn_hold_closed", "fn held from rest (capsule closed, bise not frontmost) through the real key path (KeyMachine via Keys.qaEvent; the QA app has no tap, never his fn): the pearl listens within within_ms, the fake voice's words reach the core on release, main's line shows; variants launch, fold (opened then folded by itself), hide (fn + .); then a tap must do nothing.",
     {"variants": {"type": "array", "items": {"type": "string", "enum": ["launch", "fold", "hide"]}}, "words": {"type": "string"}, "within_ms": {"type": "integer"}}, []),
    ("rest", "The capsule back to rest (folded into the icon) and bise not the active app.", {}, []),
    ("hover", "The pointer over an element: mouseMoved events at its point into the QA app's queue for ms (his pointer never moves); over = the page saw it. Can't drive tracking areas (cursor shape).",
     {"selector": {"type": "string"}, "ms": {"type": "integer"}}, ["selector"]),
    ("alpha", "The panel's own pixels with alpha (this window alone, no shadow) as a PNG, and the verdict: the pearl's 4 corners and a ring `ring` px outside its disc at alpha 0, and `outside` px outside the glass at alpha 0 (a click there reaches the app below).",
     {"name": {"type": "string"}, "ring": {"type": "number"}, "outside": {"type": "number"}}, []),
    ("clicks", "Every button the capsule shows in one state, one real click each (the state set again from rest before each, bise not frontmost): per button its label, whether the page got the click, the commands that left (exactly one expected), a text cursor flagged. state: card (a question with a page link), drafts (a batch: review, send all), settings, or a core state event; open: fn + this key opens the view (default: i for cards, , for settings). Aims at round 9's [data-qa] targets.",
     {"state": {"type": ["string", "object"]}, "open": {"type": "string"}, "selector": {"type": "string"}, "then": {"type": "string", "description": "click the first target whose data-qa starts with this before listing (card-: a card's own bar from fn i)"}}, []),
    ("keys", "Real keys into the QA app's panel: CGEvent key down/up posted to the QA app's pid (never the HID tap: nothing reaches his front app). specs: 'up', 'down', 'return', 'tab', 'esc', 'cmd+return', 'cmd+1'..'cmd+9', 'type:<words>'. Returns the panel's key state, what AppKit saw and the page's keydown/input events.",
     {"specs": {"type": "array", "items": {"type": "string"}}, "gap_ms": {"type": "integer"}}, ["specs"]),
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
    ("outbox", "What the QA hub's main wrote to the fake accounts (drafts, sends, Slack posts, Linear issues, calendar events, GitHub comments): QA hubs only have fake Gmail, Slack, Linear, calendar, GitHub, HN, Reddit, X and Bluesky accounts with fixture data, never the user's.", {}, []),
    ("ask", "Asks to main on the running throwaway hub (launch {hub: 'model', no_app: true} first), one after the other, through a core like the capsule's (capsule: false = as the TUI): main's words to the capsule, their length, the time until all idle, the pages made or updated, the cards.",
     {"texts": {"type": "array", "items": {"type": "string"}}, "capsule": {"type": "boolean"}, "timeout": {"type": "integer"}}, ["texts"]),
    ("tick", "The fake launch's next batch of HN/Reddit/X/Bluesky comments comes in now, and its points, rank and likes move (they also come every 30 min of hub time).", {"n": {"type": "integer"}}, []),
    ("reset", "The pages start over (the model back to its start), the panel shown.", {}, []),
    ("run", "A scripted product run, measured the same way every time: a model hub (the user's model and keys, costs credits) with the fake accounts only; the scenario's ask through the core like the capsule's; times the page's first appearance, v1, then 3 scripted notes, send, v2 and the notes' outcomes; the outbox (no send on 'don't send'); main's capsule line length. Returns the one-screen report and its folder (run.json, report.txt, page bodies). Takes minutes.",
     {"scenario": {"type": "string", "enum": sorted(qa.SCENARIOS)}, "headless": {"type": "boolean", "description": "no app: a bise ambient-core child (text only: no mic, no voice)"},
      "timeout": {"type": "integer"}, "keep": {"type": "boolean"}, "require": {"type": "array", "items": {"type": "string"}, "description": "commits the bise tree must have, else refused"}}, ["scenario"]),
    ("menubar", "The menu-bar item (the 18 px pearl) in each SPEC §0 state: still, work, need (+count), away ☾, done, fail ▲, listen, put there through amb-mac's StatusItem API; its own composed image at 1x and 2x, transparent and on a light and a dark menu-bar strip, and a sheet (returned as an image). frames > 1: successive frames of the moving moods.",
     {"states": {"type": "array", "items": {"type": "string"}}, "frames": {"type": "integer"}, "count": {"type": "integer"}}, []),
    ("pearl", "Every pearl frame amb-mac plays, per mood (the bundle's <mood>-NN.png), at 1x and 2x.", {}, []),
    ("menu", "The menu-bar menu as its rows, in order (--qa has no menu-bar item): kind (header, card, page, watch, stop, talk, toggle, settings, quit, separator), title, keys, ref (card id, page URL, timer id), enabled, indent.", {}, []),
    ("menu_click", "Click a menu row as the real one: stop (ref: the timer id) stops that watch, page or watch (ref: its URL) is logged as opened (never the user's browser), card (ref: its id) opens bise on that card.",
     {"kind": {"type": "string", "enum": ["stop", "page", "watch", "card"]}, "ref": {"type": ["string", "integer"]}}, ["kind", "ref"]),
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
                      a.get("connectors", False), a.get("computer", False), a.get("real_accounts_approved_by_user", ""), bool(a.get("no_app")))
    elif name == "stop":
        r = qa.stop(a.get("keep_hub", False))
    elif name == "inject":
        r = qa.inject(a["ev"])
    elif name == "fn":
        r = qa.fn(a["state"], a.get("key", "fn"))
    elif name == "key":
        r = qa.key(a["k"])
    elif name == "click":
        r = qa.click(a["selector"], a.get("route", "appkit"), not a.get("frontmost", False))
    elif name == "fn_hold_closed":
        r = qa.fn_hold_closed(tuple(a.get("variants") or ("launch", "fold", "hide")), a.get("words", "what is on my plate today"), within_ms=a.get("within_ms", 300))
    elif name == "rest":
        r = qa.rest()
    elif name == "hover":
        r = qa.hover(a["selector"], a.get("ms", 1000))
    elif name == "alpha":
        r = qa.alpha(a.get("name", "alpha"), ring=a.get("ring", 6), outside=a.get("outside", 10))
        if r.get("png"):
            images.append(r["png"])
    elif name == "clicks":
        o = a.get("open", "auto")
        r = qa.clicks(a.get("state", "card"), None if o in (None, "", "none") else o, a.get("selector"), then=a.get("then"))
    elif name == "keys":
        r = qa.keys(*a["specs"], gap_ms=a.get("gap_ms", 60))
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
    elif name == "ask":
        full = qa.ask(a["texts"], a.get("capsule", True) is not False, int(a.get("timeout") or 600))
        r = {"report": full["report"], "file": full["file"], "asks": full["asks"]}
    elif name == "tick":
        r = qa.tick(int(a.get("n") or 1))
    elif name == "outbox":
        r = qa.outbox()
    elif name == "reset":
        r = qa.reset()
    elif name == "menubar":
        r = qa.menubar(a.get("states"), int(a.get("frames") or 1), int(a.get("count") or 2))
        if r.get("sheet"):
            images.append(r["sheet"])
    elif name == "pearl":
        r = qa.pearl()
    elif name == "menu":
        r = qa.menu()
    elif name == "menu_click":
        r = qa.menu_click(a["kind"], a.get("ref"))
    elif name == "run":
        full = qa.run(a["scenario"], bool(a.get("headless")), int(a.get("timeout") or 900), bool(a.get("keep")), require=a.get("require"))
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
