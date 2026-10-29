# hub/names.bend — name-free (architect m_31139): the pure string side of
# an agent's names and folder. An archived agent's name and an old name
# no longer hold the name forever: a take (a new task, a rename) frees it
# (model.bend apply strips the old name from its holder, core.bend moves
# an archived holder to <name>-2 first). The folder (Agent.dir) is the
# stable id of an agent's files: a new agent whose name a folder already
# has gets <name>.2, <name>.3... ('.' is never in a name, so a folder never
# meets a later name). Pure; model.bend imports it.
import Base

import ./lazy.bend as LZ

# the list without `n` (an old name taken by another agent)
def drop_str.keep(hit: Bool, +h: String, +rest: List<&2, String>) -> List<&2, String>:
  match hit:
    case True{}:
      rest
    case False{}:
      h <> rest

def drop_str(xs: List<&2, String>, +n: String) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      drop_str.keep(String.eq(h, n), h, drop_str(t, n))

def has(xs: List<&2, String>, +s: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+h, +t}:
      LZ.or(String.eq(h, s), u => has(t, s))

# a rename in a list of names (St.order)
def rename_in(xs: List<&2, String>, +old: String, +new: String) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Bool.pick(String, String.eq(h, old), new, h) <> rename_in(t, old, new)

# the folder `<name>.<i>`
def dir_at(+name: String, +i: Nat) -> String:
  String.append(name, String.append(".", Nat.show(i)))

# the first folder `<name>.<i>` no agent has, from i on (`taken`: that one
# is taken); a match, never Bool.pick (tests/pick_gate.py)
def free_dir.go(fuel: Nat, +dirs: List<&2, String>, +name: String, +i: Nat, +taken: Bool) -> String:
  match fuel taken:
    case 0n _:
      dir_at(name, i)
    case 1n+f True{}:
      free_dir.go(f, dirs, name, 1n+i, has(dirs, dir_at(name, 1n+i)))
    case 1n+f False{}:
      dir_at(name, i)

# a new agent's folder: its name, or <name>.2... when an agent (an
# archived one: its transcript, tmp and run files) has that folder
def free_dir.pick(taken: Bool, +dirs: List<&2, String>, +name: String) -> String:
  match taken:
    case True{}:
      free_dir.go(1000n, dirs, name, 2n, has(dirs, dir_at(name, 2n)))
    case False{}:
      name

def free_dir(+dirs: List<&2, String>, +name: String) -> String:
  free_dir.pick(has(dirs, name), dirs, name)
