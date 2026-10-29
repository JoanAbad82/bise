//! `sb taste` and `sb people` (keeps.rs): their usage and the hub request.
//! Moved out of cli.rs unchanged (architect m_12143).

use super::*;
use bise_proto::sb::Keep;

const TASTE_USAGE: &str = "usage: sb taste | sb taste add \"<rule>\" [--from \"<where>\"] | sb taste remove <n|words>";
const PEOPLE_USAGE: &str = "usage: sb people | sb people set <name> \"<who>\" | sb people remove <name>";

/// `sb taste` and `sb people` (keeps.rs): the hub edits the files.
pub(super) fn keeps_req(cmd: &str, rest: &[String]) -> Result<Keep, String> {
    let flags: &[&str] = if cmd == "taste" { &["from"] } else { &[] };
    let (pos, o) = parse_args(rest, flags, &[])?;
    let usage = if cmd == "taste" { TASTE_USAGE } else { PEOPLE_USAGE };
    let words = |w: &[String]| Some(w.join(" ")).filter(|t| !t.trim().is_empty()).ok_or_else(|| usage.to_string());
    let step = pos.first().map(String::as_str).unwrap_or("list");
    Ok(match (cmd, step) {
        (_, "list") if pos.len() <= 1 => Keep::List,
        ("taste", "add") => Keep::Add { rule: words(&pos[1..])?, source: str_of(&o, "from") },
        ("taste", "remove") => Keep::Remove { which: words(&pos[1..])?, name: String::new() },
        ("people", "set") if pos.len() >= 3 => Keep::Set { name: pos[1].clone(), who: words(&pos[2..])? },
        ("people", "remove") => Keep::Remove { which: String::new(), name: words(&pos[1..])? },
        _ => return Err(usage.into()),
    })
}
