//! The Plugins list in a few numbers ([`summary`]): the sidebar's plugins
//! row and the place's 'connect your tools' band (page plugins v48,
//! architect m_40075, m_40158). Pure, from the same rows [`super::rows`]
//! builds, the import scan ([`crate::add::found`], read by the caller on
//! its setup thread) and the marketplaces it has read. The window adds
//! nothing up: every number it shows is here.
//!
//! What waits on him comes from typed fields only: a row's or a part's
//! `login: needs`, a part's `error`; never from a status word. An off row
//! waits on nothing (its servers don't start).

use crate::add::{default_import_name, import_title, Found};
use bise_proto::app_rows::{LoginState, Plugin, PluginKind, PluginState, PluginSuggest, PluginsSummary, SuggestKind, SUGGEST_CAP};

/// A marketplace he added, as its last `browse` listed it.
pub struct Market<'a> {
    pub source: &'a str,
    pub items: &'a [Plugin],
}

/// Mistral's connectors bise suggests first, in this order (the band's
/// 'most useful first'); the others follow in the catalog's order.
pub const USEFUL: &[&str] = &[
    "linear", "github", "atlassian", "jira", "confluence", "notion", "slack", "gmail", "google_drive", "google_calendar", "outlook",
    "figma", "sentry", "datadog", "airtable", "hubspot",
];

/// The list in numbers. `rows`: every row of [`super::rows`], the ones to
/// connect (`available`) too; `found`: the other apps' MCP configs;
/// `project`: the list is a project's (only then the 'workspace' item).
pub fn summary(rows: &[Plugin], found: &[Found], markets: &[Market], project: bool) -> PluginsSummary {
    let listed = |p: &&Plugin| matches!(p.state, PluginState::Loaded | PluginState::Disabled);
    let on: Vec<&Plugin> = rows.iter().filter(listed).filter(|p| p.on && p.state == PluginState::Loaded).collect();
    let off = rows.iter().filter(listed).filter(|p| !(p.on && p.state == PluginState::Loaded)).count();
    let login: Vec<&Plugin> = on.iter().copied().filter(|p| needs_login(p)).collect();
    let error: Vec<&Plugin> = on.iter().copied().filter(|p| failed(p)).collect();
    let waiting = on.iter().filter(|p| needs_login(p) || failed(p)).count();
    let mistral: Vec<&Plugin> = rows.iter().filter(|p| p.kind == PluginKind::Mistral).collect();
    let connected = mistral.iter().filter(|p| p.login == Some(LoginState::In) || (p.login.is_none() && p.state != PluginState::Available)).count();
    let mut to_connect: Vec<&Plugin> = mistral.iter().copied().filter(|p| p.state == PluginState::Available).collect();
    to_connect.sort_by_key(|p| rank(p));

    let mut suggest = Vec::new();
    suggest.extend(item(SuggestKind::Login, login.len(), &login));
    suggest.extend(item(SuggestKind::Error, error.len(), &error));
    suggest.extend(item(SuggestKind::Mistral, to_connect.len(), &to_connect));
    let to_import: Vec<&Found> = found.iter().filter(|f| f.added.is_none() && !f.servers.is_empty()).collect();
    if !to_import.is_empty() {
        let first = to_import.iter().take(SUGGEST_CAP);
        suggest.push(PluginSuggest {
            kind: SuggestKind::Import,
            n: count(to_import.iter().map(|f| f.servers.len()).sum()),
            ids: first.clone().map(|f| default_import_name(f.from).to_string()).collect(),
            titles: first.map(|f| import_title(f.from).to_string()).collect(),
        });
    }
    if project {
        let mine: Vec<&Plugin> = rows.iter().filter(listed).filter(|p| p.scope == bise_proto::app_rows::PluginScope::Workspace).collect();
        // a skills folder brings its skills, a plugin itself
        let n: usize = mine.iter().map(|p| if p.kind == PluginKind::Skills { p.parts.len() } else { 1 }).sum();
        suggest.extend(item(SuggestKind::Workspace, n, &mine));
    }
    let installed: Vec<&str> = rows.iter().filter(listed).map(|p| p.id.as_str()).collect();
    for m in markets {
        let new: Vec<&Plugin> = m.items.iter().filter(|p| !installed.contains(&p.id.as_str()) && !installed.contains(&p.name.as_str())).collect();
        suggest.extend(item(SuggestKind::Marketplace, new.len(), &new));
    }
    PluginsSummary {
        on: count(on.len()),
        off: count(off),
        waiting: count(waiting),
        connected: count(connected),
        connectors: count(mistral.len()),
        suggest,
    }
}

/// Its own login or one of its servers' says it needs one.
fn needs_login(p: &Plugin) -> bool {
    p.login == Some(LoginState::Needs) || p.parts.iter().any(|x| x.on && x.login == Some(LoginState::Needs))
}

/// One of its servers failed.
fn failed(p: &Plugin) -> bool {
    p.parts.iter().any(|x| x.on && x.error.is_some())
}

/// A connector's place in [`USEFUL`] (the others after, in order).
fn rank(p: &Plugin) -> usize {
    let name = p.id.strip_prefix("mistral:").unwrap_or(&p.id);
    USEFUL.iter().position(|u| *u == name).unwrap_or(USEFUL.len())
}

/// One item, its ids and titles capped; none when there is nothing.
fn item(kind: SuggestKind, n: usize, rows: &[&Plugin]) -> Option<PluginSuggest> {
    if n == 0 {
        return None;
    }
    let first = rows.iter().take(SUGGEST_CAP);
    Some(PluginSuggest {
        kind,
        n: count(n),
        ids: first.clone().map(|p| p.id.clone()).collect(),
        titles: first.map(|p| if p.title.is_empty() { p.name.clone() } else { p.title.clone() }).collect(),
    })
}

fn count(n: usize) -> u32 {
    u32::try_from(n).unwrap_or(u32::MAX)
}

#[cfg(test)]
mod tests;
