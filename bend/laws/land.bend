# bend/laws/land.bend: what `sb land` takes, and its line (issue 37 #3,
# plan-3 signed by architect m_36620). bend/hub/land.bend decides; the
# shell runs git and the check. Closed by bend/proofs/land.bend; the gate
# checks every bend/proofs/*.bend. The pick's whole table is
# rust/proto/fixtures/land_pick.jsonl (today's Rust pick, byte-equal; a
# Rust test drives sb-core on every line): the instances below are its
# small rows.
import Base
import ../vendor/json.bend as J
import ../hub/land.bend as HL

# ---- the line ----

# LAW one_go_per_target: while a ticket of `target` holds go, no other
# ticket of it gets go: the line stays as it is.
law one_go_per_target:
  for +ls: List<&2, J.Json>
  for +target: String
  for e: {HL.held(ls, target) == True{} : Bool}
  {HL.grant(ls, target) == (ls, None{}) : List<&2, J.Json> & Maybe<&2, Nat>}

# LAW unknown_end_noop: the end of a ticket the line does not know (a land
# from before a core restart that its shell did not give back) gives go to
# no one.
law unknown_end_noop:
  for +ls: List<&2, J.Json>
  for +n: Nat
  for e: {HL.target_of(ls, n) == None{} : Maybe<&2, String>}
  {HL.end(ls, n) == (HL.drop(ls, n), None{}) : List<&2, J.Json> & Maybe<&2, Nat>}

# instance: two lands of main, a: first gets go; b waits; a's end gives b go
law line_fifo:
  {HL.join(Nil{}, 1n, "refs/heads/main", "wt:a", "a", "refs/heads/main")
    == ([HL.ticket(1n, "refs/heads/main", "wt:a", "a", "refs/heads/main", True{})], Some{1n})
    : List<&2, J.Json> & Maybe<&2, Nat>}

law line_second_waits:
  {HL.join([HL.ticket(1n, "refs/heads/main", "wt:a", "a", "refs/heads/main", True{})], 2n, "refs/heads/main", "wt:b", "b", "refs/heads/main")
    == ([HL.ticket(1n, "refs/heads/main", "wt:a", "a", "refs/heads/main", True{}), HL.ticket(2n, "refs/heads/main", "wt:b", "b", "refs/heads/main", False{})], None{})
    : List<&2, J.Json> & Maybe<&2, Nat>}

law end_frees:
  {HL.end([HL.ticket(1n, "refs/heads/main", "wt:a", "a", "refs/heads/main", True{}), HL.ticket(2n, "refs/heads/main", "wt:b", "b", "refs/heads/main", False{})], 1n)
    == ([HL.ticket(2n, "refs/heads/main", "wt:b", "b", "refs/heads/main", True{})], Some{2n})
    : List<&2, J.Json> & Maybe<&2, Nat>}

# another target's line is its own: a land of sb/c goes while main's runs
law lines_per_target:
  {HL.join([HL.ticket(1n, "refs/heads/main", "wt:a", "a", "refs/heads/main", True{})], 2n, "refs/heads/sb/c", "wt:c", "c", "refs/heads/main")
    == ([HL.ticket(1n, "refs/heads/main", "wt:a", "a", "refs/heads/main", True{}), HL.ticket(2n, "refs/heads/sb/c", "wt:c", "c", "refs/heads/main", True{})], Some{2n})
    : List<&2, J.Json> & Maybe<&2, Nat>}

# ---- claims: one land of a place at a time ----

law claim_once:
  {HL.in_line([HL.claim("wt:a", 1000n)], "wt:a") == Some{1000n} : Maybe<&2, Nat>}

law claim_ended:
  {HL.in_line(HL.unclaim([HL.claim("wt:a", 1000n)], "wt:a"), "wt:a") == None{} : Maybe<&2, Nat>}

law claim_here_per_agent:
  {HL.in_line([HL.claim(HL.claim_key("shared", "x", True{}), 5000n)], HL.claim_key("shared", "y", True{})) == None{} : Maybe<&2, Nat>}

# ---- words, byte-equal with today's Rust ----

law busy_words:
  {HL.busy(0n, 725000n) == "a land of this place is in line or checking (since 12 min): its result comes to you. Changes you made after it started land with your next sb land, once it ends." : String}

law lids:
  {[HL.lid(1n), HL.lid(2n), HL.lid(3n), HL.lid(11n), HL.lid(22n)] == ["landing", "waits to land · 2nd", "waits to land · 3rd", "waits to land · 11th", "waits to land · 22nd"] : List<&2, String>}
