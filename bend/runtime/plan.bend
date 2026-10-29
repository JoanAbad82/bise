# bend/runtime/plan.bend: a ChatGPT plan's effects in the runtime
# (chatgpt-default, architect m_33751): the swap's note, said once per
# session and pair. Its rules are plan-pure.bend's; provider.bend calls
# swap_said before each call and notes what it answers.
import Base
import ./persist.bend as P
import ./plan-pure.bend as Plan

def swap_said.go(say: Bool, +path: String, +marker: String, +from: String,
    +to: String) -> IO(String):
  match say:
    case False{}:
      IO.pure(String, "")
    case True{}:
      do IO<String>:
        w : Unit <- P.write_file(path, Plan.swap_marked(marker, from, to))
        IO.pure(String, Plan.swap_note(from, to))

def swap_said.at(none: Bool, +path: String, +from: String, +to: String)
    -> IO(String):
  match none:
    case True{}:
      IO.pure(String, "")
    case False{}:
      do IO<String>:
        m : Maybe<&2, String> <- P.read_file(path)
        +marker : String <- IO.pure(String, Maybe.default(&2, String, m, ""))
        swap_said.go(Plan.say_swap(marker, from, to), path, marker, from, to)

# a plan's swap applied to this call (asked != the id resolved): its note
# when this session hasn't said that pair yet (Plan.say_swap, the marker
# next to the session file, written here alone), else ""; a call outside
# a session or not live (a one-shot, a summary) says nothing
def swap_said(live: Bool, +from: String, +to: String) -> IO(String):
  match live:
    case False{}:
      IO.pure(String, "")
    case True{}:
      do IO<String>:
        fr : Result<&1, &1, U32 & String, String> <- IO.get_env("BEND_SESSION_FILE")
        +sf : String <- IO.pure(String, P.env_or(fr, ""))
        swap_said.at(Bool.or(String.is_empty(sf), String.eq(from, to)),
          Plan.swap_marker_path(sf), from, to)
