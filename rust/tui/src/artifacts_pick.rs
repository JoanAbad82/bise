//! The boxes of `/artifacts` (page artifacts-gallery v7, block b-term's
//! `m: move to…`): `m` moves the selected artifact to a folder (the ones
//! you moved to first, then the ones with the newest work; typing
//! filters, a digit picks, ctrl+⏎ makes the typed folder), `p` shows one
//! project (or all), `n` names a new folder. Pure: the box's state, its
//! choices, its lines and what a key does; the screen runs the choice
//! (artifacts_screen.rs).

use crate::artifacts::{Artifact, Folder};
use bise_proto::words::library as words;
use crate::artifacts_tree::{self as tree, parent_name, recent};
use crate::theme::{accent, dim, faint, text};
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use unicode_width::UnicodeWidthStr;

/// At most this many choices, one digit each.
const MAX: usize = 9;

/// The box that is up.
#[derive(Clone, Debug, PartialEq)]
pub(crate) enum Pick {
    /// `m`: the artifact (its key and title, its folder)
    Move { key: String, title: String, from: Option<String>, query: String, sel: usize },
    /// `p`
    Project { query: String, sel: usize },
    /// `n`: in that theme (none: a theme of its own)
    NewFolder { parent: Option<String>, name: String },
}

/// What a box chose.
#[derive(Clone, Debug, PartialEq)]
pub(crate) enum Choice {
    /// move it there
    Folder(String),
    /// move it out of its folder
    Unfiled,
    /// make this folder (in that theme), then move it there (`m`) or
    /// not (`n`)
    Make { name: String, parent: Option<String>, then_move: bool },
    /// show this project only (none: every project)
    Project(Option<String>),
}

/// What a key did.
#[derive(Clone, Debug, PartialEq)]
pub(crate) enum Outcome {
    Stay,
    Close,
    Chose(Choice),
}

/// A row of the box: the choice, its words and its dim words.
#[derive(Clone, Debug, PartialEq)]
pub(crate) struct Row {
    pub(crate) choice: Choice,
    pub(crate) words: String,
    pub(crate) dim: String,
}

fn has(hay: &str, q: &str) -> bool {
    hay.to_lowercase().contains(&q.to_lowercase())
}

/// The box's choices. `rows`: the library (a folder's newest work);
/// `moved`: the folders you moved to on this visit; `here`: this
/// project's name.
pub(crate) fn rows(pick: &Pick, folders: &[Folder], all: &[&Artifact], moved: &[String], here: &str) -> Vec<Row> {
    match pick {
        Pick::Move { from, query, .. } => {
            let q = query.trim();
            let mut out: Vec<Row> = recent(folders, all, moved, from.as_deref())
                .into_iter()
                .filter(|f| q.is_empty() || has(&f.name, q) || parent_name(f, folders).is_some_and(|p| has(&p, q)))
                .take(MAX)
                .map(|f| Row { choice: Choice::Folder(f.id.clone()), words: f.name.clone(), dim: parent_name(f, folders).unwrap_or_default() })
                .collect();
            if q.is_empty() && from.is_some() && out.len() < MAX {
                out.push(Row { choice: Choice::Unfiled, words: words::unfiled.into(), dim: String::new() });
            }
            out
        }
        Pick::Project { query, .. } => {
            let q = query.trim();
            let projects = tree::projects(all, here);
            let mut out = Vec::new();
            if q.is_empty() {
                out.push(Row { choice: Choice::Project(None), words: words::all_projects.into(), dim: all.len().to_string() });
            }
            out.extend(
                projects
                    .into_iter()
                    .filter(|(p, _)| q.is_empty() || has(p, q))
                    .map(|(p, n)| Row { choice: Choice::Project(Some(p.clone())), words: p, dim: n.to_string() }),
            );
            out.truncate(MAX);
            out
        }
        Pick::NewFolder { .. } => Vec::new(),
    }
}

/// The typed folder `m` can make: its words, when no folder has them
/// already. `theme/task` makes a task folder in that theme.
fn typed_new(pick: &Pick, folders: &[Folder]) -> Option<String> {
    let Pick::Move { query, .. } = pick else { return None };
    let q = query.trim();
    if q.is_empty() || folders.iter().any(|f| f.name.eq_ignore_ascii_case(q)) {
        return None;
    }
    Some(q.to_string())
}

/// `theme/task` → (task, the theme's id when it exists, else the
/// theme's name to make first); a plain name → (name, none).
pub(crate) fn split_path(words: &str, folders: &[Folder]) -> (String, Option<String>) {
    match words.split_once('/') {
        Some((t, k)) if !t.trim().is_empty() && !k.trim().is_empty() => {
            let theme = folders.iter().find(|f| f.parent.is_none() && f.name.eq_ignore_ascii_case(t.trim()));
            (k.trim().to_string(), Some(theme.map_or_else(|| t.trim().to_string(), |f| f.id.clone())))
        }
        _ => (words.trim().to_string(), None),
    }
}

/// A key in the box.
pub(crate) fn key(pick: &mut Pick, k: &KeyEvent, choices: &[Row], folders: &[Folder]) -> Outcome {
    let ctrl = k.modifiers.contains(KeyModifiers::CONTROL);
    let made = typed_new(pick, folders);
    match pick {
        Pick::NewFolder { parent, name } => match k.code {
            KeyCode::Esc => Outcome::Close,
            KeyCode::Enter if name.trim().is_empty() => Outcome::Stay,
            KeyCode::Enter => Outcome::Chose(Choice::Make { name: name.trim().to_string(), parent: parent.clone(), then_move: false }),
            KeyCode::Backspace => {
                name.pop();
                Outcome::Stay
            }
            KeyCode::Char(c) if !ctrl => {
                name.push(c);
                Outcome::Stay
            }
            _ => Outcome::Stay,
        },
        Pick::Move { query, sel, .. } | Pick::Project { query, sel } => {
            let n = choices.len();
            match k.code {
                KeyCode::Esc => Outcome::Close,
                KeyCode::Enter if ctrl || k.modifiers.contains(KeyModifiers::SUPER) => match made {
                    Some(m) => {
                        let (name, parent) = split_path(&m, folders);
                        Outcome::Chose(Choice::Make { name, parent, then_move: true })
                    }
                    None => Outcome::Stay,
                },
                KeyCode::Enter => match choices.get(*sel) {
                    Some(r) => Outcome::Chose(r.choice.clone()),
                    // the typed folder is the only row left: ⏎ makes it too
                    None => match made {
                        Some(m) => {
                            let (name, parent) = split_path(&m, folders);
                            Outcome::Chose(Choice::Make { name, parent, then_move: true })
                        }
                        None => Outcome::Stay,
                    },
                },
                KeyCode::Up => {
                    *sel = sel.saturating_sub(1);
                    Outcome::Stay
                }
                KeyCode::Down => {
                    *sel = (*sel + 1).min(n.saturating_sub(1));
                    Outcome::Stay
                }
                KeyCode::Char(c @ '1'..='9') if !ctrl => match choices.get(c as usize - '1' as usize) {
                    Some(r) => Outcome::Chose(r.choice.clone()),
                    None => Outcome::Stay,
                },
                KeyCode::Backspace => {
                    query.pop();
                    *sel = 0;
                    Outcome::Stay
                }
                KeyCode::Char(c) if !ctrl => {
                    query.push(c);
                    *sel = 0;
                    Outcome::Stay
                }
                _ => Outcome::Stay,
            }
        }
    }
}

/// The box's lines in `width` columns: its edge with the title, the
/// typed words, the choices (a digit each, the selected one tinted), the
/// typed folder `m` would make, its bottom edge.
pub(crate) fn lines(pick: &Pick, choices: &[Row], folders: &[Folder], theme_name: Option<&str>, width: usize) -> Vec<Line<'static>> {
    let w = width.clamp(24, 63);
    let edge = Style::default().fg(faint());
    let title = match pick {
        Pick::Move { title, .. } => words::move_to(crate::artifacts_screen::cut(title, w.saturating_sub(16))),
        Pick::Project { .. } => "show the artifacts of…".to_string(),
        Pick::NewFolder { .. } => match theme_name {
            Some(t) => format!("new folder in {}", crate::artifacts_screen::cut(t, w.saturating_sub(20))),
            None => words::key_new.to_string(),
        },
    };
    let mut out = Vec::new();
    let fill = w.saturating_sub(title.width() + 5);
    out.push(Line::from(vec![Span::styled(format!("╭─ {} ", title), edge), Span::styled(format!("{}╮", "─".repeat(fill)), edge)]));
    // a row between the edges: `│ ` + its words + blanks + `│`
    let framed = |mut spans: Vec<Span<'static>>, bg: Option<ratatui::style::Color>| {
        let used: usize = spans.iter().map(|s| s.content.width()).sum();
        spans.push(Span::raw(" ".repeat(w.saturating_sub(used + 3))));
        if let Some(bg) = bg {
            spans = spans.into_iter().map(|s| Span::styled(s.content, s.style.bg(bg))).collect();
        }
        let mut row = vec![Span::styled("│ ", edge)];
        row.extend(spans);
        row.push(Span::styled("│", edge));
        Line::from(row)
    };
    let typed = match pick {
        Pick::Move { query, .. } | Pick::Project { query, .. } => query.clone(),
        Pick::NewFolder { name, .. } => name.clone(),
    };
    let b = Style::default().fg(text()).add_modifier(Modifier::BOLD);
    out.push(framed(vec![Span::styled(format!("› {}", typed), b), Span::styled("▏", Style::default().fg(accent()))], None));
    let sel = match pick {
        Pick::Move { sel, .. } | Pick::Project { sel, .. } => *sel,
        Pick::NewFolder { .. } => usize::MAX,
    };
    for (i, r) in choices.iter().enumerate() {
        let mut spans = vec![
            // the numbers dim, like the inbox's options (designer m_40753)
            Span::styled(format!("{} ", i + 1), Style::default().fg(dim())),
            Span::styled(r.words.clone(), if i == sel { b } else { Style::default().fg(text()) }),
        ];
        if !r.dim.is_empty() {
            spans.push(Span::styled(format!("  {}", r.dim), Style::default().fg(dim())));
        }
        out.push(framed(spans, (i == sel).then(crate::theme::selection_bg)));
    }
    if let Some(m) = typed_new(pick, folders) {
        let at = choices.len();
        let words = words::new_folder_named(crate::artifacts_screen::cut(&m, w.saturating_sub(20)));
        let st = if sel == at || choices.is_empty() { b } else { Style::default().fg(text()) };
        out.push(framed(vec![Span::styled(words, st)], None));
    } else if choices.is_empty() && !matches!(pick, Pick::NewFolder { .. }) {
        out.push(framed(vec![Span::styled("nothing has those words", Style::default().fg(dim()))], None));
    }
    out.push(Line::from(Span::styled(format!("╰{}╯", "─".repeat(w.saturating_sub(2))), edge)));
    out
}

/// The key bar under a box.
pub(crate) fn key_pairs(pick: &Pick, n: usize, can_make: bool) -> Vec<(String, &'static str)> {
    let digits = match n {
        0 => None,
        1 => Some("1".to_string()),
        n => Some(format!("1-{}", n)),
    };
    let mut out: Vec<(String, &'static str)> = Vec::new();
    match pick {
        Pick::Move { .. } => {
            if let Some(d) = digits {
                out.push((d, words::key_pick));
            }
            out.push(("⏎".into(), words::key_move));
            if can_make {
                out.push(("ctrl+⏎".into(), words::key_new));
            }
        }
        Pick::Project { .. } => {
            if let Some(d) = digits {
                out.push((d, words::key_pick));
            }
            out.push(("⏎".into(), "show"));
        }
        Pick::NewFolder { .. } => out.push(("⏎".into(), "make it")),
    }
    out.push(("esc".into(), words::key_back));
    out
}

/// `m` can make what is typed (ctrl+⏎ shows in the bar).
pub(crate) fn can_make(pick: &Pick, folders: &[Folder]) -> bool {
    typed_new(pick, folders).is_some()
}

#[cfg(test)]
#[path = "artifacts_pick_tests.rs"]
mod tests;
