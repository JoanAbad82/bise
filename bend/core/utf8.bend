# core/utf8.bend — bytes to text across recvs (issue 36, architect
# m_34454). TCP.recv decodes each recv on its own, so a multi-byte char
# cut by a recv boundary became U+FFFD (his messages to agents over 4 KB).
# A reader that takes TCP.recv_bytes decodes with this instead: the bytes
# of a char a recv cut (at most 3) wait in the decoder for the next recv.
# An invalid byte gives one U+FFFD and the next byte starts afresh, as
# Rust's String::from_utf8_lossy does (one U+FFFD per maximal invalid
# part), so both sides of a socket read the same text. Laws:
# bend/laws/utf8.bend.
import Base

# the decoder between two recvs: the text so far, newest char first, and
# the bytes of a char not complete yet (its lead, then what came of it)
type Dec is Data:
  Dec{out: String, pend: List<&2, U32>}

def BAD() -> Char:
  Chr{65533}

# the bytes a lead byte past ASCII starts (2, 3, 4), 0 when it starts
# none (a stray continuation, C0, C1, F5..FF)
def lead_len(+b: U32) -> Nat:
  Bool.pick(Nat, U32.is_lt(b, 194), 0n,
    Bool.pick(Nat, U32.is_lt(b, 224), 2n,
      Bool.pick(Nat, U32.is_lt(b, 240), 3n,
        Bool.pick(Nat, U32.is_lt(b, 245), 4n, 0n))))

# the range of the byte after `i` continuations of the lead `l` (the
# second byte of E0, ED, F0, F4 is narrower: no overlong form, no
# surrogate, nothing past U+10FFFF); `hi` exclusive
def lo(+l: U32, i: Nat) -> U32:
  match i:
    case 0n:
      Bool.pick(U32, U32.is_eq(l, 224), 160, Bool.pick(U32, U32.is_eq(l, 240), 144, 128))
    case _:
      128

def hi(+l: U32, i: Nat) -> U32:
  match i:
    case 0n:
      Bool.pick(U32, U32.is_eq(l, 237), 160, Bool.pick(U32, U32.is_eq(l, 244), 144, 192))
    case _:
      192

def cont_ok(+l: U32, +i: Nat, +b: U32) -> Bool:
  Bool.and(Bool.not(U32.is_lt(b, lo(l, i))), U32.is_lt(b, hi(l, i)))

def mask(n: Nat) -> U32:
  match n:
    case 2n:
      31
    case 3n:
      15
    case _:
      7

# the char of a lead and its continuations
def code.go(cs: List<&2, U32>, +v: U32) -> U32:
  match cs:
    case Nil{}:
      v
    case Con{+c, +t}:
      code.go(t, U32.or(U32.shln(v, 6n), U32.and(c, 63)))

def code(+l: U32, cs: List<&2, U32>) -> Char:
  Chr{code.go(cs, U32.and(l, mask(lead_len(l))))}

# a byte past ASCII with nothing pending: a lead waits for the rest, any
# other byte is one U+FFFD
def start(n: Nat, +b: U32, +out: String) -> Dec:
  match n:
    case 0n:
      Dec{SCon{BAD(), out}, Nil{}}
    case _:
      Dec{out, [b]}

# a continuation that fits: the char when it is the last, else it waits
def fits(done: Bool, +l: U32, +cs: List<&2, U32>, +out: String) -> Dec:
  match done:
    case True{}:
      Dec{SCon{code(l, cs), out}, Nil{}}
    case False{}:
      Dec{out, l <> cs}

# a byte past ASCII after a lead and `cs`: it fits, or the pending bytes
# are one U+FFFD and this byte starts afresh
def more(ok: Bool, +l: U32, +cs: List<&2, U32>, +b: U32, +out: String) -> Dec:
  match ok:
    case True{}:
      +cs2 = List.append(&2, U32, cs, [b])
      fits(Nat.is_eq(1n+List.length(&2, U32, cs2), lead_len(l)), l, cs2, out)
    case False{}:
      start(lead_len(b), b, SCon{BAD(), out})

# one byte; `ascii`: it is below 128 (ASCII is its own char, and ends a
# pending char as one U+FFFD before it)
def step.go(ascii: Bool, +pend: List<&2, U32>, +b: U32, +out: String) -> Dec:
  match ascii pend:
    case True{} Nil{}:
      Dec{SCon{Chr{b}, out}, Nil{}}
    case True{} Con{_, _}:
      Dec{SCon{Chr{b}, SCon{BAD(), out}}, Nil{}}
    case False{} Nil{}:
      start(lead_len(b), b, out)
    case False{} Con{+l, +cs}:
      more(cont_ok(l, List.length(&2, U32, cs), b), l, cs, b, out)

def step(+d: Dec, +b: U32) -> Dec:
  match d:
    case Dec{+out, +pend}:
      step.go(U32.is_lt(b, 128), pend, b, out)

# the bytes of a recv, each in order
def go(bs: List<&2, U32>, +d: Dec) -> Dec:
  match bs:
    case Nil{}:
      d
    case Con{+b, +t}:
      go(t, step(d, b))

# a recv's bytes after `pend` (the last recv's cut char): their text and
# the bytes of the char this recv cut
def decode.of(+d: Dec) -> String & List<&2, U32>:
  match d:
    case Dec{+out, +p}:
      (String.reverse(out), p)

def decode(+pend: List<&2, U32>, bs: List<&2, U32>) -> String & List<&2, U32>:
  decode.of(go(bs, Dec{SNil{}, pend}))
