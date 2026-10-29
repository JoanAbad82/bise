# hub/newtask.bend: a new task's pure parts (sb-core's create_task): a
# free name for it (`docs`, then `docs-2`...), its worktree's label in
# main's spawn line, and its brief's parts (send-parts). Pure: no step,
# no state but the one it reads.
import Base
import ../vendor/json.bend as J
import ./model.bend as M
import ./gen/state.bend as S

# the name with its trailing dashes dropped
# the first char of `s` is a dash
def head_dash(s: String) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{+c, _}:
      Char.is_eq(c, '-')

# a walk that stops at the first char that is no dash (`dash`: its head
# is one; a match, never Bool.pick: tests/pick_gate.py)
def strip_dash.go(s: String, +dash: Bool) -> String:
  match s dash:
    case SNil{} _:
      SNil{}
    case SCon{_, +t} True{}:
      strip_dash.go(t, head_dash(t))
    case SCon{+c, +t} False{}:
      SCon{c, t}

def strip_dash(+s: String) -> String:
  +r = String.reverse(s)
  String.reverse(strip_dash.go(r, head_dash(r)))

def candidate(+base: String, +i: Nat) -> String:
  +suffix = String.append("-", Nat.show(i))
  String.append(strip_dash(String.take(base, Nat.sub(24n, String.length(suffix)))), suffix)

# the first free `<base>-<i>` from i on (`taken`: that one is taken); a
# match, never Bool.pick (tests/pick_gate.py)
def unique_name.go(~tk: S.St -> String -> Bool, fuel: Nat, +s: S.St, +base: String, +i: Nat, +taken: Bool) -> String:
  match fuel taken:
    case 0n _:
      candidate(base, i)
    case 1n+f True{}:
      unique_name.go(~tk, f, s, base, 1n+i, tk(s, candidate(base, 1n+i)))
    case 1n+f False{}:
      candidate(base, i)

# a new task's name: the base, or `<base>-2`... when a live agent has it
# (an archived one's or an old name is taken from it: hub/take.bend)
def unique_name(+s: S.St, +base: String) -> String:
  Bool.pick(String, M.name_taken(s, base), unique_name.go(~(x => y => M.name_taken(x, y)), 1000n, s, base, 2n, M.name_taken(s, candidate(base, 2n))), base)

# a name no agent has, as its name or an old name, nor bise
def held_any(+s: S.St, +n: String) -> Bool:
  M.reserved(n) || Maybe.is_some(&2, String, M.resolve(s, n))

# name-free: the name an archived agent moves to when its own is taken:
# `<base>-2`, `-3`... the first no agent has (as a name or an old name)
def unique_free(+s: S.St, +base: String) -> String:
  unique_name.go(~(x => y => held_any(x, y)), 1000n, s, base, 2n, held_any(s, candidate(base, 2n)))

# its worktree in the spawn line: ` (worktree <branch>)`, "" none
def branch_label(b: J.Json) -> String:
  match b:
    case J.JStr{+s}:
      String.concat([" (worktree ", s, ")"])
    case _:
      ""

# a brief's parts (send-parts: msg-parts JSON, "" none) with the task's
# head in front as a text part, so they render to the brief's whole text;
# none, or JSON that is no list: none
def brief_parts.of(+head: String, r: Result<&2, &2, String, J.Json>) -> String:
  match r:
    case Done{J.JArr{+xs}}:
      J.stringify(J.JArr{J.obj([J.kv("kind", J.JStr{"text"}), J.kv("text", J.JStr{head})]) <> xs})
    case _:
      ""

def brief_parts.go(empty: Bool, +head: String, +parts: String) -> String:
  match empty:
    case True{}:
      ""
    case False{}:
      brief_parts.of(head, J.parse(parts))

def brief_parts(+head: String, +parts: String) -> String:
  brief_parts.go(String.is_empty(parts), head, parts)
