#!/usr/bin/env python3
"""The ChatGPT plan route carries the prompt cache's routing key (issue #18).

Every bise request starts with the same tools for every user; without a
`prompt_cache_key` OpenAI routes every bise session by that one prefix and
its cache misses (Codex sends its session's key on every call). A real hub
on the fake provider ($FAKE_BODIES keeps each whole request body), the
model chatgpt/gpt-6.1-sol (its key_command and base_url in the test's
config.toml, the built-in catalog for the rest): main spawns t1, and
- every agent call of main and t1 carries a `prompt_cache_key`;
- each agent keeps one key for its session, and the two keys differ
  (one key per session, never one shared by every agent).
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e

fails = []


def check(ok, what):
    print(("ok   " if ok else "FAIL ") + what, flush=True)
    if not ok:
        fails.append(what)


def agent_of(body):
    for it in body.get("input", []):
        if it.get("role") in ("developer", "system"):
            t = json.dumps(it.get("content"))
            m = re.search(r"# Your role: (?:task `([a-z0-9-]+)`|`(main)`)", t)
            return (m.group(1) or m.group(2)) if m else None
    return None


E = None
try:
    tmp = e2e.short_tmp()
    bodies = os.path.join(tmp, "chatgpt-cache-key-%d.jsonl" % os.getpid())
    if os.path.exists(bodies):
        os.remove(bodies)
    E = e2e.Env(fake_env={"FAKE_BODIES": bodies})
    url = E.env["BEND_PROVIDER_URL"].replace("/chat/completions", "/responses")
    home = os.path.join(E.tmp, "bise-home")
    os.makedirs(home)
    with open(os.path.join(home, "config.toml"), "w") as f:
        f.write('[providers.chatgpt]\nkey_command = "echo fake-plan-token"\nbase_url = "%s"\n' % url.rsplit("/", 1)[0])
    E.env.update(BEND_PROVIDER_URL=url, BEND_MODEL="chatgpt/gpt-6.1-sol", BISE_HOME=home)
    c = E.start_hub()
    c.wait_status("main", "idle", 90)
    c.say('[[bash: sb spawn t1 --objective "write the file {{bash: echo hi > t1.txt && echo wrote}}"]]')
    c.wait(lambda: c.agent("t1") is not None, 60, "t1")
    c.wait_idle("main", "t1", timeout=180)
    keys = {}
    for line in open(bodies):
        b = json.loads(line)["body"]
        a = agent_of(b)
        if a:
            keys.setdefault(a, []).append(b.get("prompt_cache_key"))
    print("keys:", {a: sorted(set(map(str, ks))) for a, ks in keys.items()})
    for a in ("main", "t1"):
        ks = keys.get(a, [])
        check(ks and all(isinstance(k, str) and k.startswith("bise-") for k in ks),
              "%s: every call carries a prompt_cache_key (%d calls)" % (a, len(ks)))
        check(len(set(ks)) == 1, "%s: one key for its whole session" % a)
    check(set(keys.get("main", [])).isdisjoint(keys.get("t1", [])), "main and t1 send different keys")
finally:
    if E:
        E.close()

if fails:
    sys.exit("FAIL chatgpt_cache_key_e2e: %d" % len(fails))
print("PASS chatgpt_cache_key_e2e")
