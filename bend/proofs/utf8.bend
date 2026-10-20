# bend/proofs/utf8.bend: the proofs of bend/laws/utf8.bend. The decoder
# is a fold of one step per byte, so a cut is the fold's split; the
# other laws rewrite the step's tests with their premises and compute.
import Base
import ../core/utf8.bend as U
import ../laws/utf8.bend as Laws

# both sides of a true `and` are true
def and_left(+a: Bool, +b: Bool, +q: {Bool.and(a, b) == True{} : Bool}) -> {a == True{} : Bool}:
  match a:
    case True{}:
      {==}
    case False{}:
      q

def and_right(+a: Bool, +b: Bool, +q: {Bool.and(a, b) == True{} : Bool}) -> {b == True{} : Bool}:
  match a:
    case True{}:
      q
    case False{}:
      %q : {Bool.pick(Bool, _, b, True{}) == True{} : Bool}
      {==}

def Laws.ascii_is_itself(bs, acc, q):
  match bs:
    case Nil{}:
      {==}
    case Con{x, t}:
      %Equal.sym(Bool, U32.is_lt(x, 128), True{}, and_left(U32.is_lt(x, 128), Laws.all_ascii(t), q)) : {U.go(t, U.step.go(_, Nil{}, x, acc)) == U.Dec{Laws.ascii_rev(t, SCon{Chr{x}, acc}), Nil{}} : U.Dec}
      Laws.ascii_is_itself(t, SCon{Chr{x}, acc}, and_right(U32.is_lt(x, 128), Laws.all_ascii(t), q))

def Laws.a_cut_changes_nothing(a, b, d):
  match a:
    case Nil{}:
      {==}
    case Con{x, t}:
      Laws.a_cut_changes_nothing(t, b, U.step(d, x))

def Laws.a_cut_char_then_ascii(l, cs, out, x, q):
  %Equal.sym(Bool, U32.is_lt(x, 128), True{}, q) : {U.step.go(_, l <> cs, x, out) == U.Dec{SCon{Chr{x}, SCon{U.BAD(), out}}, Nil{}} : U.Dec}
  {==}

def Laws.a_stray_byte_then_ascii(b, x, out, q1, q2, q3):
  %Equal.sym(Bool, U32.is_lt(b, 128), False{}, q1) : {U.go([x], U.step.go(_, Nil{}, b, out)) == U.Dec{SCon{Chr{x}, SCon{U.BAD(), out}}, Nil{}} : U.Dec}
  %Equal.sym(Nat, U.lead_len(b), 0n, q2) : {U.go([x], U.start(_, b, out)) == U.Dec{SCon{Chr{x}, SCon{U.BAD(), out}}, Nil{}} : U.Dec}
  %Equal.sym(Bool, U32.is_lt(x, 128), True{}, q3) : {U.step.go(_, Nil{}, x, SCon{U.BAD(), out}) == U.Dec{SCon{Chr{x}, SCon{U.BAD(), out}}, Nil{}} : U.Dec}
  {==}
