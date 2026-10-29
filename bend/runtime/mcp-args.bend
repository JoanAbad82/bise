# runtime/mcp-args.bend - what the model reads when an MCP call fails,
# with the tool's parameters when its arguments may be the cause.
#
# A failure says its kind and the server's own words (runtime/
# mcp-pure.bend: fail_text, tool_text). When the kind is bad arguments,
# or the tool ran and answered an error (isError: a server that masks
# its errors says only "Error calling tool 'x'"), the text goes on with
# what was sent, the tool's parameters from its input schema (the index
# line's "| input: {...}", the server's tools/list), and a check of the
# arguments against that schema: unknown parameters, missing required
# ones, wrong JSON types. A check that finds a problem makes the kind
# bad arguments. Pure (no IO); kept out of mcp-pure.bend because the
# JSON parser it needs is outside the PROOF closure.
import Base
import ../core/text.bend as Tx
import ../core/wire.bend as W
import 0x16458a2db4f36577294543ec2a6d420c/json.bend as Jv
import ./mcp-pure.bend as Mcp

# ---- the schema of an index line ----

def schema_marker() -> String:
  " | input: "

def schema_of.at(m: Maybe<&2, Nat>, +desc: String) -> String:
  match m:
    case None{}:
      ""
    case Some{+i}:
      String.drop(desc, Nat.add(i, String.length(schema_marker())))

# the input schema's JSON text in an index line's description part
# ("" when the line has none)
def schema_of(+desc: String) -> String:
  schema_of.at(Tx.find(desc, schema_marker(), 0n), desc)

# ---- JSON reads ----

def val_of(m: Maybe<&2, Jv.Val>) -> Jv.Val:
  match m:
    case None{}:
      Jv.Null{}
    case Some{+v}:
      v

def got(+v: Jv.Val, +k: String) -> Jv.Val:
  val_of(Jv.get(v, k))

def is_some(m: Maybe<&2, Jv.Val>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{_}:
      True{}

def has(+v: Jv.Val, +k: String) -> Bool:
  is_some(Jv.get(v, k))

def str_or(v: Jv.Val, +dflt: String) -> String:
  match v:
    case Jv.Str{+s}:
      s
    case _:
      dflt

def items(v: Jv.Val) -> List<&2, Jv.Val>:
  match v:
    case Jv.Arr{+xs}:
      xs
    case _:
      Nil{}

def entries(v: Jv.Val) -> List<&2, Sigma<&2, &2, String, _ => Jv.Val>>:
  match v:
    case Jv.Obj{+m}:
      Map.to_list(&2, Jv.Val, m)
    case _:
      Nil{}

def is_obj(v: Jv.Val) -> Bool:
  match v:
    case Jv.Obj{_}:
      True{}
    case _:
      False{}

def strs(xs: List<&2, Jv.Val>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+x, rest}:
      Con{str_or(x, ""), strs(rest)}

def has_str(xs: List<&2, String>, +s: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{+x, rest}:
      Bool.or(String.eq(x, s), has_str(rest, s))

def parse(+s: String) -> Jv.Val:
  val_of(Jv.parse(s))

# ---- a parameter's types ----

# "type": "string" or ["string", "null"]
def type_names(v: Jv.Val) -> List<&2, String>:
  match v:
    case Jv.Str{+s}:
      Con{s, Nil{}}
    case Jv.Arr{+xs}:
      strs(xs)
    case _:
      Nil{}

# the "type" of each anyOf / oneOf branch (one level: a branch's own
# branches are not read)
def branch_types(xs: List<&2, Jv.Val>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+x, rest}:
      List.append(&2, String, type_names(got(x, "type")), branch_types(rest))

def types_of(+p: Jv.Val) -> List<&2, String>:
  List.append(&2, String, type_names(got(p, "type")),
    List.append(&2, String, branch_types(items(got(p, "anyOf"))),
      branch_types(items(got(p, "oneOf")))))

def encs(xs: List<&2, Jv.Val>) -> List<&2, String>:
  match xs:
    case Nil{}:
      Nil{}
    case Con{+x, rest}:
      Con{Jv.encode(x), encs(rest)}

def type_text.enum(xs: List<&2, Jv.Val>, +ts: String) -> String:
  match xs:
    case Nil{}:
      ts
    case Con{+x, rest}:
      String.append("one of ", String.join(encs(Con{x, rest}), "|"))

def type_text(+p: Jv.Val) -> String:
  type_text.enum(items(got(p, "enum")),
    Bool.pick(String, List.is_empty(&2, String, types_of(p)), "any",
      String.join(types_of(p), "|")))

# ---- the parameters, as the model reads them ----

def desc_max() -> Nat:
  120n

def desc_part(+d: String) -> String:
  Bool.pick(String, String.is_empty(String.trim(d)), "",
    String.append(": ", Bool.pick(String,
      Nat.is_lt(desc_max(), String.length(W.squeeze(d))),
      String.append(String.take(W.squeeze(d), desc_max()), "…"),
      W.squeeze(d))))

def param_text(+k: String, +p: Jv.Val, +req: Bool) -> String:
  String.concat([k, " (", type_text(p), Bool.pick(String, req, ", required",
    ""), ")", desc_part(str_or(got(p, "description"), ""))])

def params_go(ps: List<&2, Sigma<&2, &2, String, _ => Jv.Val>>,
    +req: List<&2, String>) -> List<&2, String>:
  match ps:
    case Nil{}:
      Nil{}
    case (+k, +p) <> rest:
      Con{param_text(k, p, has_str(req, k)), params_go(rest, req)}

def required(+schema: Jv.Val) -> List<&2, String>:
  strs(items(got(schema, "required")))

# "a (string, required): its description; b (integer|null)"
def params_text(+schema: Jv.Val) -> String:
  String.join(params_go(entries(got(schema, "properties")), required(schema)),
    "; ")

# ---- the arguments against the schema ----

def num_type(+s: String) -> String:
  Bool.pick(String, Bool.or(String.contains(s, "."),
      Bool.or(String.contains(s, "e"), String.contains(s, "E"))),
    "number", "integer")

def json_type(v: Jv.Val) -> String:
  match v:
    case Jv.Null{}:
      "null"
    case Jv.Flag{_}:
      "boolean"
    case Jv.Num{+s}:
      num_type(s)
    case Jv.Str{_}:
      "string"
    case Jv.Arr{_}:
      "array"
    case Jv.Obj{_}:
      "object"

# no type said, its own type, or an integer where a number goes
def type_ok(+ts: List<&2, String>, +t: String) -> Bool:
  Bool.or(List.is_empty(&2, String, ts), Bool.or(has_str(ts, t),
    Bool.and(String.eq(t, "integer"), has_str(ts, "number"))))

def arg_problem.known(+k: String, +p: Jv.Val, +v: Jv.Val)
    -> List<&2, String>:
  Bool.pick(List<&2, String>, type_ok(types_of(p), json_type(v)), Nil{},
    Con{String.concat([k, " is ", json_type(v), ", it wants ",
      type_text(p)]), Nil{}})

def arg_problem(+props: Jv.Val, +k: String, +v: Jv.Val) -> List<&2, String>:
  Bool.pick(List<&2, String>, has(props, k),
    arg_problem.known(k, got(props, k), v),
    Con{String.append("unknown parameter ", k), Nil{}})

def arg_problems(as: List<&2, Sigma<&2, &2, String, _ => Jv.Val>>,
    +props: Jv.Val) -> List<&2, String>:
  match as:
    case Nil{}:
      Nil{}
    case (+k, +v) <> rest:
      List.append(&2, String, arg_problem(props, k, v), arg_problems(rest, props))

def missing.put(there: Bool, +r: String, +rest_res: List<&2, String>)
    -> List<&2, String>:
  Bool.pick(List<&2, String>, there, rest_res,
    Con{String.append("missing required ", r), rest_res})

def missing(req: List<&2, String>, +args: Jv.Val) -> List<&2, String>:
  match req:
    case Nil{}:
      Nil{}
    case Con{+r, rest}:
      missing.put(has(args, r), r, missing(rest, args))

def problems.obj(ok: Bool, +schema: Jv.Val, +args: Jv.Val)
    -> List<&2, String>:
  match ok:
    case False{}:
      Con{"the arguments are not a JSON object", Nil{}}
    case True{}:
      List.append(&2, String, missing(required(schema), args),
        arg_problems(entries(args), got(schema, "properties")))

# what is wrong in the arguments by the schema (none when the schema is
# unknown: nothing to check against)
def problems.of(known: Bool, +schema: Jv.Val, +args: String)
    -> List<&2, String>:
  match known:
    case False{}:
      Nil{}
    case True{}:
      problems.obj(is_obj(parse(args)), schema, parse(args))

def problems(+schema: String, +args: String) -> List<&2, String>:
  problems.of(is_obj(parse(schema)), parse(schema), args)

# ---- the hint after the failure ----

def sent_max() -> Nat:
  600n

def sent_text(+args: String) -> String:
  Bool.pick(String, Nat.is_lt(sent_max(), String.length(args)),
    String.append(String.take(args, sent_max()), "…"), args)

def check_text(ps: List<&2, String>) -> String:
  match ps:
    case Nil{}:
      " your arguments match its schema: look at their values (formats, quoting, ids, dates) against the tool's description (search_tool_functions, mode details), then call again."
    case Con{+p, rest}:
      String.concat([" wrong in your arguments: ", String.join(Con{p, rest},
        "; "), ". fix them and call again."])

# a sentence's end: one period, not two after a description's own
def ended(+s: String) -> String:
  Bool.pick(String, String.ends_with(s, "."), s, String.append(s, "."))

def known_text(known: Bool, +schema: Jv.Val, +args: String) -> String:
  match known:
    case False{}:
      " its input schema is unknown here: read the tool's declaration (search_tool_functions, mode details)."
    case True{}:
      String.concat([" its parameters: ", ended(Bool.pick(String,
        String.is_empty(params_text(schema)), "none", params_text(schema))),
        check_text(problems(Jv.encode(schema), args))])

# sent, its parameters, the check
def hint(+schema: String, +args: String) -> String:
  String.concat([" sent: ", Mcp.redact(sent_text(args)), ".",
    known_text(is_obj(parse(schema)), parse(schema), args)])

def hint_if(wants: Bool, +schema: String, +args: String) -> String:
  Bool.pick(String, wants, hint(schema, args), "")

# the tool ran and answered an error: its words, the kind they tell (bad
# arguments when the check finds a problem), and the hint
def tool_failed(+name: String, +host: String, +schema: String,
    +args: String, +said: String) -> String:
  String.append(Mcp.tool_text(name, host, Bool.pick(Mcp.Cause,
      List.is_empty(&2, String, problems(schema, args)),
      Mcp.words_kind(said, Mcp.KTool{}), Mcp.KArgs{}), said),
    hint(schema, args))

# the call failed for good: fail_text, and the hint for bad arguments
def call_failed(+name: String, +host: String, +schema: String,
    +args: String, +st: Mcp.Stage, +w: Mcp.Why, +n: Nat) -> String:
  String.append(Mcp.fail_text(name, host, st, w, n),
    hint_if(Mcp.wants_schema(Mcp.kind_of(st, w)), schema, args))
