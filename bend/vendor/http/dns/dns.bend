# Name resolution through the OS resolver.
import Base
import ../wire.bend as Wire
import ./dns-pure.bend as Dnp

# A host name to the IPv4 addresses to connect to, through the OS resolver
# (getaddrinfo, Wire.lookup): /etc/hosts, CNAMEs, scoped and split DNS, as
# curl sees them. connect is IPv4 only, so IPv6 addresses are left out.
# The pure half (the answer's mapping, the words, the try-in-order loop) is
# dns-pure.bend.
#   import ./dns/dns.bend as Dns
# bise patch (keep it on a vendor refresh): the published module sent its own
# UDP queries to the nameservers of /etc/resolv.conf and kept the first A
# record; a name that is an alias (CNAME) had none, so it failed, and on macOS
# resolv.conf is not where the resolver's config lives (scoped and split DNS).

def resolve.if(+host: String, literal: Bool) -> IO(Result<&2, &2, Dnp.Miss, List<&2, String>>):
  match literal:
    case True{}:
      IO.pure(Result<&2, &2, Dnp.Miss, List<&2, String>>, Done{[host]})
    case False{}:
      do IO<Result<&2, &2, Dnp.Miss, List<&2, String>>>:
        r : Result<&1, &1, U32 & String, List<&2, String>> <- Wire.lookup(host)
        return Dnp.found(r)

# The IPv4 addresses for host, in the resolver's order, never empty: an IPv4
# literal as is, any other name through the OS resolver.
def resolve(+host: String) -> IO(Result<&2, &2, Dnp.Miss, List<&2, String>>):
  resolve.if(host, Dnp.ipv4(host))
