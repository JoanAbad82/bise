//! `sb notify`: the question, `--for`,
//! `--page|--artifact <id>[#<item>]` (card-links: one link, any artifact)
//! and `--open <n>=<artifact>[#<anchor>]`. Moved out of cli.rs (the line
//! limit, rule 5).

use super::*;

/// `sb notify`'s hub request: a notification is a card on the wire.
pub(super) fn notify_req(rest: &[String], req: &mut Map<String, Value>) -> Result<(), String> {
    // a notification is a card on the wire: the hub's command keeps its name
    req.insert("cmd".into(), json!("card"));
    let (pos, o) = parse_args(rest, &["for", "page", "artifact", "open"], &[])?;
    req.insert("text".into(), json!(text_of(&pos)?));
    // `--open <n>=<artifact>[#<anchor>]` (repeatable): option n
    // opens that artifact in his app, nothing sent (notif-open)
    if let Some(v) = o.get("open") {
        let specs: Vec<String> = match v {
            Value::Array(a) => a.iter().filter_map(Value::as_str).map(str::to_string).collect(),
            v => vec![v.as_str().unwrap_or_default().to_string()],
        };
        for s in &specs {
            crate::card_link::parse_open(s)?;
        }
        req.insert("open".into(), json!(specs));
    }
    if o.contains_key("for") { req.insert("for".into(), json!(str_of(&o, "for"))); }
    // `--page <id>[#<item>]`: the notification opens that page at the item
    // (fn + o in the capsule), pm's B m_6008
    // `--artifact <id>[#<item>]` (card-links): what it is about,
    // any artifact; `--page` is the same link
    let usage = "usage: sb notify [--for <msg>] [--page|--artifact <id>[#<item>]] [--open <n>=<artifact>[#<anchor>]]... \"<question>\"";
    if o.contains_key("page") && o.contains_key("artifact") {
        return Err(format!("--page and --artifact are the same link: give one. {usage}"));
    }
    for k in ["page", "artifact"] {
        if o.contains_key(k) {
            let spec = str_of(&o, k);
            if spec.trim().trim_start_matches('#').is_empty() || spec.trim().starts_with('#') {
                return Err(usage.into());
            }
            req.insert(k.into(), json!(spec.trim()));
        }
    }
    Ok(())
}
