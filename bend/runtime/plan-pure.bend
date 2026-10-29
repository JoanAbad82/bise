# bend/runtime/plan-pure.bend: a ChatGPT plan's own rules in the runtime,
# pure (chatgpt-default, architect m_33751: out of provider-pure).
# - its final failures' lines (shape = "chatgpt-plan": a usage limit,
#   plan use off, usage not checked, a sign-in expired; a model the plan
#   refuses), which provider-pure's attempt_plan reads;
# - the swap the catalog writes in the models file ([swaps],
#   rust/catalog/src/plan_list.rs): a lookup, once, never chained;
# - the swap's note, once per session and pair (its marker next to the
#   session file; runtime/plan.bend writes it).
# The designer's lines (docs/subscriptions-design.md, final words §5).
# OpenAI's plan route says a usage limit with a code, in a non-200 JSON
# body (429, 503) or mid-stream in response.failed (a 200): either way
# the turn stops on bise's line, never a retry loop on a limit nor an
# "OpenAI refused the key" on a sign-in that expired.
import Base
import ../core/config.bend as Cf
import ../core/gen/obs.bend as OG

# subscription_sharing_usage_limit_exceeded: OpenAI says not to infer a
# reset time from it, so the line points at the usage page
def PLAN_LIMIT() -> String:
  "your ChatGPT plan's limit for bise is reached. your usage is at chatgpt.com/settings/usage, or switch model with /model."

# subscription_sharing_user_not_eligible (403): final, no retry
def PLAN_OFF() -> String:
  "ChatGPT plan use is off for bise. turn it on in your ChatGPT settings, or pick another provider in /provider."

# subscription_sharing_usage_unavailable, once the retries are spent
def PLAN_UNCHECKED_LINE() -> String:
  "ChatGPT couldn't check your plan's usage. try again in a moment, or switch model with /model."

def PLAN_EXPIRED() -> String:
  "your ChatGPT sign-in expired. sign in again in /provider, or run bise login chatgpt."

# the retries' cause while ChatGPT cannot check the plan's usage
# (subscription_sharing_usage_unavailable: OpenAI's errors-and-recovery
# says retry later with a bounded backoff); PLAN_UNCHECKED_LINE is said
# only once the retries are spent (exhausted_for)
def PLAN_UNCHECKED() -> String:
  "ChatGPT could not check your plan's usage (subscription_sharing_usage_unavailable)"

# the final line for a reply's status and error code, None: not one of
# the plan's final failures (a usage limit, plan use not allowed, a
# sign-in refused)
def plan_line(+status: U32, +code: String) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>,
    String.eq(code, "subscription_sharing_usage_limit_exceeded"),
    Some{PLAN_LIMIT()},
    Bool.pick(Maybe<&2, String>,
      String.eq(code, "subscription_sharing_user_not_eligible"),
      Some{PLAN_OFF()},
      Bool.pick(Maybe<&2, String>, U32.is_eq(status, 401),
        Some{PLAN_EXPIRED()}, None{})))

# the plan refused the model itself: a 400 "The '<id>' model is not
# supported when using Codex with a ChatGPT account" (the plan changed
# since bise cached its list, rust/catalog/src/plan_list.rs): final, no
# retry, the line says what to do. Any other attempt unchanged
def PLAN_MODEL_REFUSED() -> String:
  "not supported when using Codex with a ChatGPT account"

def plan_model_line(+model: String) -> String:
  String.concat([model, " isn't on your ChatGPT plan any more. pick another with /model, or run bise login chatgpt to refresh the list."])

def plan_refused(plan: Bool, +status: U32, +body: String) -> Bool:
  Bool.and(plan, Bool.and(U32.is_eq(status, 400),
    String.contains(body, PLAN_MODEL_REFUSED())))

# its final line, None: not that refusal (provider-pure's attempt_plan.line
# ends the attempt on it)
def refused_line.pick(refused: Bool, +model: String) -> Maybe<&2, String>:
  match refused:
    case True{}:
      Some{plan_model_line(model)}
    case False{}:
      None{}

def refused_line(plan: Bool, +status: U32, +body: String, +model: String)
    -> Maybe<&2, String>:
  refused_line.pick(plan_refused(plan, status, body), model)

# a plan's swap (the models file's [swaps], written by the catalog,
# rust/catalog/src/plan_list.rs): the model the plan runs instead of a
# full id its list lacks. A lookup, like an alias: once, never chained;
# an id with no row is unchanged
def swap_key(+id: String) -> String:
  String.concat(["swaps.\"", id, "\""])

def swapped(+id: String, +reg: List<&2, Cf.KV>) -> String:
  Maybe.default(&2, String, Cf.cfg_find(reg, swap_key(id)), id)

# ---- the swap note: once per session and pair (architect m_33712) ----
# The marker: the session's swapped pairs, "<from> <to>" one per line,
# next to its session file (BEND_SESSION_FILE); written by the runtime
# alone, read by no one else, gone with the session.
def swap_marker_path(+session_file: String) -> String:
  String.append(session_file, ".swaps")

def swap_pair(+from: String, +to: String) -> String:
  String.concat([from, " ", to])

# say it: a swap (from != to) whose pair the marker doesn't hold
def say_swap(+marker: String, +from: String, +to: String) -> Bool:
  Bool.and(Bool.not(String.eq(from, to)),
    Bool.not(String.contains(String.append("\n", marker),
      String.concat(["\n", swap_pair(from, to), "\n"]))))

# the marker once the pair is said
def swap_marked(+marker: String, +from: String, +to: String) -> String:
  String.concat([marker, swap_pair(from, to), "\n"])

# the obs line (rust/proto Obs::ModelSwapped): ids hold no space
def swap_note(+from: String, +to: String) -> String:
  OG.model_swapped(from, to)
