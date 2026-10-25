# hub/forward.bend - msg-forward (architect m_41072): `sb send <agent>
# --forward m_<n> ["<note>"]` and `sb spawn --forward m_<n>`, a message
# forwarded by its id. Pure: the door, the text and the parts of the
# forward; core.bend sends it (laws in bend/laws/forward.bend).
#
# - the door: only a message the forwarder got or sent, under any of its
#   names (a renamed agent keeps its messages); an unknown id is refused;
# - the text: the forwarder's note (if any), a header line, then the
#   original's text whole (for a message with parts it is already their
#   render: its image markers reach the model). The header is for the
#   model only: every other reader takes the forwarded id from Msg.fwd,
#   never from this text;
# - the parts: none when the original has none, else a text part (the
#   note and the header) in front of the original's, as a brief's head
#   (newtask.bend brief_parts), so they render to the text;
# - `at`: the original's time as the shell formats it ("" leaves it out).
import Base
import ./model.bend as M
import ./gen/state.bend as S
import ./newtask.bend as NT

type Door is Data:
  FOk{m: S.Msg}
  FErr{e: String}

def mid(+n: Nat) -> String:
  String.append("m_", Nat.show(n))

def not_yours(+id: Nat) -> String:
  String.append(mid(id), " is not a message you got or sent: forward only your own thread's messages")

def unknown(+id: Nat) -> String:
  String.append(mid(id), " unknown: no such message to forward")

# the sender (`names`: all its names) sent or got `m`
def mine(+names: List<&2, String>, +m: S.Msg) -> Bool:
  M.str_in(names, S.Msg.from(m)) || M.str_in(names, S.Msg.to(m))

def door.pick(ok: Bool, +m: S.Msg) -> Door:
  match ok:
    case True{}:
      FOk{m}
    case False{}:
      FErr{not_yours(S.Msg.id(m))}

def door.of(m: Maybe<&2, S.Msg>, +names: List<&2, String>, +id: Nat) -> Door:
  match m:
    case None{}:
      FErr{unknown(id)}
    case Some{+x}:
      door.pick(mine(names, x), x)

# the message `id` for `sender`, or why not
def door(+st: S.St, +sender: String, +id: Nat) -> Door:
  door.of(M.msg_of(st, id), M.names_of(st, sender), id)

# who a party is, in the header
def who.pick(user: Bool, +n: String) -> String:
  match user:
    case True{}:
      "the user"
    case False{}:
      n

def who(+n: String) -> String:
  who.pick(String.eq(n, M.USER()), n)

def at_part(empty: Bool, +at: String) -> String:
  match empty:
    case True{}:
      ""
    case False{}:
      String.append(" · ", at)

# the header line (with its newline)
def header(+m: S.Msg, +by: String, +at: String) -> String:
  String.concat(["[forwarded ", mid(S.Msg.id(m)), " · from ", who(S.Msg.from(m)), " to ", who(S.Msg.to(m)),
    at_part(String.is_empty(at), at), " · forwarded by ", by, " · its place: sb show ", mid(S.Msg.id(m)), "]\n"])

def lead.pick(empty: Bool, +note: String, +h: String) -> String:
  match empty:
    case True{}:
      h
    case False{}:
      String.concat([note, "\n\n", h])

# what comes before the original's text: the note, then the header
def lead(+note: String, +m: S.Msg, +by: String, +at: String) -> String:
  lead.pick(M.trim_is_empty(note), note, header(m, by, at))

# the forward's text: the lead, then the original's text whole
def text(+note: String, +m: S.Msg, +by: String, +at: String) -> String:
  String.append(lead(note, m, by, at), S.Msg.text(m))

# the forward's parts: the lead in front of the original's ("" none)
def parts(+note: String, +m: S.Msg, +by: String, +at: String) -> String:
  NT.brief_parts(lead(note, m, by, at), S.Msg.parts(m))

# `sb spawn --forward`: the brief, then its last section, the forwarded
# message (the header, then its text whole)
def brief_lead(+brief: String, +m: S.Msg, +by: String, +at: String) -> String:
  String.concat([brief, "\n\n## Forwarded message\n\n", header(m, by, at)])

def brief(+brief: String, +m: S.Msg, +by: String, +at: String) -> String:
  String.append(brief_lead(brief, m, by, at), S.Msg.text(m))

# the brief's parts: none when the original has none, else the brief and
# the header as a text part in front of the original's
def brief_parts(+brief: String, +m: S.Msg, +by: String, +at: String) -> String:
  NT.brief_parts(brief_lead(brief, m, by, at), S.Msg.parts(m))
