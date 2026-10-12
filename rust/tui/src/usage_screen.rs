//! `/usage` (cost-pause): what the project's model calls cost, today and
//! this week, by agent and by model, full screen like /scheduled. The
//! numbers and their words come from the hub (`usage/read`, its
//! `usage` answer: bise_proto's `words::usage_words`), so the desktop
//! says the same. While the hub still counts (its first read), the screen
//! says so and asks again every 2 s; open, it asks every 10 s. Esc
//! closes, `r` asks now.

use crate::app::App;
use crate::theme::{dim, faint, text};
use bise_proto::hub::HubEv;
use bise_proto::rows::UsageRow;
use crossterm::event::{KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::style::{Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Clear, Paragraph};
use ratatui::Frame;
use std::time::{Duration, Instant};
use unicode_width::UnicodeWidthStr;

/// The open screen and the hub's last answer.
#[derive(Default)]
pub(crate) struct Screen {
    /// (counting, all, agents, models) of the last `usage` answer
    pub(crate) got: Option<(bool, UsageRow, Vec<UsageRow>, Vec<UsageRow>)>,
    /// when it last asked
    pub(crate) asked: Option<Instant>,
}

/// `/usage` opens the screen and asks the hub.
pub(crate) fn open(app: &mut App) {
    app.usage = Some(Screen::default());
    ask(app);
}

fn ask(app: &mut App) {
    if let Some(sc) = app.usage.as_mut() {
        sc.asked = Some(Instant::now());
    }
    app.sb.call("usage/read", serde_json::json!({}), crate::sb::rpc::Then::Usage);
}

/// The hub's answer (sb/rpc.rs `Then::Usage`).
pub(crate) fn answered(app: &mut App, ev: HubEv) {
    let HubEv::Usage { counting, all, agents, models, .. } = ev else { return };
    if let Some(sc) = app.usage.as_mut() {
        sc.got = Some((counting, *all, agents, models));
    }
}

// ---- the rows (pure) ----

/// The screen's lines in `w` columns: the whole project, then by agent,
/// then by model; each row its name and the two columns, today and this
/// week (`$1.23 · 1.2M tok`).
pub(crate) fn lines(got: Option<&(bool, UsageRow, Vec<UsageRow>, Vec<UsageRow>)>, w: usize) -> Vec<Line<'static>> {
    let Some((counting, all, agents, models)) = got else {
        return vec![Line::from(Span::styled("reading the transcripts…", Style::default().fg(dim())))];
    };
    // a row: 2 + name + (2 + col) x 2, within `w` (80 columns too,
    // designer m_18932); a narrow screen gives the columns less
    let col = w.saturating_sub(6 + 18).div_euclid(2).clamp(14, 22);
    let name_w = w.saturating_sub(2 * col + 6).clamp(8, 40);
    let head = |t: &str| Line::from(Span::styled(t.to_string(), Style::default().fg(dim()).add_modifier(Modifier::BOLD)));
    let row = |name: &str, sub: &str, r: &UsageRow, strong: bool| {
        let mut n = clip(name, name_w);
        let nw = n.width();
        let st = if strong { Style::default().fg(text()).add_modifier(Modifier::BOLD) } else { Style::default().fg(text()) };
        let mut spans = vec![Span::raw("  "), Span::styled(n.clone(), st)];
        n.clear();
        if !sub.is_empty() && nw + 3 < name_w {
            let s = clip(sub, name_w - nw - 3);
            let sw = s.width();
            spans.push(Span::styled(format!(" · {s}"), Style::default().fg(faint())));
            spans.push(Span::raw(" ".repeat(name_w.saturating_sub(nw + 3 + sw))));
        } else {
            spans.push(Span::raw(" ".repeat(name_w.saturating_sub(nw))));
        }
        for s in [&r.today, &r.week] {
            // a plan's cell (tokens, no money) is dim
            let cell = if s.plan > 0 && s.plan == s.calls { Style::default().fg(dim()) } else { st };
            spans.push(Span::raw("  "));
            spans.push(Span::styled(format!("{:>col$}", s.words), cell));
        }
        Line::from(spans)
    };
    let mut out = vec![Line::from(vec![
        Span::raw(" ".repeat(name_w + 2)),
        Span::styled(format!("  {:>col$}  {:>col$}", "today", "7 days"), Style::default().fg(dim())),
    ])];
    out.push(row("all agents", "", all, true));
    out.push(Line::raw(""));
    out.push(head("by agent"));
    for a in agents {
        out.push(row(&a.name, &short_models(&a.models), a, false));
    }
    out.push(Line::raw(""));
    out.push(head("by model"));
    for m in models {
        out.push(row(&m.name, "", m, false));
    }
    out.push(Line::raw(""));
    // designer m_18789: nothing waits on him while it counts: dim
    if *counting {
        out.push(Line::from(Span::styled("counting the week's transcripts…", Style::default().fg(dim()))));
    }
    // the foot on one line, or cut at its last `·` when it doesn't fit
    let foot = "tokens in + out · estimates from bise's catalog prices · plans count tokens only";
    let foot_lines = if foot.width() + 2 <= w {
        vec![foot]
    } else {
        foot.rsplit_once(" · ").map_or(vec![foot], |(a, b)| vec![a, b])
    };
    for f in foot_lines {
        out.push(Line::from(Span::styled(format!("  {f}"), Style::default().fg(faint()))));
    }
    out.push(Line::from(Span::styled("r refresh   esc close", Style::default().fg(dim()))));
    out
}

/// The screen's title: `usage · ~$31.80 in the last 7 days` (no answer
/// yet, or nothing priced: `usage`).
pub(crate) fn title(got: Option<&(bool, UsageRow, Vec<UsageRow>, Vec<UsageRow>)>) -> String {
    match got {
        Some((_, all, _, _)) if all.week.calls > all.week.unpriced + all.week.plan => {
            format!("usage · {} in the last 7 days", bise_proto::thread::words::usd_estimate(all.week.cost_usd))
        }
        _ => "usage".to_string(),
    }
}

/// `foundry/claude-opus-5-5, mistral/x` -> `claude-opus-5-5, x`.
fn short_models(m: &str) -> String {
    m.split(", ").map(|x| x.rsplit('/').next().unwrap_or(x)).collect::<Vec<_>>().join(", ")
}

fn clip(s: &str, max: usize) -> String {
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

// ---- drawing and keys ----

pub(crate) fn draw(app: &mut App, frame: &mut Frame) {
    let Some(sc) = app.usage.as_ref() else { return };
    let counting = sc.got.as_ref().is_none_or(|g| g.0);
    let every = if counting { Duration::from_secs(2) } else { Duration::from_secs(10) };
    if sc.asked.is_none_or(|t| t.elapsed() >= every) {
        ask(app);
    }
    let full = frame.area();
    crate::pointer::region(full, crate::pointer::Shape::Default);
    frame.render_widget(Clear, full);
    if full.width < 30 || full.height < 10 {
        return;
    }
    let name = title(app.usage.as_ref().and_then(|s| s.got.as_ref()));
    let area = crate::artifacts_screen::draw_frame(app, frame, full, &name);
    let Some(sc) = app.usage.as_ref() else { return };
    frame.render_widget(Paragraph::new(lines(sc.got.as_ref(), area.width as usize)), area);
    crate::textlayer::text(area);
}

pub(crate) fn on_key(app: &mut App, k: &KeyEvent) -> bool {
    if app.usage.is_none() {
        return false;
    }
    if k.kind != KeyEventKind::Press {
        return true;
    }
    let ctrl = k.modifiers.contains(KeyModifiers::CONTROL);
    match k.code {
        KeyCode::Esc | KeyCode::Char('q') => app.usage = None,
        KeyCode::Char('c') | KeyCode::Char('g') if ctrl => app.usage = None,
        KeyCode::Char('r') => ask(app),
        _ => {}
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use bise_proto::rows::UsageSum;

    fn sum(words: &str) -> UsageSum {
        UsageSum { words: words.into(), calls: 1, ..Default::default() }
    }

    fn row(name: &str, models: &str, t: &str, w: &str) -> UsageRow {
        UsageRow { name: name.into(), models: models.into(), today: sum(t), week: sum(w) }
    }

    fn plain(l: &Line) -> String {
        l.spans.iter().map(|s| s.content.as_ref()).collect()
    }

    #[test]
    fn shows_the_project_then_agents_then_models() {
        let got = (
            false,
            row("", "", "~$4.12 · 1.2M", "~$31.80 · 9.8M"),
            vec![row("main", "foundry/claude-opus-5-5", "~$2.10 · 610k", "~$14.02 · 4.1M")],
            vec![row("mistral/mistral-small", "", "— · 100k", "— · 600k")],
        );
        let ls: Vec<String> = lines(Some(&got), 100).iter().map(plain).collect();
        assert!(ls[0].contains("today") && ls[0].contains("7 days"), "{ls:?}");
        assert!(ls[1].contains("all agents") && ls[1].contains("~$4.12 · 1.2M") && ls[1].contains("~$31.80 · 9.8M"));
        assert_eq!(ls[3].trim(), "by agent");
        assert!(ls[4].contains("main · claude-opus-5-5") && ls[4].contains("~$14.02 · 4.1M"), "{}", ls[4]);
        assert_eq!(ls[6].trim(), "by model");
        assert!(ls[7].contains("mistral/mistral-small") && ls[7].contains("— · 600k"));
        assert!(!ls.iter().any(|l| l.contains("counting")));
        assert_eq!(ls.last().unwrap(), "r refresh   esc close");
        // every line fits its width
        assert!(ls.iter().all(|l| l.width() <= 100), "{ls:?}");
        // an 80-column terminal (76 inside its frame): the columns and the
        // foot fit too, the foot on two lines (designer m_18932)
        let narrow: Vec<String> = lines(Some(&got), 76).iter().map(plain).collect();
        assert!(narrow.iter().all(|l| l.width() <= 76), "{narrow:#?}");
        assert!(narrow.iter().any(|l| l.contains("7 days")) && narrow.iter().any(|l| l.trim() == "plans count tokens only"), "{narrow:#?}");
    }

    #[test]
    fn says_it_counts_and_before_any_answer() {
        let got = (true, row("", "", "—", "—"), vec![], vec![]);
        assert!(lines(Some(&got), 80).iter().any(|l| plain(l) == "counting the week's transcripts…"));
        assert_eq!(plain(&lines(None, 80)[0]), "reading the transcripts…");
    }

    #[test]
    fn the_title_says_the_weeks_cost() {
        let mut all = row("", "", "", "");
        all.week.cost_usd = 31.8;
        assert_eq!(title(Some(&(false, all, vec![], vec![]))), "usage · ~$31.80 in the last 7 days");
        assert_eq!(title(None), "usage");
    }
}
