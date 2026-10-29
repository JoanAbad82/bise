# tests/repl_read_cost.py's probe: feeds a `say` line of $PROBE_CHUNKS
# chunks of 4096 chars, then its newline, through runtime/repl-core-pure's
# feed (what repl-core.bend does per recv), and prints the commands' count
# and the first one's length.
import Base
import ../bend/runtime/repl-core-pure.bend as Rp

def xs(n: Nat) -> String:
  match n:
    case 0n:
      ""
    case 1n+p:
      SCon{Chr{120}, xs(p)}

def carry_of(f: List<&2, String> & List<&2, String>) -> List<&2, String>:
  match f:
    case (_, +carry):
      carry

def lines_of(f: List<&2, String> & List<&2, String>) -> List<&2, String>:
  match f:
    case (+lines, _):
      lines

def feed_n(n: Nat, +chunk: String, +carry: List<&2, String>) -> List<&2, String>:
  match n:
    case 0n:
      carry
    case 1n+p:
      feed_n(p, chunk, carry_of(Rp.feed(carry, chunk)))

def first_len(+lines: List<&2, String>) -> Nat:
  match lines:
    case Nil{}:
      0n
    case Con{+h, _}:
      String.length(h)

def show(+lines: List<&2, String>) -> String:
  String.concat([Nat.show(List.length(&2, String, lines)), " ", Nat.show(first_len(lines))])

def n_of(r: Result<&1, &1, U32 & String, String>) -> Nat:
  match r:
    case Done{+s}:
      U32.to_nat(Maybe.default(&2, U32, U32.read(s), 1))
    case Fail{_}:
      1n

def main() -> IO(Unit):
  do IO<Unit>:
    r : Result<&1, &1, U32 & String, String> <- IO.get_env("PROBE_CHUNKS")
    +carry : List<&2, String> <- IO.pure(List<&2, String>, feed_n(n_of(r), xs(4096n), Con{"say ", Nil{}}))
    IO.print(show(lines_of(Rp.feed(carry, "\n"))))
