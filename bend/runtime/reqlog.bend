# runtime/reqlog.bend — the request ring, IO side (/debug completion).
#
# Writes one call's slot (runtime/reqlog-pure.bend says what and where)
# into BEND_WIRE_DUMP, before the call goes out, so a hung request can
# be read. Best effort: a failed write never touches the call. No
# folder (BEND_WIRE_DUMP unset: the scripted suites, a one-shot): no-op.
import Base
import ./persist.bend as P
import ./reqlog-pure.bend as Rp

# the ring's folder ("" when none)
def dir() -> IO(String):
  do IO<String>:
    r : Result<&1, &1, U32 & String, String> <- IO.get_env("BEND_WIRE_DUMP")
    IO.pure(String, P.env_or(r, ""))

# the .meta emptied first: a reader in the middle of the write sees no
# lengths, so "being written"; the .meta goes last
def write.go(skip: Bool, +d: String, +req: U32, +kind: String,
    +model: String, +tries: Nat, +call: Nat, +text: String, +wire: String)
    -> IO(Unit):
  match skip:
    case True{}:
      IO.pure(Unit, Unit{})
    case False{}:
      do IO<Unit>:
        m0 : Unit <- P.write_file(Rp.path(d, req, ".meta"), "")
        j : Unit <- P.write_file(Rp.path(d, req, ".json"), text)
        w : Unit <- P.write_file(Rp.path(d, req, ".wire"), wire)
        P.write_file(Rp.path(d, req, ".meta"),
          Rp.meta(req, kind, model, tries, call, Rp.utf8_len(text), Rp.utf8_len(wire)))

# one call's slot: text is the body before its UTF-8 encoding (File.write
# encodes it: the file holds the bytes sent), wire the request it came
# from; live: the agent's answer, else a compaction
def write(+req: U32, live: Bool, +model: String, +tries: Nat, +call: Nat,
    +text: String, +wire: String) -> IO(Unit):
  do IO<Unit>:
    +d : String <- dir()
    write.go(String.is_empty(d), d, req, Rp.kind(live), model, tries, call, text, wire)

# the slot's reply path for the call req ("" when no folder)
def reply_path.pick(empty: Bool, +d: String, +req: U32) -> String:
  match empty:
    case True{}:
      ""
    case False{}:
      Rp.path(d, req, ".json.reply")

def reply_path(+req: U32) -> IO(String):
  do IO<String>:
    +d : String <- dir()
    IO.pure(String, reply_path.pick(String.is_empty(d), d, req))
