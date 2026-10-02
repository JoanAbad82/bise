"""The draft guard (ambient-lead m_5423, docs/ambient-roadmap.md A): a
draft-making connector call needs no card, but not before the user's word
on the page it comes from.

A real hub in auto (the checker off), the scripted model, a temp HOME and
BISE_HOME, and amb-tools' fake Gmail (plugins/ambient-qa/fake-accounts,
fixture data, its writes go to a throwaway outbox file): never the user's
accounts. main publishes a review page, then calls tools.gmail.create_draft:
a card says it wants drafts in Gmail before the review, and the draft is
not written. The user sends an approve note on the page; the same call
then runs with no card and the draft reaches the fake outbox.

Run: python3 -u tests/draft_guard_e2e.py
"""
import http.client
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import e2e  # noqa: E402
from e2e import EXE, check  # noqa: E402

FAKE = os.path.join(HERE, "..", "plugins", "ambient-qa", "fake-accounts", "fake_accounts.py")
PAGE = (
    '<section data-kit="review" data-id="replies"><ol>'
    '<li data-id="r1"><p>Nina asks if the Safari fix ships today</p></li>'
    '</ol></section>\n'
    '<section data-kit="email" data-id="mail" data-to="Gmail · reply to Nina">'
    '<p data-field="to">nina@acme.test</p><p data-field="subject">the Safari fix</p><p>yes, today.</p></section>\n'
)
DRAFT = ("[[run_typescript: async function main() { return await tools.gmail.create_draft("
         "{to: 'nina@acme.test', subject: 'the Safari fix', body: 'yes, today.'}); }]]")


def request(port, method, path, body=None, headers=None):
    c = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    h = {"Host": "127.0.0.1:%d" % port}
    h.update(headers or {})
    data = json.dumps(body).encode() if body is not None else None
    if data is not None:
        h["Content-Type"] = "application/json"
    c.request(method, path, body=data, headers=h)
    r = c.getresponse()
    out = (r.status, r.read().decode())
    c.close()
    return out


def install_fake_gmail(ws):
    """amb-tools' fake Gmail as a workspace plugin (qa.py's install_fake_accounts, one service)."""
    d = os.path.join(ws, ".agents", "plugins", "gmail")
    os.makedirs(d)
    json.dump({"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "name": "gmail", "version": "0.1.0",
               "description": "gmail for this workspace: a fake QA account with fixture data"}, open(os.path.join(d, "plugin.json"), "w"))
    json.dump({"$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
               "mcpServers": {"gmail": {"type": "stdio", "command": "python3", "args": ["-B", os.path.abspath(FAKE), "gmail"]}}},
              open(os.path.join(d, "mcp.json"), "w"))
    with open(os.path.join(ws, ".git", "info", "exclude"), "a") as f:
        f.write("/.agents/\n")


def drafts(outbox):
    try:
        return [json.loads(l) for l in open(outbox) if '"create_draft"' in l]
    except FileNotFoundError:
        return []


def main():
    if not os.path.exists(EXE):
        sys.exit("build first: cd rust && cargo build")
    E = e2e.Env()
    home, bise = os.path.join(E.tmp, "home"), os.path.join(E.tmp, "bise")
    os.makedirs(home)
    os.makedirs(bise, exist_ok=True)
    with open(os.path.join(bise, "config.toml"), "w") as f:
        f.write('approvals = "auto"\n[roles]\nclassify = "off"\n')
    outbox = os.path.join(E.tmp, "outbox.jsonl")
    E.env.update(HOME=home, BISE_HOME=bise, XDG_STATE_HOME=os.path.join(home, "state"), FAKE_ACCOUNTS_OUTBOX=outbox)
    E.env.pop("BISE_APPROVALS", None)
    # run_typescript needs the V8 engine: a dev tree has none at its root,
    # so a run from a shell without BEND_JSRT_BIN (a launchd job, a scratch
    # worktree) failed every draft with 'program error (exit 127)' and no
    # card; take the built one bins.sh names
    if not os.path.exists(E.env.get("BEND_JSRT_BIN", "")):
        out = subprocess.run([os.path.join(e2e.ROOT, "scripts", "bins.sh"), "path", "bend-jsrt"],
                             capture_output=True, text=True).stdout.strip().splitlines()
        if out and os.path.exists(out[-1]):
            E.env["BEND_JSRT_BIN"] = out[-1]
    install_fake_gmail(E.ws)
    ok = True
    c = None
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        page = os.path.join(E.tmp, "page.html")
        open(page, "w").write(PAGE)
        c.say("[[bash: sb page publish %s --id replies --title replies]]" % page)
        c.wait_line("main", "published replies v1", 90)
        c.wait_idle("main")

        # before his word: a card, nothing written
        c.say(DRAFT)
        guard = lambda: [k for k in c.cards() if "wants to put drafts in Gmail before you reviewed" in json.dumps(k)]
        failed = lambda: [l for l in c.lines("main") if "tool run_typescript failed" in l]
        c.wait(lambda: guard() or failed(), 90, "the guard's card")
        check(not failed(), "run_typescript itself failed (no V8 engine? BEND_JSRT_BIN=%r): %r"
              % (E.env.get("BEND_JSRT_BIN"), failed()[:1]))
        check('before you reviewed "replies"' in guard()[0]["text"], "the card names the page: %r" % guard()[0])
        check(drafts(outbox) == [], "no draft written before his word")
        c.say("/interrupt main")
        c.wait_idle("main")
        check(drafts(outbox) == [], "still no draft")

        # his word on the page: an approve note, sent
        port = int(open(os.path.join(E.state, "pages.port")).read().strip())
        body = request(port, "GET", "/p/replies")[1]
        token = body.split('<meta name="bise-token" content="')[1].split('"')[0]
        hdr = {"Origin": "http://127.0.0.1:%d" % port, "X-Bise-Token": token}
        check(request(port, "POST", "/api/p/replies/notes", {"notes": [{"block": "r1", "kind": "approve"}]}, hdr)[0] == 200, "the approve note")
        check(request(port, "POST", "/api/p/replies/send", {}, hdr)[0] == 200, "sent")
        c.wait_line("main", "you sent 1 note", 30)
        c.wait_idle("main")

        # after it: the same call runs, no new card
        n_cards = len(guard())
        c.say(DRAFT)
        c.wait(lambda: drafts(outbox), 90, "the draft in the fake outbox")
        c.wait_idle("main")
        check(len(guard()) <= n_cards, "no new guard card after his word")
        d = drafts(outbox)[0]
        check("nina@acme.test" in json.dumps(d), "the draft as asked: %r" % d)
    except AssertionError as e:
        print("FAIL", e)
        if c and os.environ.get("GUARD_DEBUG"):
            print("\n".join(c.lines("main")[-40:]))
            print(c.cards())
        ok = False
    finally:
        E.close()
    print("draft_guard_e2e:", "ok" if ok else "FAILED")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
