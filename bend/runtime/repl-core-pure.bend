# runtime/repl-core-pure.bend - the pure half of runtime/repl-core.bend: everything the laws pin, with
# no IO, no @unsafe and no foreign code in its closure (the
# PROOF gate refuses any in the import closure since Bend 2.0.32).
import Base
import ../core/wire.bend as W
import ./model.bend as M
import ../core/types.bend as T
import ../core/text.bend as Tx
import ../vendor/json.bend as J

# TCP.recv's None (bend 2.0.37: the peer sent everything) is the closed
# connection the empty text was before
def recv_text(m: Maybe<&1, String>) -> String:
  match m:
    case None{}:
      ""
    case Some{+d}:
      d

# the same for TCP.recv_bytes: None, the closed connection, is no bytes
def recv_bytes(m: Maybe<&1, List<&2, U32>>) -> List<&2, U32>:
  match m:
    case None{}:
      Nil{}
    case Some{+d}:
      d

# ---- what one input line asks for ----

type Plan is Data:
  PRun{cmds: List<&2, T.Cmd>, script: List<&2, M.Reply>}
  PHelp{}
  PQuit{}
  PReload{}

# the scripted model's plan for a turn
def script_for.prog(is_prog: Bool, +text: String) -> List<&2, M.Reply>:
  match is_prog:
    case True{}:
      Con{M.ROk{"", Con{T.Call{1, "run_typescript",
          String.trim(String.drop(text, 5n))}, Nil{}}},
        Con{M.ROk{"Program complete.", Nil{}}, Nil{}}}
    case False{}:
      Con{M.ROk{String.append("You said: ", text), Nil{}}, Nil{}}

def script_for(is_tools: Bool, is_prog: Bool, +text: String)
    -> List<&2, M.Reply>:
  match is_tools:
    case True{}:
      Con{M.ROk{"", Con{T.Call{1, "search_tool_functions", "best_match: catalog"},
            Nil{}}},
        Con{M.ROk{"I searched the catalog.", Nil{}}, Nil{}}}
    case False{}:
      script_for.prog(is_prog, text)

def script_for_entry(+text: String) -> List<&2, M.Reply>:
  script_for(String.starts_with(text, "tools"),
    String.starts_with(text, "prog:"), text)

# ---- a script file (BEND_SCRIPT_FILE, scripted REPL only) ----
# A JSON object: user text -> the replies of its turn, in order:
#   {"<text>": [{"text": "...", "calls": [{"name": "bash", "args": "ls"}]},
#               {"fail": true}]}
# A text the file does not name keeps script_for_entry's replies. The
# session-log fixture scenarios replay through it (BISE-195).

def json_str(j: J.Json) -> String:
  match j:
    case J.JStr{+s}:
      s
    case _:
      ""

def json_true(j: J.Json) -> Bool:
  match j:
    case J.JBool{+b}:
      b
    case _:
      False{}

def script.calls(xs: List<&2, J.Json>, +n: U32) -> List<&2, T.Call>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+x, rest}:
      Con{T.Call{n, json_str(W.field_or(x, "name", J.JNull{})),
          json_str(W.field_or(x, "args", J.JNull{}))},
        script.calls(rest, U32.add(n, 1))}

def script.calls_of(j: J.Json) -> List<&2, T.Call>:
  match j:
    case J.JArr{+xs}:
      script.calls(xs, 1)
    case _:
      Nil{}

def script.reply(fail: Bool, +x: J.Json) -> M.Reply:
  match fail:
    case True{}:
      M.RFail{}
    case False{}:
      M.ROk{json_str(W.field_or(x, "text", J.JNull{})),
        script.calls_of(W.field_or(x, "calls", J.JNull{}))}

def script.replies(xs: List<&2, J.Json>) -> List<&2, M.Reply>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+x, rest}:
      Con{script.reply(json_true(W.field_or(x, "fail", J.JNull{})), x),
        script.replies(rest)}

def script.pick(j: J.Json, +dflt: List<&2, M.Reply>) -> List<&2, M.Reply>:
  match j:
    case J.JArr{+xs}:
      script.replies(xs)
    case _:
      dflt

def script_key(cmds: List<&2, T.Cmd>) -> String:
  match cmds:
    case Con{T.UserMsg{_, +t}, _}:
      t
    case _:
      ""

# the replies the file gives the plan's first user text, else `dflt`
def script_lookup(+body: String, +key: String, +dflt: List<&2, M.Reply>)
    -> List<&2, M.Reply>:
  script.pick(W.field_or(W.parse_json(body), key, J.JNull{}), dflt)

def plan_reload(eq: Bool, +op: String) -> Plan:
  match eq:
    case True{}:
      PReload{}
    case False{}:
      PHelp{}

def plan_quit(eq: Bool, +op: String) -> Plan:
  match eq:
    case True{}:
      PQuit{}
    case False{}:
      plan_reload(String.eq(op, "reload"), op)

def plan_interrupt(eq: Bool, +op: String) -> Plan:
  match eq:
    case True{}:
      PRun{Con{T.Interrupt{}, Nil{}}, Nil{}}
    case False{}:
      plan_quit(String.eq(op, "quit"), op)

def plan_compact(eq: Bool, +op: String) -> Plan:
  match eq:
    case True{}:
      PRun{Con{T.Compact{""}, Nil{}},
        Con{M.ROk{"<summary>The REPL conversation so far, compacted on request.</summary>", Nil{}},
          Nil{}}}
    case False{}:
      plan_interrupt(String.eq(op, "interrupt"), op)

def plan_notify(eq: Bool, +op: String, +rest: String) -> Plan:
  match eq:
    case True{}:
      PRun{Con{T.Notify{rest}, Nil{}}, Nil{}}
    case False{}:
      plan_compact(String.eq(op, "compact"), op)

def plan_steer(eq: Bool, +op: String, +rest: String) -> Plan:
  match eq:
    case True{}:
      PRun{Con{T.UserMsg{T.Steer{}, W.unescape_nl(rest)}, Nil{}},
        script_for_entry(W.unescape_nl(rest))}
    case False{}:
      plan_notify(String.eq(op, "notify"), op, rest)

def plan_say(eq: Bool, +op: String, +rest: String) -> Plan:
  match eq:
    case True{}:
      # the client escapes real newlines to keep the socket line
      # single-line; the message text carries the real newlines
      PRun{Con{T.UserMsg{T.Queue{}, W.unescape_nl(rest)}, Nil{}},
        script_for_entry(W.unescape_nl(rest))}
    case False{}:
      plan_steer(String.eq(op, "steer"), op, rest)

# a chunk may carry SEVERAL lines (kernel coalescing while a turn or a
# compaction ran); each line becomes its own command, run in order
def cmd_lines.keep(empty: Bool, +l: String, +rest: List<&2, String>)
    -> List<&2, String>:
  match empty:
    case True{}:
      rest
    case False{}:
      Con{l, rest}

def cmd_lines.go(lines: List<&2, String>) -> List<&2, String>:
  match lines:
    case Nil{}:
      Nil{}
    case Con{+l, rest}:
      cmd_lines.keep(String.is_empty(String.trim(l)), String.trim(l),
        cmd_lines.go(rest))

def cmd_lines(+data: String) -> List<&2, String>:
  cmd_lines.go(String.split(data, Tx.newline()))

# a line longer than one recv (a long paste, BISE-240: an 8 kB `say`, a
# 2 MB one) arrives in many chunks: only the lines a newline ends are
# commands, the rest waits for the next chunk. The unfinished line is
# kept as its pieces, newest first, none with a newline (the carry): a
# chunk is split alone and the pieces are joined once, when the newline
# comes. Appending each chunk to the line and splitting the whole line
# again was quadratic (big-msg-perf: a 2 MB `say` cost ~318e9
# instructions before its provider call).
# `rest` and `first`: the chunk split at its newlines; every part but
# the last is whole
def feed.init(+rest: List<&2, String>, +first: String) -> List<&2, String>:
  match rest:
    case Nil{}:
      Nil{}
    case Con{+h, +t}:
      Con{first, feed.init(t, h)}

def feed.last(+rest: List<&2, String>, +first: String) -> String:
  match rest:
    case Nil{}:
      first
    case Con{+h, +t}:
      feed.last(t, h)

# the line the carry's pieces and `first` (the chunk up to its first
# newline) make, joined once
def feed.close(+carry: List<&2, String>, +first: String) -> String:
  String.concat(List.reverse(&2, String, Con{first, carry}))

# one part: no newline, the chunk is one more piece of the line;
# more: the first part ends the line, the last starts the next one
def feed.parts(+rest: List<&2, String>, +first: String, +carry: List<&2, String>)
    -> List<&2, String> & List<&2, String>:
  match rest:
    case Nil{}:
      (Nil{}, Con{first, carry})
    case Con{+h, +t}:
      (cmd_lines.go(Con{feed.close(carry, first), feed.init(t, h)}),
        Con{feed.last(t, h), Nil{}})

def feed.of(+parts: List<&2, String>, +carry: List<&2, String>)
    -> List<&2, String> & List<&2, String>:
  match parts:
    case Nil{}:
      (Nil{}, carry)
    case Con{+h, +t}:
      feed.parts(t, h, carry)

# a chunk read after the carry: (the commands the newlines it holds end,
# the carry for the next chunk). Each char of the line is split once and
# copied once, whatever the number of chunks
def feed(+carry: List<&2, String>, +text: String)
    -> List<&2, String> & List<&2, String>:
  feed.of(String.split(text, Tx.newline()), carry)

# ---- BEND_EXTRA_PROMPT: a role appended to the system prompt ----
# A switchboard hub gives each agent its role (main, or a task with its
# brief rules) as a file; the live prompt ends with it. Empty: the
# prompt is unchanged.
def prompt_extra.pick(empty: Bool, +base: String, +extra: String)
    -> String:
  match empty:
    case True{}:
      base
    case False{}:
      String.append(base, String.append("\n\n", extra))

def prompt_extra(+base: String, +extra: String) -> String:
  prompt_extra.pick(String.is_empty(String.trim(extra)), base, extra)

# ---- the voice (prompt-tone.txt, shared with the switchboard roles) ----
# A session without a role (no BEND_EXTRA_PROMPT: a solo session) gets
# the tone block after its identity; an agent with a role does not: the
# role already carries the same block (rust/switchboard/src/prompts.rs
# includes the same file), so it is never there twice.
def solo_tone.pick(empty: Bool, +tone: String) -> String:
  match empty:
    case True{}:
      tone
    case False{}:
      ""

def solo_tone(+extra: String, +tone: String) -> String:
  solo_tone.pick(String.is_empty(String.trim(extra)), tone)
