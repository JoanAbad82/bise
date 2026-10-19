# bend/laws/plans.bend: a ChatGPT plan's own rules in the runtime
# (runtime/plan-pure.bend, chatgpt-default): the catalog's swaps, their
# note once per session and pair, a model the plan refuses. Open claims,
# each one closed by bend/proofs/plans.bend.
import Base
import ../runtime/provider-pure.bend as Pv
import ../runtime/plan-pure.bend as Plan

# ---- a plan's swaps (rust/catalog/src/plan_list.rs, chatgpt-default) ----
# The catalog writes [swaps] in the models file: a model the plan's
# cached list lacks -> the plan's pick. The runtime only looks it up,
# like an alias (architect m_33697).

# LAW: an id with no row is unchanged.
law swap_absent_unchanged:
  for +id: String
  {Plan.swapped(id, Nil{}) == id : String}

# LAW: a swapped main resolves to its target (no 400 paid per call).
law swap_resolves_to_its_target:
  {Pv.shown_model(Pv.resolve("", "", "", "", "model = \"chatgpt/gpt-6.1-sol\"",
      "[swaps]
\"chatgpt/gpt-6.1-sol\" = \"chatgpt/gpt-6-luna\"
[providers.chatgpt]
api = \"openai-responses\"
base_url = \"https://api.openai.com/v1\"", ""))
    == "chatgpt/gpt-6-luna" : String}

# LAW: a swap applies once, never chained (a -> b, b -> c: a runs b).
law swap_never_chained:
  {Pv.shown_model(Pv.resolve("", "", "", "", "model = \"chatgpt/a\"",
      "[swaps]
\"chatgpt/a\" = \"chatgpt/b\"
\"chatgpt/b\" = \"chatgpt/c\"
[providers.chatgpt]
api = \"openai-responses\"
base_url = \"https://api.openai.com/v1\"", ""))
    == "chatgpt/b" : String}

# LAW: a plan that refuses the model (400, "not supported when using
# Codex with a ChatGPT account") ends the turn on one line that names
# it and says what to do; never a retry.
law plan_refused_model_line:
  {Plan.refused_line(True{}, 400,
      "{\"detail\":\"The 'gpt-6.1-sol' model is not supported when using Codex with a ChatGPT account.\"}",
      "gpt-6.1-sol")
    == Some{"gpt-6.1-sol isn't on your ChatGPT plan any more. pick another with /model, or run bise login chatgpt to refresh the list."} : Maybe<&2, String>}

# LAW: another 400, or the same words off a plan, change nothing.
law plan_refused_only_that_400:
  {Bool.or(Plan.plan_refused(True{}, 400, "{\"error\":\"bad\"}"),
      Bool.or(Plan.plan_refused(False{}, 400, "not supported when using Codex with a ChatGPT account"),
        Plan.plan_refused(True{}, 403, "not supported when using Codex with a ChatGPT account")))
    == False{} : Bool}

# LAW: the swap note is said once per session and pair: an empty marker
# says it, the marker written then holds it and stays quiet, a new pair
# says again, no swap (from = to) never says.
law swap_said_once_per_pair:
  {Bool.and(Plan.say_swap("", "chatgpt/gpt-6.1-sol", "chatgpt/gpt-6-luna"),
    Bool.and(Bool.not(Plan.say_swap(Plan.swap_marked("", "chatgpt/gpt-6.1-sol", "chatgpt/gpt-6-luna"),
        "chatgpt/gpt-6.1-sol", "chatgpt/gpt-6-luna")),
      Bool.and(Plan.say_swap(Plan.swap_marked("", "chatgpt/gpt-6.1-sol", "chatgpt/gpt-6-luna"),
          "chatgpt/gpt-6-astra", "chatgpt/gpt-6-luna"),
        Bool.not(Plan.say_swap("", "chatgpt/gpt-6-luna", "chatgpt/gpt-6-luna")))))
    == True{} : Bool}

# LAW: the note is the obs line Rust parses (Obs::ModelSwapped).
law swap_note_is_an_obs_line:
  {Plan.swap_note("chatgpt/gpt-6.1-sol", "chatgpt/gpt-6-luna")
    == "  obs: model_swapped: chatgpt/gpt-6.1-sol chatgpt/gpt-6-luna" : String}

# LAW: the note's <from> is the id asked before the swap.
law swap_asked_is_before_the_swap:
  {Pv.asked_chosen("", "", "", "", "", "model = \"chatgpt/gpt-6.1-sol\"",
      "[swaps]
\"chatgpt/gpt-6.1-sol\" = \"chatgpt/gpt-6-luna\"")
    == "chatgpt/gpt-6.1-sol" : String}
