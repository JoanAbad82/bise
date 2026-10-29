# tests/dns_lookup.py's probe: for each name in argv, one line
# "<name> ok <addr>,<addr>..." (Wire.lookup, every address, IPv4 and IPv6)
# or "<name> fail <code> <the resolver's words>", then the line the runtime
# shows for it: "<name> resolve <addr>,..." or "<name> resolve: <why>".
import Base
import ../bend/vendor/http/wire.bend as Wire
import ../bend/vendor/http/dns/dns.bend as Dns
import ../bend/vendor/http/dns/dns-pure.bend as Dnp

def raw(+name: String, r: Result<&1, &1, U32 & String, List<&2, String>>) -> String:
  match r:
    case Fail{(+code, +why)}:
      String.concat([name, " fail ", U32.show(code), " ", why])
    case Done{+xs}:
      String.concat([name, " ok ", String.join(xs, ",")])

def cooked(+name: String, r: Result<&2, &2, Dnp.Miss, List<&2, String>>) -> String:
  match r:
    case Fail{+m}:
      String.concat([name, " resolve: ", Dnp.why(m)])
    case Done{+xs}:
      String.concat([name, " resolve ", String.join(xs, ",")])

def each(xs: List<&2, String>) -> IO(Unit):
  match xs:
    case Nil{}:
      IO.pure(Unit, Unit{})
    case Con{+n, t}:
      do IO<Unit>:
        r : Result<&1, &1, U32 & String, List<&2, String>> <- Wire.lookup(n)
        IO.print(raw(n, r))
        c : Result<&2, &2, Dnp.Miss, List<&2, String>> <- Dns.resolve(n)
        IO.print(cooked(n, c))
        each(t)

def args.copy(xs: List<String>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{h, t}:
      Con{h, args.copy(t)}

# argv less the program
def args.rest(xs: List<String>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{h, t}:
      args.copy(t)

def main() -> IO(Unit):
  do IO<Unit>:
    xs : List<String> <- IO.args()
    each(args.rest(xs))
