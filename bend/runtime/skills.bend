# runtime/skills.bend — the Agent Skills feature (Vibe CLI design).
#
# Progressive disclosure, exactly as vibe_sdk/harness/core
# features/skills: the system prompt carries ONLY name + description +
# path per skill (an <available-skills> section), and the `skill` tool
# loads the full SKILL.md instructions on demand. Callers must use an
# exact name from the section; a miss returns the error contract with
# the available list.
#
# The catalog is a local index file written at live startup by scanning
# the standard skill folders (~/.agents/skills, ~/.vibe/skills, and the
# repo's .agents/skills) for SKILL.md files with YAML frontmatter
# (name:, description:) — the Agent Skills format. Scripted runs never
# scan and never read the index: the scenarios stay hermetic.
#
# index line: "name\tdescription\tpath" (tab-separated; the scan strips
# tabs and quotes from the fields, so the split is unambiguous)
import Base
import ../core/types.bend as T
import ../core/text.bend as Tx
import ./persist.bend as P
import ./mcp.bend as Mc
import ../vendor/json.bend as J
import ./proc.bend as Proc
import ./skills-pure.bend as Skp
import ./plugins.bend as Pl

# ---- the tool contract ----

def SKILL_USAGE() -> String:
  "skill: call exactly with {\"name\":\"<exact name>\"}; no other argument keys are accepted"

# ---- the index file (mirror of the MCP index pattern) ----

def index_path() -> IO(String):
  P.env_path("BEND_SKILLS_INDEX", "/.bend-harness/skills-index.txt")

# ---- the startup scan (live only) ----
# One POSIX shell script writes two indexes: every SKILL.md under a
# skill folder with a name: and a single-line description: in its
# frontmatter.
#   $1 the shared index: the user folders (~/.agents/skills,
#      ~/.vibe/skills); the TUI `$` popup reads it
#   $2 this session's index: the workspace folder
#      ($BEND_WORKDIR/.agents/skills - the hub runs a task's REPL in the
#      app root, so $PWD would miss the task's workspace - else
#      $PWD/.agents/skills), then the plugin skills ($3, written by the
#      plugins bridge, runtime/plugins.bend), then bise's built-in skills
#      for every agent: the app root's prompts/skills-all (the hub runs
#      every REPL in the app root, and versions.sh and build-dist.sh ship
#      prompts/ whole), e.g. bise-pages; then, for main only
#      (BISE_ROLE=main, set by the hub), main's own built-ins: the app
#      root's prompts/skills, e.g. bise-demo
# Each index is written to a temp file then renamed: every REPL start
# rescans, and a skill call or the TUI reading the shared index mid-scan
# must see the old index or the new one, never a truncated file.
# The group ends with `true`: its status is its last command's, and a
# missing $3 (no plugins bridge, or one not ready within 15 s) or a last
# SKILL.md without a description made it fail, so the rename never came
# (no session index, a temp file left behind).
# skill_ok keeps absolute paths only, so a relative one would drop
# every local skill. Tabs and quotes are stripped from the fields so the
# tab-separated line stays unambiguous; folded multi-line YAML
# descriptions are out of scope (the Agent Skills format is one line).

# The script itself is in skills-pure.bend (a law pins its guard): each
# SKILL.md is read in the background with a 1 s watchdog, so a file
# whose open never answers is skipped instead of holding main's first
# turn. Its lines out ('<path>: not readable (macOS privacy?)') are the
# skipped files; skills_scan prints them on stderr.
def scan_script() -> String:
  Skp.scan_script()

def scan_path(+dir: String, +port: String) -> String:
  String.append(dir, String.append("/bend-skills-scan-", String.append(port, ".sh")))

def session_index_path() -> IO(String):
  do IO<String>:
    +r : String <- Pl.run_dir()
    IO.pure(String, String.append(r, "/skills-index.txt"))

# the scan's output (Proc.run's status line, then the skill files it
# skipped, one line each): each skipped file goes to stderr, the REPL's
# log, never the session
def scan_log.one(skipped: Bool, +l: String) -> IO(Unit):
  match skipped:
    case True{}:
      IO.print_err(String.append("bise: skills scan: ", l))
    case False{}:
      IO.pure(Unit, Unit{})

def scan_log.go(lines: List<&2, String>) -> IO(Unit):
  match lines:
    case Nil{}:
      IO.pure(Unit, Unit{})
    case Con{+l, rest}:
      do IO<Unit>:
        u : Unit <- scan_log.one(String.contains(l, ": not readable (macOS privacy?)"), l)
        scan_log.go(rest)

def scan_log(+out: String) -> IO(Unit):
  scan_log.go(String.split(out, Tx.newline()))

def skills_scan() -> IO(Unit):
  do IO<Unit>:
    +idx : String <- index_path()
    +sidx : String <- session_index_path()
    +psk : String <- Pl.skills_index_path()
    pr : Result<&1, &1, U32 & String, String> <- IO.get_env("BEND_REPL_PORT")
    +port : String <- IO.pure(String, P.env_or(pr, "0"))
    +side : String <- P.side_dir()
    +path : String <- IO.pure(String, scan_path(side, port))
    u : Unit <- P.write_file(path, scan_script())
    out : String <- Proc.run(Con{"/bin/sh", Con{path, Con{idx, Con{sidx, Con{psk, Nil{}}}}}})
    scan_log(out)

# the index the catalog and the skill tool read: this session's index
# first (workspace and plugin skills win a name clash: the first
# occurrence of a name is kept), then the shared one
def index_content.join(ms: Maybe<&2, String>, mu: Maybe<&2, String>)
    -> Maybe<&2, String>:
  match ms:
    case None{}:
      mu
    case Some{+s}:
      Some{String.append(s, String.append("
", Maybe.default(&2, String, mu, "")))}

def index_content() -> IO(Maybe<&2, String>):
  do IO<Maybe<&2, String>>:
    +sidx : String <- session_index_path()
    +idx : String <- index_path()
    ms : Maybe<&2, String> <- P.read_file(sidx)
    mu : Maybe<&2, String> <- P.read_file(idx)
    IO.pure(Maybe<&2, String>, index_content.join(ms, mu))

# ---- execution ----

def skill_path(+sk: Skp.Skill) -> String:
  match sk:
    case Skp.Skill{_, _, +path}:
      path

def read_skill.go(m: Maybe<&2, String>, +sk: Skp.Skill) -> Mc.MR:
  match m:
    case None{}:
      Mc.MR{False{},
        String.append("skill file unreadable: ", skill_path(sk))}
    case Some{+content}:
      Mc.MR{True{}, Skp.strip_frontmatter(content)}

def read_skill(sk: Skp.Skill) -> IO(Mc.MR):
  match sk:
    case Skp.Skill{_, _, +path}:
      do IO<Mc.MR>:
        m : Maybe<&2, String> <- P.read_file(path)
        IO.pure(Mc.MR, read_skill.go(m, sk))

# a name the index lacks is not an unreadable index (an empty index said
# "unreadable" and sent the search to the wrong place)
def exec_skill.live.found(fs: Maybe<&2, Skp.Skill>, +name: String) -> IO(Mc.MR):
  match fs:
    case None{}:
      IO.pure(Mc.MR, Mc.MR{False{},
        String.append("unknown skill: ", String.append(name,
          ": call it with an exact name from <available-skills>"))})
    case Some{+sk}:
      read_skill(sk)

def exec_skill.live.go(m: Maybe<&2, String>, +name: String) -> IO(Mc.MR):
  match m:
    case None{}:
      IO.pure(Mc.MR,
        Mc.MR{False{}, "skills index unreadable: no skills are available"})
    case Some{+content}:
      exec_skill.live.found(Skp.find_skill(content, name), name)

def exec_skill.live.pick(n: Maybe<&2, String>) -> IO(Mc.MR):
  match n:
    case None{}:
      IO.pure(Mc.MR, Mc.MR{False{}, SKILL_USAGE()})
    case Some{+name}:
      do IO<Mc.MR>:
        m : Maybe<&2, String> <- index_content()
        exec_skill.live.go(m, name)

def exec_skill.live(+args: String) -> IO(Mc.MR):
  do IO<Mc.MR>:
    n : Maybe<&2, String> <- IO.pure(Maybe<&2, String>, Skp.args_name(args))
    exec_skill.live.pick(n)

def exec_skill.scripted() -> Mc.MR:
  Mc.MR{False{}, "skills need a live session"}

def exec_skill(+args: String, live: Bool) -> IO(Mc.MR):
  match live:
    case True{}:
      exec_skill.live(args)
    case False{}:
      IO.pure(Mc.MR, exec_skill.scripted())

def prompt_content() -> IO(String):
  do IO<String>:
    m : Maybe<&2, String> <- index_content()
    IO.pure(String, Maybe.default(&2, String, m, ""))
