"""The `@` popup in a real terminal (tmux), against the fake provider:
agents first, then the files and folders of the workspace (.gitignore
respected); `@` opens it at the start or inline; picking a file puts its
chip where the `@` was (`▯ app.rs`, at-chips), picking an agent `@name`.

python3 -u tests/tui_at_files_tmux.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
from tui_tmux import tui_session, run, MAIN_IDLE  # noqa: E402
from tui_composer_tmux import composer, wait_composer  # noqa: E402


def wait_composer_has(t, text, timeout=5):
    """The composer's rows hold `text`, spaces collapsed (a chip draws a cell of room before its
    sign: 'read  ▯ app.rs')."""
    def shows(sc):
        return text in " ".join(composer(t, sc).split())
    shows.__doc__ = "composer has %r" % text
    t.wait_any([shows], timeout, poll=0.1)


def popup_rows(t):
    """The popup rows above the composer (between the split borders)."""
    return [r for r in t.screen().splitlines() if ("▪" in r or "▸" in r or " @" in r) and "┃" in r]


# names that match none of the queries below (`not`, `app`, `sb/me`)
DL_ORDER = ["report.pdf", "new-folder", "memo.md", "old-folder", "a-oldest.txt"]


def main():
    E = e2e.Env()
    for d in ["src/sb", "target/debug", "docs", "rust/tui/src"]:
        os.makedirs(os.path.join(E.ws, d), exist_ok=True)
    for f, body in [(".gitignore", "target/\n"), ("src/app.rs", ""), ("src/sb/mention.rs", ""),
                    ("docs/at-notes.md", ""), ("target/debug/appcache.rs", ""),
                    ("rust/tui/src/files.rs", ""), ("rust/tui/Cargo.toml", "")]:
        with open(os.path.join(E.ws, f), "w") as fh:
            fh.write(body)
    # rust/tui/src/ newer than Cargo.toml: first in `@rust/tui/` (→ enters it)
    os.utime(os.path.join(E.ws, "rust/tui/Cargo.toml"), (1_700_000_000,) * 2)
    os.utime(os.path.join(E.ws, "rust/tui/src"), (1_700_000_060,) * 2)
    # a downloads-like folder, newest first: folders and files mixed
    for d in ["dl/old-folder", "dl/new-folder"]:
        os.makedirs(os.path.join(E.ws, d), exist_ok=True)
    for f in ["dl/a-oldest.txt", "dl/report.pdf", "dl/memo.md"]:
        open(os.path.join(E.ws, f), "w").close()
    for i, n in enumerate(DL_ORDER):
        os.utime(os.path.join(E.ws, "dl", n), (1_700_000_000 - i * 3600,) * 2)
    with tui_session(150, 42, E=E) as t:
        t.wait("bise :*")
        t.wait_re(MAIN_IDLE)
        # a task, so an agent is listed
        t.typed('crée [[bash: sb spawn notes --objective "écris {{bash: echo hi}}"]]')
        t.keys("Enter")
        t.wait("new agent @notes")
        t.wait_re(r"notes +(→ \S+|m_\d)", 60)
        # `@` alone at the start: the agent, then the root of the workspace
        t.typed("@")
        sc = t.wait("▸ docs/")
        assert "@notes" in sc and "▪ README" in sc, sc
        rows = popup_rows(t)
        assert "@notes" in rows[0], rows
        # inline: agents and files matching "not", the agent first
        t.keys("BSpace")
        t.typed("read @not")
        sc = t.wait("docs/at-notes.md")
        rows = popup_rows(t)
        assert "@notes" in rows[0] and "docs/at-notes.md" in rows[1], rows
        # file name before path, the ignored target/ never listed
        for _ in range(3):
            t.keys("BSpace")
        t.typed("app")
        sc = t.wait("src/app.rs")
        assert "appcache" not in sc, sc
        t.keys("Tab")
        # at-chips (7856b6e00): a picked file is a chip by its name where the @ was
        wait_composer_has(t, "read ▯ app.rs")
        t.wait_gone("▪ src/app.rs")
        # a folder part narrows; Enter picks too
        t.typed("and @sb/me")
        t.wait("src/sb/mention.rs")
        t.keys("Enter")
        wait_composer_has(t, "read ▯ app.rs and ▯ mention.rs")
        assert "src/" not in composer(t), composer(t)
        # mid-word @ (an email) opens nothing
        t.typed("to a@b")
        t.sync()
        assert "▪" not in t.screen(), t.screen()
        t.keys("C-u")
        # picking an agent at the start keeps the routing form
        t.typed("@no")
        t.wait("@notes")
        t.keys("Tab")
        wait_composer(t, "@notes")
        t.keys("C-u")
        # the reported panic: ← with the cursor onto the `@`
        t.typed("@")
        t.wait("▸ rust/")
        t.keys("Left")
        t.wait_gone("▸ rust/")
        t.keys("Right")
        t.wait("▸ rust/")
        t.keys("BSpace")
        # browse folders without leaving the popup: `@rust/`, → into
        # tui/, → into src/, pick files.rs
        t.typed("@rust/")
        t.wait("▸ rust/tui/")
        t.keys("Right")
        wait_composer(t, "@rust/tui/")
        sc = t.wait("▸ rust/tui/src/")
        assert "▪ rust/tui/Cargo.toml" in sc and "this folder" in sc, sc
        t.keys("Left")                       # ← goes one folder up
        wait_composer(t, "@rust/")
        t.keys("Right")
        wait_composer(t, "@rust/tui/")
        t.wait("▸ rust/tui/src/")
        t.keys("Right")
        wait_composer(t, "@rust/tui/src/")
        t.wait("▪ rust/tui/src/files.rs")
        t.keys("Enter")
        wait_composer_has(t, "▯ files.rs")
        t.wait_gone("▪ rust/tui/src/files.rs")
        assert "@" not in composer(t), composer(t)
        # at-recent: browsing a folder lists the last modified first,
        # folders and files mixed (dl/'s mtimes set before the walk)
        t.keys("C-u")
        t.typed("@dl/")
        t.wait("dl/a-oldest.txt")
        names = [n for r in popup_rows(t) for n in DL_ORDER if f"dl/{n}" in r]
        assert names == DL_ORDER, (names, t.screen())
        t.keys("C-u")
        print(t.screen())
        print("PASS tui at-files")


if __name__ == "__main__":
    run(main)
