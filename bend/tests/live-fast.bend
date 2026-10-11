# live-fast.bend — the live reader's fast path over every SSE fixture.
#
# The fast path (runtime/live-pure.bend Lp.fast) reads a Messages API
# text delta without J.parse. It is a second reader of the same line, so
# for every line of every fixture, read as each family, it must read what
# J.parse reads or leave the line to it (Lp.agree). The laws pin the
# edge cases (escapes, surrogates, raw UTF-8, a leading zero...); this
# runs it over the recorded streams (architect m_17505).
#
#   cd <repo> && bend bend/tests/live-fast.bend
#
# Gates: no FAIL line, and "ok" with the Anthropic fixtures' text deltas
# read by the fast path (fired > 0).
import Base
import ../core/api.bend as Api
import ../core/text.bend as Tx
import ../runtime/persist.bend as P
import ../runtime/live-pure.bend as Lp

def files() -> List<&2, String>:
  ["tests/providers/anthropic/fake-tool-call.sse",
   "tests/providers/anthropic/foundry-tool-call.sse",
   "tests/providers/anthropic/fake-stream-error.sse",
   "tests/providers/openai-chat/fake-tool-call.sse",
   "tests/providers/openai-chat/fake-stream-error.sse",
   "tests/providers/openai-chat/mistral-tool-call.sse",
   "tests/providers/openai-chat/qa-long-answer.sse",
   "tests/providers/openai-responses/fake-tool-call.sse",
   "tests/providers/openai-responses/fake-stream-error.sse",
   "tests/providers/gemini/fake-tool-call.sse",
   "tests/providers/gemini/fake-stream-error.sse"]

# lines read: (lines, disagreements, fired)
type Tally is Data:
  Tally{lines: Nat, bad: List<&2, String>, fired: Nat}

def bit(b: Bool) -> Nat:
  match b:
    case True{}:
      1n
    case False{}:
      0n

def one.fam(+fam: Api.Style, +name: String, +l: String, t: Tally) -> Tally:
  match t:
    case Tally{+n, +bad, +f}:
      Tally{n, Bool.pick(List<&2, String>, Lp.agree(fam, l), bad,
          Con{String.concat([name, ": ", l]), bad}),
        Nat.add(f, bit(Lp.fires(fam, l)))}

def one(+name: String, +l: String, t: Tally) -> Tally:
  match t:
    case Tally{+n, +bad, +f}:
      one.fam(Api.OpenAIResp{}, name, l,
        one.fam(Api.OpenAI{}, name, l,
          one.fam(Api.Anthropic{}, name, l, Tally{Nat.add(n, 1n), bad, f})))

def lines(ls: List<&2, String>, +name: String, t: Tally) -> Tally:
  match ls:
    case Nil{}:
      t
    case Con{+l, rest}:
      lines(rest, name, one(name, String.trim_end(l), t))

def file.got(m: Maybe<&2, String>, +name: String, t: Tally) -> Tally:
  match m:
    case Some{+s}:
      lines(String.split(s, Tx.newline()), name, t)
    case None{}:
      match t:
        case Tally{+n, +bad, +f}:
          Tally{n, Con{String.append(name, ": unreadable"), bad}, f}

@unsafe
def run(fs: List<&2, String>, t: Tally) -> IO(Tally):
  match fs:
    case Nil{}:
      IO.pure(Tally, t)
    case Con{+f, rest}:
      do IO<Tally>:
        m : Maybe<&2, String> <- P.read_file(f)
        run(rest, file.got(m, f, t))

@unsafe
def say(bad: List<&2, String>) -> IO(Unit):
  match bad:
    case Nil{}:
      IO.pure(Unit, Unit{})
    case Con{+b, rest}:
      do IO<Unit>:
        IO.print(String.append("FAIL ", b))
        say(rest)

@unsafe
def report(t: Tally) -> IO(Unit):
  match t:
    case Tally{+n, +bad, +f}:
      do IO<Unit>:
        say(bad)
        IO.print(String.concat([Bool.pick(String, Bool.and(List.is_empty(&2, String, bad),
            Nat.is_lt(0n, f)), "ok", "FAIL"), " ", Nat.show(n), " lines x 3 families, ",
          Nat.show(f), " read by the fast path"]))

def main() -> IO(Unit):
  do IO<Unit>:
    t : Tally <- run(files(), Tally{0n, Nil{}, 0n})
    report(t)
