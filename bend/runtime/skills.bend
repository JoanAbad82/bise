# runtime/skills.bend — the Agent Skills feature (Vibe CLI design).
#
# Progressive disclosure, exactly as vibe_sdk/harness/core
# features/skills: the system prompt carries ONLY name + description +
# path per skill (an <available-skills> section), and the `skill` tool
# loads the full SKILL.md instructions on demand. Callers must use an
# exact name from the section; a miss returns the error contract with
# the available list.
#
# The catalog is this session's index, $BEND_RUN_DIR/<port>/plugins/
# skills-index.txt, written by the plugins bridge before it says it is
# ready (bend_plugins::skills: every on skill of the skill folders and
# the plugins, first name kept). No scan here. A missing index means no
# skills, said once on stderr (repl.err). Scripted runs never read it:
# the scenarios stay hermetic.
#
# index line: "name\tdescription\tpath" (tab-separated; the bridge
# strips tabs and quotes from the fields, so the split is unambiguous)
import Base
import ./persist.bend as P
import ./mcp.bend as Mc
import ./skills-pure.bend as Skp
import ./plugins.bend as Pl

# ---- the tool contract ----

def SKILL_USAGE() -> String:
  "skill: call exactly with {\"name\":\"<exact name>\"}; no other argument keys are accepted"

# ---- the index file: the bridge's ----

def session_index_path() -> IO(String):
  Pl.skills_index_path()

def index_content() -> IO(Maybe<&2, String>):
  do IO<Maybe<&2, String>>:
    +sidx : String <- session_index_path()
    P.read_file(sidx)

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

# the prompt's skills: none without an index, said on stderr (the
# prompt is built once per REPL start)
def prompt_content.go(m: Maybe<&2, String>, +path: String) -> IO(String):
  match m:
    case None{}:
      do IO<String>:
        u : Unit <- IO.print_err(String.append("skills: no skills index at ",
          String.append(path, " (the plugins bridge did not write it): no skills this session
")))
        IO.pure(String, "")
    case Some{+content}:
      IO.pure(String, content)

def prompt_content() -> IO(String):
  do IO<String>:
    +sidx : String <- session_index_path()
    m : Maybe<&2, String> <- P.read_file(sidx)
    prompt_content.go(m, sidx)
