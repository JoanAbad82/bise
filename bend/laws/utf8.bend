# bend/laws/utf8.bend: the bytes-to-text decoder of a recv
# (core/utf8.bend, issue 36, architect m_34454). Closed by
# bend/proofs/utf8.bend; the gate checks every bend/proofs/*.bend.
import Base
import ../core/utf8.bend as U

# every byte is ASCII (below 128)
def all_ascii(bs: List<&2, U32>) -> Bool:
  match bs:
    case Nil{}:
      True{}
    case Con{+b, +t}:
      Bool.and(U32.is_lt(b, 128), all_ascii(t))

# the bytes as chars, pushed on `acc` (newest first, as Dec.out)
def ascii_rev(bs: List<&2, U32>, +acc: String) -> String:
  match bs:
    case Nil{}:
      acc
    case Con{+b, +t}:
      ascii_rev(t, SCon{Chr{b}, acc})

# LAW: an ASCII chunk decodes to itself, with nothing pending after it.
law ascii_is_itself:
  for +bs: List<&2, U32>
  for +acc: String
  for +q: {all_ascii(bs) == True{} : Bool}
  {U.go(bs, U.Dec{acc, Nil{}}) == U.Dec{ascii_rev(bs, acc), Nil{}} : U.Dec}

# LAW: bytes cut anywhere in two recvs decode as the bytes whole: the
# second recv starts from what the first left pending (its text and the
# bytes of the char it cut).
law a_cut_changes_nothing:
  for +a: List<&2, U32>
  for +b: List<&2, U32>
  for +d: U.Dec
  {U.go(List.append(&2, U32, a, b), d) == U.go(b, U.go(a, d)) : U.Dec}

# LAW: a char cut short by an ASCII byte is one U+FFFD, and the ASCII
# byte is kept after it (never swallowed).
law a_cut_char_then_ascii:
  for +l: U32
  for +cs: List<&2, U32>
  for +out: String
  for +x: U32
  for q: {U32.is_lt(x, 128) == True{} : Bool}
  {U.step(U.Dec{out, l <> cs}, x) == U.Dec{SCon{Chr{x}, SCon{U.BAD(), out}}, Nil{}} : U.Dec}

# LAW: a byte that starts no char is one U+FFFD, and the ASCII byte after
# it is kept.
law a_stray_byte_then_ascii:
  for +b: U32
  for +x: U32
  for +out: String
  for q1: {U32.is_lt(b, 128) == False{} : Bool}
  for q2: {U.lead_len(b) == 0n : Nat}
  for q3: {U32.is_lt(x, 128) == True{} : Bool}
  {U.go([b, x], U.Dec{out, Nil{}}) == U.Dec{SCon{Chr{x}, SCon{U.BAD(), out}}, Nil{}} : U.Dec}
