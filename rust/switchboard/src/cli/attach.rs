//! `--attach` of `sb send` and `sb spawn` (send-parts): the request's
//! `attach` list, every path opened here, in the sender's sandbox.

use super::*;

/// send-parts: `--attach <path|m_n>` (repeatable) as the request's
/// `attach` list. sb runs in the sender's sandbox, so it opens every file
/// here: one it can't read is refused with its path (architect m_23962:
/// the hub never reads a path for an agent with its own authority, but
/// an image it stores). A path is made absolute against the cwd; `m_<n>`
/// (the parts of a message it got) goes as is, the hub checks it.
pub(super) fn of(o: &Map<String, Value>) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    for a in list_of(o.get("attach")) {
        if crate::core::parse_msg_id(&a).is_some() {
            out.push(a);
            continue;
        }
        let p = std::env::current_dir().map(|d| d.join(&a)).unwrap_or_else(|_| a.clone().into());
        match std::fs::File::open(&p).and_then(|f| f.metadata()) {
            Ok(m) if m.is_file() => out.push(p.to_string_lossy().into_owned()),
            Ok(_) => return Err(format!("--attach {a}: not a file")),
            Err(e) => return Err(format!("--attach {a}: cannot read it ({e})")),
        }
    }
    Ok(out)
}
