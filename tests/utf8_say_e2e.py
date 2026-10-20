#!/usr/bin/env python3
"""issue 36: his message to an agent keeps every multi-byte char.

The REPL reads the hub's lines 4 KB a recv (bend/runtime/repl-core.bend);
it decoded each recv on its own, so a char a recv boundary cut reached the
model as U+FFFD. It decodes bytes across recvs now (bend/core/utf8.bend).
A real hub and REPL, the fake provider: he sends main 10 KB of 'é─😀'
(9 bytes a round, so the boundaries fall inside chars); the provider gets
it unchanged (its log keeps his message's first 3000 chars: ~9 KB, two boundaries).

Run: python3 -u tests/utf8_say_e2e.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from e2e import Env, check  # noqa: E402

TEXT = "é─😀" * (10_000 // 9)


def main():
    E = Env()
    ok = False
    try:
        c = E.start_hub()
        c.wait_status("main", "idle", 60)
        c.say(TEXT)

        def got():
            return [r for r in E.fake_requests() if r.get("agent") == "main" and "é─😀" in (r.get("user") or "")]
        c.wait(lambda: got(), 90, "main's request with his message")
        last = got()[-1]["user"]
        check("\ufffd" not in last, "a char became U+FFFD: %r" % last[:200])
        check(last == TEXT[:len(last)] and len(last) >= 2900, "his text reached the provider unchanged (%d chars)" % len(last))
        print("ok: 10 KB of multi-byte chars reach the model unchanged")
        ok = True
    finally:
        E.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
