# runtime/threshold-pure.bend - the compaction threshold (BISE-300,
# issue #18), moved out of runtime/provider-pure.bend: a value written
# in tokens or as a share of the model's window, never above 85 % of it;
# none: 450k for a window of 1M or more, else 85 % of the window
# (Gabriel, page token-audit). Pure: no IO. Rust keeps the same rule
# (rust/catalog/src/threshold.rs); both hold the rows of
# rust/catalog/testdata/compaction_threshold.tsv (law threshold_rows).
import Base
import ../core/config.bend as Cf

# 85 % of a window, rounded down (no overflow: n / 20 first): the most
# any threshold gets
def threshold_of(+n: U32) -> U32:
  ((n / 20) * 17 + ((n % 20) * 17) / 20 : U32)

# the threshold nothing writes: 450k from a 1M window (a 1M window
# compacted at 800k re-sent up to 800k tokens a call, issue #18), else
# 85 % of the window
def thr_default.pick(big: Bool, +window: U32) -> U32:
  match big:
    case True{}:
      U32.min(450000, threshold_of(window))
    case False{}:
      threshold_of(window)

def thr_default(+window: U32) -> U32:
  thr_default.pick(U32.is_lt(999999, window), window)

# ---- the threshold as written (BISE-300) ----
# a number of tokens ("450000") or a share of the window ("45%"); 0,
# empty or anything else: None (the default applies)
def thr_value.some(zero: Bool, +n: U32) -> Maybe<&2, U32>:
  match zero:
    case True{}:
      None{}
    case False{}:
      Some{n}

def thr_value.num(m: Maybe<&2, U32>) -> Maybe<&2, U32>:
  match m:
    case Some{+n}:
      thr_value.some(U32.is_eq(n, 0), n)
    case None{}:
      None{}

# p % of a window, rounded down; p above 100 counts as 100 (no
# overflow: window / 100 first)
def pct_of(+p: U32, +window: U32) -> U32:
  +q = U32.min(p, 100)
  ((window / 100) * q + ((window % 100) * q) / 100 : U32)

def thr_value.pct(m: Maybe<&2, U32>, +window: U32) -> Maybe<&2, U32>:
  match m:
    case Some{+p}:
      thr_value.num(Some{pct_of(p, window)})
    case None{}:
      None{}

def thr_value.split(pct: Bool, +t: String, +window: U32) -> Maybe<&2, U32>:
  match pct:
    case True{}:
      thr_value.pct(U32.read(String.trim(String.take(t,
        Nat.sub(String.length(t), 1n)))), window)
    case False{}:
      thr_value.num(U32.read(t))

def thr_value(+s: String, +window: U32) -> Maybe<&2, U32>:
  +t = String.trim(s)
  thr_value.split(String.ends_with(t, "%"), t, window)

# a value, capped at 85 % of the window; none: the default. A number
# written for a 1M model never overflows a 200k one (an agent on a
# smaller model, BISE-298's roles).
def thr_capped(m: Maybe<&2, U32>, +window: U32) -> U32:
  match m:
    case Some{+n}:
      U32.min(n, threshold_of(window))
    case None{}:
      thr_default(window)

def threshold.pick(empty: Bool, +envv: String, +cfgt: String,
    +window: U32) -> U32:
  match empty:
    case True{}:
      thr_capped(thr_value(Cf.cfg_or(Cf.cfg_get(cfgt,
        "compaction_threshold"), ""), window), window)
    case False{}:
      thr_capped(thr_value(envv, window), window)

# the compaction threshold: BEND_THRESHOLD (envv) > config.toml
# `compaction_threshold` > the default (thr_default); a value written is
# a number of tokens or "45%" of the window, never above 85 % of it
def threshold(+envv: String, +cfgt: String, +window: U32) -> U32:
  threshold.pick(String.is_empty(envv), envv, cfgt, window)
