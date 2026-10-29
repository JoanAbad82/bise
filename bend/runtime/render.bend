# runtime/render.bend — a request's body for another model, no call.
#
#   BISE_RENDER=<wire file> BISE_RENDER_OUT=<file> BISE_MODEL=<p/model> ./repl-live
#
# /debug completion <provider>: the hub runs this on a ring slot's .wire
# (runtime/reqlog-pure.bend) to show the body that provider's family
# would get for the same request. The body comes from Pv.request_body,
# the function every model call sends, so it is never a second encoder.
# No network, no key read (the keys go in headers, never shown). An image
# whose file is gone goes in as the text request_body makes of it.
# Writes the body (UTF-8, like the ring's .json) to BISE_RENDER_OUT, then
# prints one line: RENDER_OK, or RENDER_ERR <why>.
import Base
import ../core/wire.bend as W
import ./persist.bend as P
import ./provider.bend as Pv
import ./provider-pure.bend as Pvp

def built_text(b: Pv.Built) -> String:
  match b:
    case Pv.Built{_, _, _, _, _, +fill, _}:
      Pv.fill_body(fill)

@unsafe
def write(+out: String, +request: String, +pv: Pvp.Prov) -> IO(Unit):
  do IO<Unit>:
    +limit : Nat <- Pv.req_limit()
    b : Pv.Built <- Pv.request_body(request, pv, limit)
    w : Unit <- P.write_file(out, built_text(b))
    IO.print("RENDER_OK")

@unsafe
def resolved(r: Pvp.Resolved, +out: String, +request: String) -> IO(Unit):
  match r:
    case Pvp.ROk{+pv}:
      write(out, request, pv)
    case Pvp.RErr{+id, +msg}:
      IO.print(String.concat(["RENDER_ERR ", id, ": ", W.escape_nl(msg)]))

@unsafe
def read(m: Maybe<&2, String>, +out: String) -> IO(Unit):
  match m:
    case Some{+request}:
      do IO<Unit>:
        r : Pvp.Resolved <- Pv.resolution()
        resolved(r, out, request)
    case None{}:
      IO.print("RENDER_ERR the request file is unreadable")

@unsafe
def run(+path: String) -> IO(Unit):
  do IO<Unit>:
    o : Result<&1, &1, U32 & String, String> <- IO.get_env("BISE_RENDER_OUT")
    m : Maybe<&2, String> <- P.read_file(path)
    read(m, P.env_or(o, String.append(path, ".out")))
