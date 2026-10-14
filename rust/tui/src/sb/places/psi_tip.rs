//! What a ψ says under the mouse (wt-sign, designer m_24019): the key
//! bar's line, in place of the keys, while the mouse is over a ψ, the
//! composer line's `ψ fix-login`, a panel row's mark or a shared
//! worktree's title: `ψ worktree: its own copy of the repo, on
//! sb/fix-login · ~/.bise/worktrees/harness/fix-login`.
//!
//! The words are pure ([`line`], from a [`Tip`]); where a ψ is comes
//! from the frame: each draw of the divider says where its ψ is ([`mark`],
//! the agent it stands for, or none), the panel's ψ are its hits ([`at`]). Words dim,
//! the branch and the folder in the text's color; short on room the
//! folder shortens from the left (`…/harness/fix-login`), then goes; the
//! branch never cuts.

use super::*;
use std::cell::RefCell;
use unicode_width::UnicodeWidthStr;

/// What a ψ stands for.
#[derive(Clone, Debug, PartialEq, Eq)]
pub(crate) enum Tip {
    /// a worktree: its live agents (2 or more: shared), its branch (None:
    /// detached), its folder (None: the hub did not say)
    Worktree { agents: usize, branch: Option<String>, path: Option<String> },
    /// a feature branch (dev-flow §5.1); `trying`: its try build runs (Δ)
    Feature { name: String, trying: bool },
}

/// The key bar's line for `t`, `width` columns at most.
pub(crate) fn line(t: &Tip, width: usize) -> Line<'static> {
    let d = Style::default().fg(dim());
    let x = Style::default().fg(text());
    let psi = theme::glyph(G_WORKTREE);
    let (head, folder) = match t {
        Tip::Feature { name, trying: false } => {
            (vec![Span::styled(format!("{psi} feature branch "), d), Span::styled(name.clone(), x), Span::styled(": its agents land on it", d)], None)
        }
        Tip::Feature { name, trying: true } => (
            vec![
                Span::styled(format!("{} feature ", theme::glyph(G_BUILDING)), d),
                Span::styled(name.clone(), x),
                Span::styled(": its try build is running", d),
            ],
            None,
        ),
        Tip::Worktree { agents, branch, path } => {
            let who = if *agents >= 2 { format!("{psi} worktree shared by {agents} agents") } else { format!("{psi} worktree: its own copy of the repo") };
            let v = match branch {
                Some(b) => vec![Span::styled(format!("{who}, on "), d), Span::styled(b.clone(), x)],
                None => vec![Span::styled(format!("{who}, no branch"), d)],
            };
            (v, path.as_deref().map(crate::open_file::tilde))
        }
    };
    let head_w: usize = head.iter().map(|s| s.content.width()).sum();
    let mut spans = head;
    if let Some(f) = folder.and_then(|f| shorten(&f, width.saturating_sub(head_w + 3))) {
        spans.push(Span::styled(" · ", d));
        spans.push(Span::styled(f, x));
    }
    Line::from(crate::chrome::fit(spans, width))
}

/// `folder` in `room` columns: whole, else its first parts dropped for
/// `…/` (`…/harness/fix-login`), keeping its last part; None when even
/// that does not fit.
fn shorten(folder: &str, room: usize) -> Option<String> {
    if folder.width() <= room {
        return Some(folder.to_string());
    }
    let e = theme::ellipsis();
    let parts: Vec<&str> = folder.trim_end_matches('/').split('/').collect();
    (1..parts.len()).map(|i| format!("{e}/{}", parts[i..].join("/"))).find(|s| s.width() <= room)
}

// ---- where the ψ are ----

thread_local! {
    /// The divider's ψ as the last frame drew it and the agent it stands
    /// for; every draw of the divider sets it (None: no ψ there).
    static DIVIDER: RefCell<Option<(Rect, String)>> = const { RefCell::new(None) };
}

/// The divider drew agent `agent`'s ψ (and its place's name) at `r`;
/// None: it drew none (another label, no room, the shared folder).
pub(crate) fn mark(at: Option<(Rect, &str)>) {
    let at = at.filter(|(r, _)| !r.is_empty()).map(|(r, a)| (r, a.to_string()));
    DIVIDER.with(|d| *d.borrow_mut() = at);
}

/// The tip of the ψ at (x, y) in the last frame: the divider's, a panel
/// row's mark (its last 3 columns, as its click), a shared worktree's
/// title.
pub(crate) fn at(app: &App, x: u16, y: u16) -> Option<Tip> {
    let sb = &app.sb;
    let inside = |r: &Rect| x >= r.x && x < r.right() && y >= r.y && y < r.bottom();
    if let Some(name) = DIVIDER.with(|d| d.borrow().as_ref().filter(|(r, _)| inside(r)).map(|(_, n)| n.clone())) {
        return sb.agent(&name).and_then(|a| of_agent(sb, a));
    }
    let hits = sb.panel_hits.try_borrow().ok()?;
    match hits.hit_at(x, y)? {
        // a row's last 3 columns: its mark, as its click (panel_mouse)
        panel::Hit::Agent(name) if hits.area.right().saturating_sub(x) <= 3 => {
            let a = sb.agent(name).filter(|a| !a.archived())?;
            // computer use's `↖` takes the mark's column while it drives
            (crate::computer_use::driving(&a.name).and_then(|d| d.driving).is_none()).then(|| of_agent(sb, a)).flatten()
        }
        panel::Hit::Place(branch) => sb.places.iter().find(|p| p.label().as_deref() == Some(branch.as_str())).map(|p| of_place(sb, p)),
        _ => None,
    }
}

/// The tip of agent `a`'s ψ: its place's, else its own worktree's or the
/// private one it told; None in the shared folder (no ψ).
pub(crate) fn of_agent(sb: &Sb, a: &Agent) -> Option<Tip> {
    if let Some(p) = sb.place_of(a) {
        return Some(of_place(sb, p));
    }
    panel::place_label(a)?;
    let path = if a.mode == "worktree" { a.path.clone() } else { a.place.clone() };
    Some(Tip::Worktree { agents: 1, branch: a.branch.clone(), path: Some(path).filter(|p| !p.is_empty()) })
}

/// The tip of worktree `p`'s ψ.
pub(crate) fn of_place(sb: &Sb, p: &Place) -> Tip {
    if p.feature {
        return Tip::Feature { name: p.label().unwrap_or_else(|| p.id.clone()), trying: p.trying };
    }
    let path = p.path.clone().or_else(|| p.id.strip_prefix("pt:").map(str::to_string));
    Tip::Worktree { agents: sb.live_in(p).len(), branch: p.branch.clone(), path }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn text_of(l: &Line) -> String {
        l.spans.iter().map(|s| s.content.as_ref()).collect()
    }

    fn wt(agents: usize, branch: Option<&str>, path: &str) -> Tip {
        Tip::Worktree { agents, branch: branch.map(Into::into), path: Some(path.into()) }
    }

    /// designer m_24019: its own, shared, detached, a feature; the
    /// branch and the folder in the text's color, the words dim.
    #[test]
    fn a_psi_says_it_is_a_worktree() {
        let p = "/w/.bise/worktrees/harness/fix-login";
        let own = line(&wt(1, Some("sb/fix-login"), p), 200);
        assert_eq!(text_of(&own), format!("ψ worktree: its own copy of the repo, on sb/fix-login · {p}"));
        assert_eq!(own.spans[0].style.fg, Some(dim()));
        assert_eq!((own.spans[1].content.as_ref(), own.spans[1].style.fg), ("sb/fix-login", Some(text())));
        assert_eq!(own.spans.last().unwrap().style.fg, Some(text()));
        assert_eq!(text_of(&line(&wt(3, Some("sb/dark-mode"), "/d"), 200)), "ψ worktree shared by 3 agents, on sb/dark-mode · /d");
        assert_eq!(text_of(&line(&wt(1, None, "/tmp/fix-wt"), 200)), "ψ worktree: its own copy of the repo, no branch · /tmp/fix-wt");
        assert_eq!(text_of(&line(&Tip::Worktree { agents: 1, branch: Some("b".into()), path: None }, 200)), "ψ worktree: its own copy of the repo, on b");
        let f = |trying| text_of(&line(&Tip::Feature { name: "ven".into(), trying }, 200));
        assert_eq!(f(false), "ψ feature branch ven: its agents land on it");
        assert_eq!(f(true), "Δ feature ven: its try build is running");
    }

    /// Short on room: the folder shortens from the left, keeping its last
    /// part, then goes whole; the branch stays whole.
    #[test]
    fn the_folder_shortens_then_goes() {
        let t = wt(1, Some("sb/fix-login"), "/w/.bise/worktrees/harness/fix-login");
        let head = "ψ worktree: its own copy of the repo, on sb/fix-login".width();
        assert_eq!(text_of(&line(&t, head + 3 + "…/harness/fix-login".width())), "ψ worktree: its own copy of the repo, on sb/fix-login · …/harness/fix-login");
        assert_eq!(text_of(&line(&t, head + 3 + "…/fix-login".width())), "ψ worktree: its own copy of the repo, on sb/fix-login · …/fix-login");
        assert_eq!(text_of(&line(&t, head + 5)), "ψ worktree: its own copy of the repo, on sb/fix-login");
        for w in [20, 60, 80, 150] {
            assert!(text_of(&line(&t, w)).width() <= w, "{w}");
        }
    }
}
