# runtime/live-pure.bend — the answer as it streams in: the pure half of
# the live reader (runtime/sse-read.bend feeds it each raw piece of a
# streamed model attempt; runtime/race.bend carries its lines to the
# caller, who writes them on the wire).
#
# A piece is raw bytes. Only the piece is scanned for newlines (a byte
# that never sits inside a UTF-8 sequence): what follows its last
# newline is held as the tail (a list of pieces, newest first), and a
# line is joined, decoded and parsed once, when its newline comes. So the
# cost stays linear in the reply, however small the pieces.
#
# Each "data:" line is read by the family's own event shape (below) for
# the ANSWER's text only: no thinking, no tool-call JSON. The text since
# the last emit is kept as a list of parts (newest first) and joined
# once per emit. A new text block (another index, item or content part;
# in Chat Completions, text after a thinking block) starts again at
# offset 0, and its unsent text is dropped: the hub replaces its text.
#
# The wire line, one per emit (at most every every_ms()):
#   partial #<call>.<attempt> +<offset> : <escaped text since the last>
# offset counts the ESCAPED characters already sent in this block, so
# the hub, which keeps the escaped text and unescapes it whole, checks a
# delta by its own length. The final reply stays the truth: it is decoded
# once, whole, as before (provider.bend sse.text).
import Base
import ../core/api.bend as Api
import ../core/wire.bend as W
import ../core/text.bend as Tx
import ../vendor/json.bend as J

# at most one partial per this many ms (main m_12376)
def every_ms() -> Nat:
  250n

# one attempt's live state. on: False for a call whose text is not the
# agent's answer (a compaction summary, a one-shot): feed does nothing.
type Lv is Data:
  Lv{on: Bool, id: String, fam: Api.Style, tail: List<&2, String>,
    key: String, pend: List<&2, String>, off: Nat, at: Nat}

def lv0(on: Bool, +id: String, fam: Api.Style) -> Lv:
  Lv{on, id, fam, Nil{}, "", Nil{}, 0n, 0n}

# ---- one event: the answer's text it carries ----

# ETxt: text for the block named key ("" = the block in progress);
# EBrk: a thinking block, after which text starts a new block
type Ex is Data:
  ETxt{key: String, text: String}
  EBrk{}

def one(+key: String, +text: String) -> List<&2, Ex>:
  Con{ETxt{key, text}, Nil{}}

# Messages API: content_block_delta / text_delta, its block by index
def anth.delta(is_text: Bool, +d: J.Json, +key: String) -> List<&2, Ex>:
  match is_text:
    case True{}:
      one(key, J.get_str_or(d, "text", ""))
    case False{}:
      Nil{}

def anth.pick(hit: Bool, +e: J.Json) -> List<&2, Ex>:
  match hit:
    case True{}:
      anth.delta(
        String.eq(J.get_str_or(W.field_or(e, "delta", J.JNull{}), "type", ""),
          "text_delta"),
        W.field_or(e, "delta", J.JNull{}),
        J.stringify(W.field_or(e, "index", J.JNull{})))
    case False{}:
      Nil{}

def anth(+e: J.Json) -> List<&2, Ex>:
  anth.pick(String.eq(J.get_str_or(e, "type", ""), "content_block_delta"), e)

# Chat Completions: choices[0].delta.content, a string or (Mistral's
# reasoning models) blocks of text and thinking, as Os.content_piece
def chat.block(is_think: Bool, +b: J.Json) -> Ex:
  match is_think:
    case True{}:
      EBrk{}
    case False{}:
      ETxt{"", J.get_str_or(b, "text", "")}

def chat.blocks(bs: List<&2, J.Json>) -> List<&2, Ex>:
  match bs:
    case Nil{}:
      Nil{}
    case Con{+b, rest}:
      Con{chat.block(String.eq(J.get_str_or(b, "type", ""), "thinking"), b),
        chat.blocks(rest)}

def chat.content(+c: J.Json) -> List<&2, Ex>:
  match c:
    case J.JStr{+s}:
      one("", s)
    case J.JArr{+bs}:
      chat.blocks(bs)
    case _:
      Nil{}

def chat.choice(m: Maybe<&2, J.Json>) -> List<&2, Ex>:
  match m:
    case Some{+ch}:
      chat.content(W.field_or(W.field_or(ch, "delta", J.JNull{}), "content",
        J.JNull{}))
    case None{}:
      Nil{}

def chat(+e: J.Json) -> List<&2, Ex>:
  chat.choice(J.arr_get(W.field_or(e, "choices", J.JNull{}), 0n))

# Responses API: response.output_text.delta, its block by item and part
def resp.pick(hit: Bool, +e: J.Json) -> List<&2, Ex>:
  match hit:
    case True{}:
      one(String.concat([J.get_str_or(e, "item_id", ""), "/",
          J.stringify(W.field_or(e, "content_index", J.JNull{}))]),
        J.get_str_or(e, "delta", ""))
    case False{}:
      Nil{}

def resp(+e: J.Json) -> List<&2, Ex>:
  resp.pick(String.eq(J.get_str_or(e, "type", ""), "response.output_text.delta"),
    e)

def of(fam: Api.Style, +e: J.Json) -> List<&2, Ex>:
  match fam:
    case Api.Anthropic{}:
      anth(e)
    case Api.OpenAI{}:
      chat(e)
    case Api.OpenAIResp{}:
      resp(e)

def parsed(r: Result<&2, &2, String, J.Json>, fam: Api.Style) -> List<&2, Ex>:
  match r:
    case Done{+e}:
      of(fam, e)
    case Fail{_}:
      Nil{}

# ---- the fold ----

def key_of(+lv: Lv) -> String:
  match lv:
    case Lv{_, _, _, _, +key, _, _, _}:
      key

def fam_of(+lv: Lv) -> Api.Style:
  match lv:
    case Lv{_, _, +fam, _, _, _, _, _}:
      fam

def on_of(+lv: Lv) -> Bool:
  match lv:
    case Lv{+on, _, _, _, _, _, _, _}:
      on

def apply.txt(same: Bool, +k: String, +t: String, +lv: Lv) -> Lv:
  match same:
    case True{}:
      match lv:
        case Lv{+on, +id, +fam, +tail, +key, +pend, +off, +at}:
          Lv{on, id, fam, tail, key, Con{t, pend}, off, at}
    case False{}:
      match lv:
        case Lv{+on, +id, +fam, +tail, _, _, _, +at}:
          Lv{on, id, fam, tail, k, Con{t, Nil{}}, 0n, at}

def apply.some(empty: Bool, +k: String, +t: String, +lv: Lv) -> Lv:
  match empty:
    case True{}:
      lv
    case False{}:
      apply.txt(Bool.or(String.is_empty(k), String.eq(k, key_of(lv))), k, t,
        lv)

def apply(x: Ex, +lv: Lv) -> Lv:
  match x:
    case ETxt{+k, +t}:
      apply.some(String.is_empty(t), k, t, lv)
    case EBrk{}:
      match lv:
        case Lv{+on, +id, +fam, +tail, +key, _, _, +at}:
          Lv{on, id, fam, tail, String.append(key, "+"), Nil{}, 0n, at}

def applies(xs: List<&2, Ex>, +lv: Lv) -> Lv:
  match xs:
    case Nil{}:
      lv
    case Con{+x, rest}:
      applies(rest, apply(x, lv))

# one complete line, decoded (its newline taken off)
def line(is_data: Bool, +l: String, +lv: Lv) -> Lv:
  match is_data:
    case True{}:
      applies(parsed(J.parse(String.trim(String.drop(l, 5n))), fam_of(lv)),
        lv)
    case False{}:
      lv

# the complete lines of the pieces, decoded (oldest first): the IO half
# decodes them (Enc.utf8.decode), a line holds whole UTF-8 sequences
def read(ls: List<&2, String>, +lv: Lv) -> Lv:
  match ls:
    case Nil{}:
      lv
    case Con{+l, rest}:
      read(rest, line(String.starts_with(l, "data:"), l, lv))

# what a piece gives: its complete raw lines (oldest first) and the
# state that holds the new tail
type Cut is Data:
  Cut{lines: List<&2, String>, lv: Lv}

def with_tail(+tail: List<&2, String>, +lv: Lv) -> Lv:
  match lv:
    case Lv{+on, +id, +fam, _, +key, +pend, +off, +at}:
      Lv{on, id, fam, tail, key, pend, off, at}

def tail_of(+lv: Lv) -> List<&2, String>:
  match lv:
    case Lv{_, _, _, +tail, _, _, _, _}:
      tail

# the segments after the piece's first newline: whole lines, then the
# new tail (the last segment, "" when the piece ends on a newline)
def cut.rest(segs: List<&2, String>, +acc: List<&2, String>, +lv: Lv) -> Cut:
  match segs:
    case Nil{}:
      Cut{List.reverse(&2, String, acc), lv}
    case Con{+s, rest}:
      match rest:
        case Nil{}:
          Cut{List.reverse(&2, String, acc), with_tail(Con{s, Nil{}}, lv)}
        case Con{+h, +t}:
          cut.rest(Con{h, t}, Con{s, acc}, lv)

# the piece's first segment ends the held tail's line, when the piece
# has a newline; else it joins the tail
def cut.segs(segs: List<&2, String>, +lv: Lv) -> Cut:
  match segs:
    case Nil{}:
      Cut{Nil{}, lv}
    case Con{+first, rest}:
      match rest:
        case Nil{}:
          Cut{Nil{}, with_tail(Con{first, tail_of(lv)}, lv)}
        case Con{+h, +t}:
          cut.rest(Con{h, t},
            Con{String.join(List.reverse(&2, String, Con{first, tail_of(lv)}),
              ""), Nil{}},
            with_tail(Nil{}, lv))

def cut.on(on: Bool, +lv: Lv, +piece: String) -> Cut:
  match on:
    case True{}:
      cut.segs(String.split(piece, Tx.newline()), lv)
    case False{}:
      Cut{Nil{}, lv}

# a raw piece of the body: only the piece is scanned
def cut(+lv: Lv, +piece: String) -> Cut:
  cut.on(on_of(lv), lv, piece)

# ---- the emit ----

def has.parts(+ps: List<&2, String>) -> Bool:
  match ps:
    case Nil{}:
      False{}
    case Con{_, _}:
      True{}

# text waits to be sent
def has(+lv: Lv) -> Bool:
  match lv:
    case Lv{_, _, _, _, _, +pend, _, _}:
      has.parts(pend)

# text waits, and the last partial is every_ms() old (now: IO.now, ms)
def due(+lv: Lv, +now: Nat) -> Bool:
  match lv:
    case Lv{_, _, _, _, _, +pend, _, +at}:
      Bool.and(has.parts(pend), Nat.is_le(Nat.add(at, every_ms()), now))

def line_of(+id: String, +off: Nat, +d: String) -> String:
  String.concat(["partial #", id, " +", Nat.show(off), " : ", d])

type Emit is Data:
  Em{line: String, lv: Lv}

def take.d(+d: String, +lv: Lv) -> Emit:
  match lv:
    case Lv{+on, +id, +fam, +tail, +key, +pend, +off, +at}:
      Em{line_of(id, off, d),
        Lv{on, id, fam, tail, key, pend, Nat.add(off, String.length(d)), at}}

# the wire line of the text since the last one, and the state after it
def take(+lv: Lv, +now: Nat) -> Emit:
  match lv:
    case Lv{+on, +id, +fam, +tail, +key, +pend, +off, _}:
      take.d(W.escape_nl(String.join(List.reverse(&2, String, pend), "")),
        Lv{on, id, fam, tail, key, Nil{}, off, now})

# ---- for the laws: every piece fed, then everything taken ----

def feed.cut(c: Cut) -> Lv:
  match c:
    case Cut{+ls, +lv}:
      read(ls, lv)

# an ASCII piece fed whole (the laws: no decoding needed)
def feed(+lv: Lv, +piece: String) -> Lv:
  feed.cut(cut(lv, piece))

def feeds(ps: List<&2, String>, +lv: Lv) -> Lv:
  match ps:
    case Nil{}:
      lv
    case Con{+p, rest}:
      feeds(rest, feed(lv, p))

def emit_line(e: Emit) -> String:
  match e:
    case Em{+l, _}:
      l

def emit_lv(e: Emit) -> Lv:
  match e:
    case Em{_, +lv}:
      lv
