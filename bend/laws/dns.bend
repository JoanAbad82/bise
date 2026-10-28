# bend/laws/dns.bend: how the Bend HTTP client turns a host name into the
# addresses it connects to (vendor/http/dns over the OS resolver), the order
# it tries them in (Dnp.each, Http.conn.any's loop), and the line a DNS miss
# shows. Open claims, each one closed by bend/proofs/dns.bend.
import Base
import ../vendor/http/dns/dns-pure.bend as Dnp
import ../runtime/provider-pure.bend as Pv

# ---- the resolver's answer (Wire.lookup) to the addresses to try ----
# A gateway whose name is an alias (CNAME): the OS resolver follows it and
# answers the alias's addresses, IPv6 first on a dual-stack Mac. connect is
# IPv4 only, so the IPv6 ones are dropped and the IPv4 ones kept, in order.

law found_keeps_ipv4_in_order:
  {Dnp.found(Done{["fd7a:115c:a1e0::53", "100.64.0.7", "fd7a:115c:a1e0::54", "100.64.0.8"]})
    == Done{["100.64.0.7", "100.64.0.8"]} : Result<&2, &2, Dnp.Miss, List<&2, String>>}

# LAW: a name with only IPv6 addresses says so, never "check your VPN".
law found_ipv6_only_says_so:
  {Dnp.found(Done{["fd7a:115c:a1e0::53", "2001:db8::1"]})
    == Fail{Dnp.MissV6{"fd7a:115c:a1e0::53, 2001:db8::1"}} : Result<&2, &2, Dnp.Miss, List<&2, String>>}

# LAW: Wire.lookup's codes: 1 no address for the name, 2 no answer, 3 other.
law found_no_address:
  {Dnp.found(Fail{(1, "nodename nor servname provided, or not known")})
    == Fail{Dnp.MissName{"nodename nor servname provided, or not known"}} : Result<&2, &2, Dnp.Miss, List<&2, String>>}

law found_no_answer:
  {Dnp.found(Fail{(2, "temporary failure in name resolution")})
    == Fail{Dnp.MissNet{"temporary failure in name resolution"}} : Result<&2, &2, Dnp.Miss, List<&2, String>>}

law found_other_failure:
  {Dnp.found(Fail{(3, "x")}) == Fail{Dnp.MissOther{"x"}} : Result<&2, &2, Dnp.Miss, List<&2, String>>}

# ---- the line a DNS miss shows (provider calls and MCP alike) ----
# One plain line that says what happened; "check your network or VPN" only
# when the network can be the cause.

law miss_line_no_address:
  {Pv.net_cause("gw.example.com:443", Pv.NDns{Dnp.why(Dnp.MissName{"nodename nor servname provided, or not known"}), Dnp.check(Dnp.MissName{"x"})})
    == "cannot resolve gw.example.com: the system resolver has no address for it (nodename nor servname provided, or not known) — check the host name, your network or VPN"
    : String}

law miss_line_no_answer:
  {Pv.net_cause("gw.example.com", Pv.NDns{Dnp.why(Dnp.MissNet{"temporary failure in name resolution"}), Dnp.check(Dnp.MissNet{"x"})})
    == "cannot resolve gw.example.com: the system resolver did not answer (temporary failure in name resolution) — check your network or VPN"
    : String}

law miss_line_ipv6_only_names_no_network:
  {Pv.net_cause("gw.example.com", Pv.NDns{Dnp.why(Dnp.MissV6{"2001:db8::1"}), Dnp.check(Dnp.MissV6{"x"})})
    == "cannot resolve gw.example.com: it has only IPv6 addresses (2001:db8::1) and bise connects over IPv4"
    : String}

# ---- every address in order (Dnp.each) ----
# A fake connect: 192.0.2.2 answers, 192.0.2.9 fails its handshake, any
# other address does not connect (its error names it). The answer is the
# address that connected. Http.conn.next is the real "go on?": a failed
# connect or its deadline goes on, anything else stops.

type Fake is Data:
  Down{addr: String}
  Handshake{}

def fake.next(+e: Fake) -> Bool:
  match e:
    case Down{_}:
      True{}
    case Handshake{}:
      False{}

def fake.pick(+a: String, ok: Bool) -> Result<&1, &1, Fake, String>:
  match ok:
    case True{}:
      Done{a}
    case False{}:
      Bool.pick(Result<&1, &1, Fake, String>, String.eq(a, "192.0.2.9"), Fail{Handshake{}}, Fail{Down{a}})

def fake.open(+u: Unit, +a: String) -> IO(Result<&1, &1, Fake, String>):
  IO.pure(Result<&1, &1, Fake, String>, fake.pick(a, String.eq(a, "192.0.2.2")))

def tried(addrs: List<&2, String>) -> IO.OP<Result<&1, &1, Fake, String>>:
  Dnp.each(~String, ~Fake, ~Unit, ~(e => fake.next(e)), ~(u => a => fake.open(u, a)), Unit{}, addrs,
    (True{}, Fail{Down{"none"}}))(Result<&1, &1, Fake, String>, x => Emit{x})

law first_address_down_tries_the_next:
  {tried(["192.0.2.1", "192.0.2.2", "192.0.2.3"])
    == Emit{Done{"192.0.2.2"}} : IO.OP<Result<&1, &1, Fake, String>>}

# LAW: when no address connects, the last connect error is the answer.
law no_address_connects_keeps_the_last_error:
  {tried(["192.0.2.1", "192.0.2.3"])
    == Emit{Fail{Down{"192.0.2.3"}}} : IO.OP<Result<&1, &1, Fake, String>>}

# LAW: a failure that is the server's answer (a handshake) stops the walk.
law handshake_failure_stops:
  {tried(["192.0.2.9", "192.0.2.2"])
    == Emit{Fail{Handshake{}}} : IO.OP<Result<&1, &1, Fake, String>>}
