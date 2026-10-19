//! His words opening with `@<agent>` (at-start, his ask; the desktop's
//! thread/lead.ts, one rule in both apps): the hub's router reads a
//! leading `@name text` as a message to that agent (router::parse, after
//! spaces). While his draft opens with a live agent's name and a space,
//! the divider says so in the accent (`↳ to architect ─── no @ to stay
//! with main`) and the composer's bar is the accent `┃`; ⏎ sends his words
//! to that agent, without the `@name`, and its view opens. An `@name`
//! anywhere else is plain words to the agent in view. `lead_agent` and
//! `drop_lead` are pure and tested here; ui.rs draws, sb.rs sends.

use super::*;
use bise_proto::words::{common, composer};

/// The live agent `text` opens with: `@name` after spaces, then a space
/// or a line; `name` a live agent's and not `focus`. Pure.
pub(crate) fn lead_agent<'a>(text: &str, agents: &'a [Agent], focus: &str) -> Option<&'a str> {
    let rest = text.trim_start().strip_prefix('@')?;
    let (name, _) = rest.split_once(char::is_whitespace)?;
    if name == focus {
        return None;
    }
    agents.iter().find(|a| a.name == name && !a.archived()).map(|a| a.name.as_str())
}

/// His words without their leading `@name` and the spaces after it
/// (another start: as they are). Pure.
pub(crate) fn drop_lead(text: &str, name: &str) -> String {
    let t = text.trim_start();
    match t.strip_prefix('@').and_then(|r| r.strip_prefix(name)) {
        Some(rest) if rest.starts_with(char::is_whitespace) => rest.trim_start().to_string(),
        _ => text.to_string(),
    }
}

/// His line to the agent in view, or, opening with `@<agent>`, to that
/// agent without the `@name`: that agent (the caller opens its view).
pub(super) fn send(sb: &mut Sb, typed: String) -> Option<String> {
    let to = lead_agent(&typed, &sb.agents, &sb.focus).map(str::to_string);
    match &to {
        Some(name) => sb.send_input_to(name, drop_lead(&typed, name)),
        None => sb.send_input(typed),
    }
    to
}

/// The agent his draft goes to instead of the one in view, while it
/// opens with `@<agent>`: never with an item open (its own words), a
/// palette, or in an archived view.
pub(crate) fn leading(app: &App) -> Option<String> {
    if super::card_draw::item_open(app) || app.sb.focus_archived() {
        return None;
    }
    lead_agent(&app.ed.text, &app.sb.agents, &app.sb.focus).map(str::to_string)
}

/// The name as the thread says it (a project's main is bise).
fn shown(name: &str) -> &str {
    if name == "main" {
        "bise"
    } else {
        name
    }
}

/// The divider's own label while his draft opens with `@<agent>` (empty:
/// [`divider`] gives its two sides); None: the usual divider.
pub(crate) fn label(app: &App) -> Option<Vec<Span<'static>>> {
    leading(app).map(|_| Vec::new())
}

/// The divider's two sides while his draft opens with `@<agent>`: the
/// label ` ↳ to architect ` in the accent, the end ` no @ to stay with
/// main ` dim when it fits in `room`.
pub(crate) fn divider(app: &App, room: usize) -> Option<(Vec<Span<'static>>, Vec<Span<'static>>)> {
    let to = leading(app)?;
    let head = if theme::ascii_mode() { "->" } else { "↳" };
    let label = format!(" {} {} ", head, common::to_agent(shown(&to)));
    let end = format!(" {} ", composer::lead_end(shown(&app.sb.focus)));
    let left = vec![Span::styled(label.clone(), Style::default().fg(theme::accent()))];
    let fits = label.chars().count() + end.chars().count() + 3 <= room;
    let right = if fits { vec![Span::styled(end, Style::default().fg(theme::dim()))] } else { Vec::new() };
    Some((left, right))
}

/// The composer's bar while his draft opens with `@<agent>`: the accent `┃`.
pub(crate) fn bar(app: &App, lead: u16) -> Option<Span<'static>> {
    leading(app)?;
    let g = if theme::ascii_mode() { "|" } else { "┃" };
    Some(Span::styled(format!("{}{}", g, " ".repeat(lead.saturating_sub(1) as usize)), Style::default().fg(theme::accent())))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn agents() -> Vec<Agent> {
        vec![
            Agent { main: true, name: "main".into(), status: "idle".into(), ..Agent::default() },
            Agent { name: "architect".into(), status: "idle".into(), ..Agent::default() },
            Agent { name: "old".into(), status: "archived".into(), ..Agent::default() },
        ]
    }

    #[test]
    fn a_leading_name_of_a_live_agent_is_that_agent() {
        let a = agents();
        assert_eq!(lead_agent("@architect fais une map", &a, "main"), Some("architect"));
        assert_eq!(lead_agent("   @architect\nfais", &a, "main"), Some("architect"));
        assert_eq!(lead_agent("@main look", &a, "architect"), Some("main"));
    }

    #[test]
    fn anything_else_stays_with_the_agent_in_view() {
        let a = agents();
        for t in ["demande à @architect de faire", "@architect", "@arch fais", "@nobody fais", "@old fais", ""] {
            assert_eq!(lead_agent(t, &a, "main"), None, "{t:?}");
        }
        assert_eq!(lead_agent("@architect fais", &a, "architect"), None, "the agent in view");
    }

    #[test]
    fn the_address_goes_and_the_rest_stays_as_typed() {
        assert_eq!(drop_lead("  @architect   fais une map", "architect"), "fais une map");
        assert_eq!(drop_lead("@architect\nfais\n  ça", "architect"), "fais\n  ça");
        assert_eq!(drop_lead("fais @architect x", "architect"), "fais @architect x");
        assert_eq!(drop_lead("@architects fais", "architect"), "@architects fais");
    }
}
