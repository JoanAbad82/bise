# UTF-8 (RFC 3629). Byte strings hold one Char per octet (0..255).
#
# Its own module, with no unsafe def (encoding.bend's hex half has some),
# so pure code with laws can decode (runtime/live-pure.bend);
# encoding.bend still answers Enc.utf8.encode / Enc.utf8.decode.
import Base

def utf8.cont(c: U32, n: Nat) -> U32:
  (128 + U32.and(U32.shrn(c, n), 63) : U32)

def utf8.push4(+c: U32, acc: String) -> String:
  SCon{Chr{utf8.cont(c, 0n)}, SCon{Chr{utf8.cont(c, 6n)}, SCon{Chr{utf8.cont(c, 12n)}, SCon{Chr{(240 + U32.shrn(c, 18n) : U32)}, acc}}}}

def utf8.push3(+c: U32, acc: String, small: Bool) -> String:
  match small:
    case True{}:
      SCon{Chr{utf8.cont(c, 0n)}, SCon{Chr{utf8.cont(c, 6n)}, SCon{Chr{(224 + U32.shrn(c, 12n) : U32)}, acc}}}
    case False{}:
      utf8.push4(c, acc)

def utf8.push2(+c: U32, acc: String, small: Bool) -> String:
  match small:
    case True{}:
      SCon{Chr{utf8.cont(c, 0n)}, SCon{Chr{(192 + U32.shrn(c, 6n) : U32)}, acc}}
    case False{}:
      utf8.push3(c, acc, U32.is_lt(c, 65536))

def utf8.push(+c: U32, acc: String, ascii: Bool) -> String:
  match ascii:
    case True{}:
      SCon{Chr{c}, acc}
    case False{}:
      utf8.push2(c, acc, U32.is_lt(c, 2048))

def utf8.encode.go(s: String, acc: String) -> String:
  match s:
    case SNil{}:
      String.reverse(acc)
    case SCon{Chr{+c}, t}:
      utf8.encode.go(t, utf8.push(c, acc, U32.is_lt(c, 128)))

# Text to octets.
def utf8.encode(s: String) -> String:
  utf8.encode.go(s, SNil{})

# Decoder state: continuation bytes still needed, the allowed range of the
# next one, the code point so far, and the output reversed.
type Utf8 is Data:
  Utf8{need: U32, lo: U32, hi: U32, cp: U32, out: String}

def utf8.bad(out: String) -> String:
  SCon{Chr{65533}, out}

def utf8.lead.multi(+b: U32, out: String) -> Utf8:
  +need = Bool.pick(U32, U32.is_lt(b, 224), 1, Bool.pick(U32, U32.is_lt(b, 240), 2, 3))
  +lo = Bool.pick(U32, U32.is_eq(b, 224), 160, Bool.pick(U32, U32.is_eq(b, 240), 144, 128))
  +hi = Bool.pick(U32, U32.is_eq(b, 237), 159, Bool.pick(U32, U32.is_eq(b, 244), 143, 191))
  Utf8{need, lo, hi, U32.and(b, U32.shrn(63, U32.to_nat(need))), out}

def utf8.lead.high(+b: U32, out: String, bad: Bool) -> Utf8:
  match bad:
    case True{}:
      Utf8{0, 128, 191, 0, utf8.bad(out)}
    case False{}:
      utf8.lead.multi(b, out)

# WHATWG: a byte that cannot start a sequence decodes to U+FFFD.
def utf8.lead(+b: U32, out: String, ascii: Bool) -> Utf8:
  match ascii:
    case True{}:
      Utf8{0, 128, 191, 0, SCon{Chr{b}, out}}
    case False{}:
      utf8.lead.high(b, out, Bool.or(U32.is_lt(b, 194), U32.is_lt(244, b)))

def utf8.more(+need: U32, cp: U32, out: String, done: Bool) -> Utf8:
  match done:
    case True{}:
      Utf8{0, 128, 191, 0, SCon{Chr{cp}, out}}
    case False{}:
      Utf8{need, 128, 191, cp, out}

# WHATWG: a byte that breaks a sequence yields U+FFFD and is read again as a lead.
def utf8.cont.in(+need: U32, cp: U32, +b: U32, out: String, ok: Bool) -> Utf8:
  match ok:
    case True{}:
      utf8.more((need - 1 : U32), (cp * 64 + U32.and(b, 63) : U32), out, U32.is_eq(need, 1))
    case False{}:
      utf8.lead(b, utf8.bad(out), U32.is_lt(b, 128))

def utf8.step.if(+need: U32, +lo: U32, +hi: U32, cp: U32, +b: U32, out: String, idle: Bool) -> Utf8:
  match idle:
    case True{}:
      utf8.lead(b, out, U32.is_lt(b, 128))
    case False{}:
      utf8.cont.in(need, cp, b, out, Bool.and(U32.is_le(lo, b), U32.is_le(b, hi)))

def utf8.step.st(st: Utf8, +b: U32) -> Utf8:
  Utf8{+need, +lo, +hi, cp, out} = st
  utf8.step.if(need, lo, hi, cp, b, out, U32.is_eq(need, 0))

def utf8.finish(st: Utf8) -> String:
  Utf8{+need, lo, hi, cp, +out} = st
  String.reverse(Bool.pick(String, U32.is_eq(need, 0), out, utf8.bad(out)))

def utf8.decode.go(s: String, st: Utf8) -> String:
  match s:
    case SNil{}:
      utf8.finish(st)
    case SCon{Chr{b}, t}:
      utf8.decode.go(t, utf8.step.st(st, b))

# Octets to text, as WHATWG decodes UTF-8: malformed input becomes U+FFFD.
def utf8.decode(s: String) -> String:
  utf8.decode.go(s, Utf8{0, 128, 191, 0, SNil{}})
