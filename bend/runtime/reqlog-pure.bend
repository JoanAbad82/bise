# runtime/reqlog-pure.bend — the request ring, pure side (/debug completion).
#
# Every model call writes the exact body it sends, and the neutral wire
# request it was made from, into a ring of slots in the folder the hub
# names (BEND_WIRE_DUMP, agents/<a>/requests/): slot = req mod slots(),
# so the folder never holds more than slots() requests and no one
# prunes it. Per slot: <slot>.json (the body), <slot>.wire (the wire
# request, the input of Pv.request_body), <slot>.json.reply (the raw
# reply of a family that answers whole), then <slot>.meta last: one JSON
# line with the byte lengths of the .json and the .wire. A reader trusts
# a slot only when the .meta is there and both lengths match (else it is
# being written). The order of the slots is the .meta's mtime, never
# the slot number (a restart counts req from 1 again). The .json is the
# body before its file parts are read: an image's base64 is there as
# Http.file_part (NUL "bend-file:<size>:<path>" NUL), whose file the HTTP
# client sends in its place; the ring never copies it (8 slots of up to
# 24 MB per agent). The reader puts the file back (bise_session::reqlog::
# expand, the render mode's output too).
# runtime/reqlog.bend runs the writes.
import Base
import ../vendor/json.bend as J

# how many requests the ring keeps
def slots() -> Nat:
  8n

def slot(+req: U32) -> Nat:
  Nat.mod(U32.to_nat(req), slots())

# a slot's file: dir ends with "/" (the hub's folder)
def path(+dir: String, +req: U32, +ext: String) -> String:
  String.concat([dir, Nat.show(slot(req)), ext])

# what the call was for: the agent's answer (live) or the compaction's
# summary (a session call that is not live)
def kind(live: Bool) -> String:
  match live:
    case True{}:
      "turn"
    case False{}:
      "compaction"

# the bytes a char takes in UTF-8 (File.write writes a String as UTF-8)
def utf8_width.pick(one: Bool, two: Bool, three: Bool) -> Nat:
  match one:
    case True{}:
      1n
    case False{}:
      match two:
        case True{}:
          2n
        case False{}:
          match three:
            case True{}:
              3n
            case False{}:
              4n

def utf8_width(+c: U32) -> Nat:
  utf8_width.pick(U32.is_lt(c, 128), U32.is_lt(c, 2048), U32.is_lt(c, 65536))

def utf8_len.go(s: String, +acc: Nat) -> Nat:
  match s:
    case SNil{}:
      acc
    case SCon{Chr{+c}, t}:
      utf8_len.go(t, Nat.add(acc, utf8_width(c)))

# the length of the file File.write makes of s
def utf8_len(s: String) -> Nat:
  utf8_len.go(s, 0n)

# the .meta line: req, kind, the full model id (provider/model), the
# attempt, the call's id (its start, ms) and the two lengths
def meta(+req: U32, +kind: String, +model: String, +tries: Nat,
    +call: Nat, +json_len: Nat, +wire_len: Nat) -> String:
  String.concat(["{\"req\":", U32.show(req), ",\"kind\":", J.quote_string(kind),
    ",\"model\":", J.quote_string(model), ",\"try\":", Nat.show(tries),
    ",\"call\":", Nat.show(call), ",\"json_len\":", Nat.show(json_len),
    ",\"wire_len\":", Nat.show(wire_len), "}\n"])
