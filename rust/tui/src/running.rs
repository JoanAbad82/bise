//! `/running` (designer's page running-procs): the processes the
//! project's agents leave running (dev servers, watchers, background
//! jobs) and the ones that ended today, in rows. Pure: the list's order,
//! a row's words at 150 and 80 columns, the agents panel's faint line
//! (`∿ 2 running · :5173`). The screen (keys, the hub's calls, the
//! output) is running_screen.rs; the words are bise_proto's
//! `words::running`, the desktop's too.

use bise_proto::rows::{Proc, ProcState};
use bise_proto::thread::words::wait_len;
use bise_proto::words::running;
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use unicode_width::UnicodeWidthStr;

use crate::theme::{dim, error, faint, selection_bg, text, G_FAILED, G_STOPPED, G_WORKING};

/// From this many columns the rows have the long words (`localhost:5173`,
/// `ended 3 min ago · rc 1`) and the keys say `its output`, `a its agent`.
pub(crate) const WIDE_FROM: usize = 110;

/// What the list shows (designer m_38556, the desktop's two views): the
/// running ones, or the ones that ended today (tab).
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub(crate) enum Filter {
    #[default]
    Running,
    Ended,
}

/// One agent's rows, in the list's order.
#[derive(Debug, PartialEq)]
pub(crate) struct Group<'a> {
    pub(crate) agent: String,
    pub(crate) rows: Vec<&'a Proc>,
}

/// Is it still running (stopping included: it runs until it ends)?
pub(crate) fn is_running(p: &Proc) -> bool {
    p.running()
}

/// The list in groups by agent: in the agents panel's order (`order`; an
/// agent not there after them, by name). Running: the running ones,
/// oldest first, and those of `kept` (ended or stopped while the view is
/// open) in their place, with their new state. Ended: the ended ones,
/// newest first. `query` keeps the rows whose command or agent holds it
/// (case-blind).
pub(crate) fn groups<'a>(items: &'a [Proc], order: &[String], filter: Filter, query: &str, kept: &std::collections::HashSet<(String, String)>) -> Vec<Group<'a>> {
    let q = query.trim().to_lowercase();
    let shown = |p: &&Proc| {
        let in_view = match filter {
            Filter::Running => is_running(p) || kept.contains(&(p.agent.clone(), p.id.clone())),
            Filter::Ended => !is_running(p),
        };
        in_view && (q.is_empty() || p.cmd.to_lowercase().contains(&q) || p.agent.to_lowercase().contains(&q))
    };
    let mut agents: Vec<&str> = items.iter().filter(shown).map(|p| p.agent.as_str()).collect();
    agents.sort_by_key(|a| (order.iter().position(|o| o == a).unwrap_or(usize::MAX), a.to_string()));
    agents.dedup();
    agents
        .into_iter()
        .map(|a| {
            let mut rows: Vec<&Proc> = items.iter().filter(|p| p.agent == a).filter(shown).collect();
            rows.sort_by_key(|p| match filter {
                Filter::Running => p.started_ms,
                Filter::Ended => u64::MAX - p.ended_ms.unwrap_or(p.started_ms),
            });
            Group { agent: a.to_string(), rows }
        })
        .collect()
}

/// The rows in the list's order (the selection moves on it).
pub(crate) fn flat<'a>(gs: &[Group<'a>]) -> Vec<&'a Proc> {
    gs.iter().flat_map(|g| g.rows.iter().copied()).collect()
}

/// A row's glyph and its color: `∿` dim while it runs, `✓` dim when it
/// ended well, `✗` the only red one, `–` dim when it was stopped.
pub(crate) fn glyph(p: &Proc) -> (&'static str, Color) {
    match &p.state {
        ProcState::Running => (G_WORKING, dim()),
        ProcState::Exited { rc: Some(0) } => (crate::theme::G_DONE, dim()),
        // its code not known (a detached one): never a failure
        ProcState::Exited { rc: None } => (G_STOPPED, dim()),
        ProcState::Exited { .. } => (G_FAILED, error()),
        _ => (G_STOPPED, dim()),
    }
}

/// `14:02` in his zone.
pub(crate) fn clock(ms: u64) -> String {
    let (_, _, _, h, mi) = bise_proto::thread::when::civil(ms, crate::when::offset_at(ms));
    format!("{h:02}:{mi:02}")
}

/// Its right column: how long it has run (`14 min`), or how it ended
/// (`ended 3 min ago · rc 1`, `stopped by you · 10:12`, `stopped with
/// search`); `stopping…` while his stop works. `wide`: the 150-column
/// words; at 80 `rc 1 · 3 min ago`.
pub(crate) fn status(p: &Proc, now: u64, stopping: bool, wide: bool) -> String {
    let ago = |ms: Option<u64>| wait_len(now.saturating_sub(ms.unwrap_or(now)), false);
    match &p.state {
        _ if stopping && is_running(p) => running::stopping.to_string(),
        ProcState::Running => wait_len(now.saturating_sub(p.started_ms), false),
        ProcState::Exited { rc: Some(0) | None } => running::ended_ago(ago(p.ended_ms)),
        ProcState::Exited { rc: Some(rc) } if wide => format!("{} · {}", running::ended_ago(ago(p.ended_ms)), running::exit_rc(rc)),
        ProcState::Exited { rc: Some(rc) } => format!("{} · {}", running::exit_rc(rc), running::ago_short(ago(p.ended_ms))),
        ProcState::StoppedByYou => match p.ended_ms {
            Some(at) => running::stopped_by_you_at(clock(at)),
            None => running::stopped_by_you.to_string(),
        },
        ProcState::StoppedWith => running::stopped_with(&p.agent),
        // a state a newer hub knows: when it ended
        ProcState::Unknown => running::ended_ago(ago(p.ended_ms)),
    }
}

/// Its port's words, when it runs and listens: `localhost:5173` (wide) or
/// `:5173`. The `↗` is the desktop's (the TUI's `o` opens it).
pub(crate) fn port_words(p: &Proc, wide: bool) -> Option<String> {
    let port = p.ports.first().filter(|_| is_running(p))?;
    Some(match wide {
        true => running::url(port).trim_end_matches(" ↗").to_string(),
        false => running::port_short(port),
    })
}

/// A command on one row: its newlines, tabs and runs of spaces as one
/// space (a newline has no width and shifted the columns after it).
pub(crate) fn one_line(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// `s` or `…` cut to `max` columns.
pub(crate) fn clip(s: &str, max: usize) -> String {
    if s.width() <= max {
        return s.to_string();
    }
    let mut out = String::new();
    for c in s.chars() {
        if out.width() + 2 > max {
            break;
        }
        out.push(c);
    }
    out.push('…');
    out
}

/// One row in `wd` columns: `› ∿ pnpm dev        localhost:5173    14 min`.
/// The command takes the room the port and the status leave.
pub(crate) fn row(p: &Proc, now: u64, selected: bool, stopping: bool, wd: usize) -> Line<'static> {
    let wide = wd >= WIDE_FROM;
    let (g, gc) = glyph(p);
    let port = port_words(p, wide).unwrap_or_default();
    let st = status(p, now, stopping, wide);
    let port_w = if wide { 18 } else { 8 };
    let cmd_w = wd.saturating_sub(4 + port_w + 2 + st.width().max(if wide { 22 } else { 6 }));
    let cmd = clip(&one_line(&p.cmd), cmd_w.max(8));
    let base = match selected {
        true => Style::default().bg(selection_bg()),
        false => Style::default(),
    };
    let mut spans = vec![
        Span::styled(if selected { "› " } else { "  " }, base.fg(text())),
        Span::styled(format!("{g} "), base.fg(gc)),
        Span::styled(format!("{cmd:<cmd_w$}", cmd_w = cmd_w.max(8)), base.fg(text())),
        Span::styled(" ", base),
    ];
    // the port listens: underlined, as a link
    let port_style = if port.is_empty() { base } else { base.fg(text()).add_modifier(Modifier::UNDERLINED) };
    spans.push(Span::styled(port.clone(), port_style));
    spans.push(Span::styled(" ".repeat(port_w.saturating_sub(port.width()) + 1), base));
    spans.push(Span::styled(st, base.fg(dim())));
    let used: usize = spans.iter().map(|s| s.content.width()).sum();
    if selected && used < wd {
        spans.push(Span::styled(" ".repeat(wd - used), base));
    }
    Line::from(spans)
}

/// The head in `room` columns: `storefront · 3 running · 2 listening`,
/// or `storefront · 3 · 2 listening` when that does not fit; the
/// listening part only when one listens.
pub(crate) fn head(project: &str, items: &[Proc], room: usize) -> String {
    let n = items.iter().filter(|p| is_running(p)).count();
    let listening = items.iter().filter(|p| is_running(p) && !p.ports.is_empty()).count();
    let tail = if listening > 0 { format!(" · {}", running::count_listening(listening)) } else { String::new() };
    let long = format!("{project} · {}{tail}", running::count_running(n));
    if long.width() <= room {
        return long;
    }
    format!("{project} · {n}{tail}")
}

/// The tip of a row (its id, when it started, its folder; a detached one
/// says where it came from), shown under the selected row.
pub(crate) fn tip(p: &Proc) -> Vec<String> {
    let at = clock(p.started_ms);
    // a bg job by its slot (`bg3`), as the agent's sb says it; a detached
    // one by its pid (`p48990`), its start time left out
    let id = match p.kind {
        bise_proto::rows::ProcKind::Bg { n } => format!("bg{n}"),
        _ => p.id.split('.').next().unwrap_or(&p.id).to_string(),
    };
    let first = match &p.cwd {
        Some(cwd) => running::tip(&id, &at, short_home(cwd)),
        None => running::tip_no_cwd(&id, &at),
    };
    let mut out = vec![first];
    if matches!(p.kind, bise_proto::rows::ProcKind::Detached) {
        out.push(running::tip_detached(&p.agent));
    }
    out
}

/// `~/…/worktrees/perf`: the home as `~`, the middle cut when it is deep.
pub(crate) fn short_home(path: &str) -> String {
    let home = std::env::var("HOME").unwrap_or_default();
    let p = match path.strip_prefix(&home).filter(|_| !home.is_empty()) {
        Some(rest) => format!("~{rest}"),
        None => path.to_string(),
    };
    let parts: Vec<&str> = p.split('/').collect();
    if parts.len() > 4 {
        format!("{}/…/{}", parts[0], parts[parts.len() - 2..].join("/"))
    } else {
        p
    }
}

/// The agents panel's faint line under an agent that runs something:
/// `∿ 2 running · :5173` (the port when one of them listens).
pub(crate) fn panel_line(procs: u16, port: Option<u16>) -> Option<String> {
    if procs == 0 {
        return None;
    }
    let mut s = format!("{G_WORKING} {}", running::count_running(procs));
    if let Some(p) = port {
        s.push_str(&format!(" · {}", running::port_short(p)));
    }
    Some(s)
}

/// The output's head in `wd` columns, as (its command, the rest):
/// `pnpm dev`, `perf · storefront · ∿ running · 14 min · localhost:5173
/// · pid 48211 · cpu 12% · 340 MB`. Short on room (designer m_38541) the
/// command is cut first, then cpu/memory and the pid go, then the port;
/// the state (`✗ ended 5 s ago · rc 1`) always stays whole.
pub(crate) fn out_head(p: &Proc, project: &str, now: u64, stopping: bool, wd: usize) -> (String, String) {
    const CMD_MIN: usize = 12;
    let (g, _) = glyph(p);
    let state = match is_running(p) && !stopping {
        true => format!("{g} {} · {}", running::state_running, status(p, now, false, true)),
        false => format!("{g} {}", status(p, now, stopping, true)),
    };
    let parts = [running::whose(&p.agent, project), state];
    let mut extra = Vec::new();
    if let Some(port) = port_words(p, true) {
        extra.push(port);
    }
    extra.push(running::pid_of(p.pid));
    if is_running(p) {
        extra.push(running::usage(p.cpu.round() as u32, p.rss_mb));
    }
    let cmd = one_line(&p.cmd);
    let rest = |extra: &[String]| parts.iter().chain(extra).cloned().collect::<Vec<_>>().join(" · ");
    // drop from the end (cpu/memory, the pid, the port) until the command
    // keeps CMD_MIN columns
    while !extra.is_empty() && rest(&extra).width() + 2 + cmd.width().min(CMD_MIN) > wd {
        extra.pop();
    }
    let r = rest(&extra);
    let cmd = clip(&cmd, wd.saturating_sub(r.width() + 2).max(CMD_MIN.min(cmd.width())));
    (cmd, r)
}

/// The dim keys line of the list.
pub(crate) fn keys_line(wide: bool) -> Line<'static> {
    let k = if wide { running::keys_list } else { running::keys_list_short };
    Line::from(Span::styled(k.to_string(), Style::default().fg(dim())))
}

/// The group's title: `storefront › perf`, dim.
pub(crate) fn group_line(project: &str, agent: &str) -> Line<'static> {
    Line::from(Span::styled(running::group(project, agent), Style::default().fg(dim())))
}

/// A tip line under the selected row, faint, in line with the command.
pub(crate) fn tip_line(t: &str, wd: usize) -> Line<'static> {
    Line::from(Span::styled(format!("    {}", clip(t, wd.saturating_sub(4))), Style::default().fg(faint())))
}

#[cfg(test)]
#[path = "running_tests.rs"]
pub(crate) mod tests;
