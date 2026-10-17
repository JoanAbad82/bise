# hub/lazy.bend — the lazy forms of Bool.pick, || and && (bend-perf, page
# bend-perf). Bend is strict: Bool.pick(T, c, a, b), `a || b` and `a && b`
# compute both sides before they pick, so a search written
# `Bool.pick(T, c, Some{h}, find(t, k))` or `eq(h) || in(t)` walks to the
# end of the list after its hit. Here the second side is a thunk
# (`u => find(t, k)`): a lambda's body runs only when it is applied, and
# each def below applies only the side its match takes. A recursive call
# inside the thunk passes the termination check. Pure; tests/pick_gate.py
# refuses a Maybe or Bool search in bend/hub written the strict way.
import Base

# a when c is true, else b; only the one taken computed
def pick(-A: Type, c: Bool, a: Unit -> A, b: Unit -> A) -> A:
  match c:
    case True{}:
      a(Unit{})
    case False{}:
      b(Unit{})

# a || b, b computed only when a is false
def or(a: Bool, b: Unit -> Bool) -> Bool:
  match a:
    case True{}:
      True{}
    case False{}:
      b(Unit{})

# a && b, b computed only when a is true
def and(a: Bool, b: Unit -> Bool) -> Bool:
  match a:
    case True{}:
      b(Unit{})
    case False{}:
      False{}
