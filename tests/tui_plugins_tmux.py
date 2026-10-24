"""/plugins and /skills in a real terminal (tmux; plugins-ui's terminal
screens, page plugins §5-§6), on a throwaway hub and fake plugins: never
the user's plugins, state, Mistral key or MCP servers (BEND_PLUGINS_HOME
and BEND_PLUGINS_STATE are temp, MISTRAL_API_KEY is empty).

- /plugins opens the screen: the question, the kinds, the fake plugins
  with what they give; space on `fake-tools` turns it off: the divider
  says when his agents lose it, and plugins.json has it (the TUI's
  write through bend_plugins::state, read back from the file);
- ⏎ opens `fake-skill`'s page: its skill, its `try it` prompts (from
  dev.bise.prompts); `1` puts the first in main's composer, the screen
  closes;
- `a` opens the add menu with its 5 items; esc twice closes it all;
- /skills opens the same screen on the skills folders;
- `/plugins off fake-skill` from the composer: the divider's ✓ line and
  plugins.json.

The KEEP: the TUI's process reads the user's files (the resolver, the
state) and writes plugins.json under its lock; layout and keys are
plugins_screen_tests.rs's. At 150 and 80 columns.

SB_DUMP=<dir>: every screen checked, written there.

python3 -u tests/tui_plugins_tmux.py
"""
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e  # noqa: E402
import wait  # noqa: E402
from tui_tmux import tui_session, run  # noqa: E402
from words import w  # noqa: E402

PROMPT = "say hello to the fake plugin"


def fake_plugins(root):
    """Two user plugins: one with a skill and prompts, one with a stdio
    server (never started here: the screen reads files only)."""
    a = os.path.join(root, "fake-skill")
    os.makedirs(os.path.join(a, "skills", "greet"))
    with open(os.path.join(a, "plugin.json"), "w") as f:
        json.dump({"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "name": "fake-skill", "version": "1.0.0",
                   "description": "a fake plugin with one skill", "extensions": {"dev.bise": {"prompts": [PROMPT]}}}, f)
    with open(os.path.join(a, "skills", "greet", "SKILL.md"), "w") as f:
        f.write("---\nname: greet\ndescription: greet the user\n---\nsay hello\n")
    b = os.path.join(root, "fake-tools")
    os.makedirs(b)
    with open(os.path.join(b, "plugin.json"), "w") as f:
        json.dump({"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "name": "fake-tools", "version": "1.0.0",
                   "description": "a fake plugin with one server"}, f)
    with open(os.path.join(b, "mcp.json"), "w") as f:
        json.dump({"mcpServers": {"fake": {"command": "python3", "args": ["-c", "pass"]}}}, f)


def shooter(tag):
    dump = os.environ.get("SB_DUMP")
    n = [0]

    def shot(t, name, sc):
        if dump:
            os.makedirs(dump, exist_ok=True)
            n[0] += 1
            for ext, text in (("txt", sc), ("ansi", t.screen(colors=True))):
                with open(os.path.join(dump, "%s%02d-%s.%s" % (tag, n[0], name, ext)), "w") as f:
                    f.write(text)
    return shot


def state_of(path):
    try:
        return json.load(open(path))
    except (OSError, ValueError):
        return {}


def screen(cols):
    d = tempfile.mkdtemp(prefix="plg-", dir=e2e.short_tmp())
    plugins, state = os.path.join(d, "plugins"), os.path.join(d, "plugins.json")
    fake_plugins(plugins)
    E = e2e.Env()
    E.env["BEND_PLUGINS_HOME"] = plugins
    E.env["BEND_PLUGINS_STATE"] = state
    E.env["MISTRAL_API_KEY"] = ""
    env = "BEND_PLUGINS_HOME=%s BEND_PLUGINS_STATE=%s MISTRAL_API_KEY=" % (plugins, state)
    shot = shooter("plugins-%d-" % cols)
    with tui_session(cols, 44, env=env, E=E) as t:
        t.wait("bise :*")
        t.typed("/plugins")
        t.keys("Enter")
        sc = t.wait_all([w("settings.plugins_question"), "fake-skill", "fake-tools", w("settings.plugins_n_skills", n=1)])
        shot(t, "list", sc)
        # select fake-tools, turn it off
        while "› on   fake-tools" not in t.screen():
            t.keys("Down")
            wait.until(lambda: "›" in t.screen(), 5, "the selection")
        t.keys("Space")
        sc = t.wait(w("settings.plugins_done_off", name="fake-tools", when=w("settings.plugins_next_call")) if cols >= 120 else "✓ fake-tools off")
        shot(t, "off", sc)
        wait.until(lambda: "fake-tools" in json.dumps(state_of(state)), 5, "plugins.json has fake-tools off")
        # its page, then the other's: its try block
        t.keys("Up")
        t.keys("Enter")
        sc = t.wait_all(["plugins › fake-skill", w("settings.plugins_part_skills", n=1), "greet", PROMPT])
        shot(t, "page", sc)
        t.keys("1")
        t.wait_gone(w("settings.plugins_part_skills", n=1))
        t.wait(PROMPT)
        shot(t, "tried", t.screen())
        t.keys("C-u")
        # the add menu
        t.typed("/plugins add")
        t.keys("Enter")
        sc = t.wait_all([w("settings.plugins_add_question"), w("settings.plugins_add_mcp"), w("settings.plugins_add_agent")])
        shot(t, "add", sc)
        t.keys("Escape")
        t.keys("Escape")
        t.wait_gone(w("settings.plugins_question"))
        # /skills: the same screen on the skills folders
        t.typed("/skills")
        t.keys("Enter")
        sc = t.wait(w("settings.plugins_question"))
        assert "fake-tools" not in sc, sc
        shot(t, "skills", sc)
        t.keys("Escape")
        # from the composer
        t.typed("/plugins off fake-skill")
        t.keys("Enter")
        t.wait("✓ fake-skill off")
        wait.until(lambda: "fake-skill" in json.dumps(state_of(state).get("disabled", [])), 5, "plugins.json has fake-skill off")


def main():
    for cols in (150, 80):
        screen(cols)


if __name__ == "__main__":
    run(main)
