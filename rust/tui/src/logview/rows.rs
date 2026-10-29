//! `/log`'s words and rows (pure): the role column, the entries and
//! their bodies, the top and key rows, and the frame. Split out of
//! logview.rs; it reads [`View`], never changes what it holds but
//! its scroll and layout cache.

use super::*;

/// The color of a kind of entry: its label and its rail (designer's
/// pick; /log's alone, the thread never colors by kind). The bodies stay
/// text and dim. Under `NO_COLOR`, none: the labels' glyphs tell.
pub(crate) fn kind_color(role: &Role) -> ratatui::style::Color {
    if std::env::var_os("NO_COLOR").is_some_and(|v| !v.is_empty()) {
        return ratatui::style::Color::Reset;
    }
    match role {
        Role::You => theme::accent(),
        Role::Assistant => theme::text(),
        Role::Thinking => theme::dim(),
        Role::Call => theme::syntax_call(),
        Role::Result { ok: true } => theme::dim(),
        Role::Result { ok: false } | Role::Error => theme::error(),
        Role::Message => theme::syntax_keyword(),
        Role::Injected => theme::syntax_type(),
        Role::System | Role::Tools => theme::syntax_number(),
        Role::Summary => theme::syntax_string(),
        Role::Event => theme::faint(),
        Role::Sent(w) => sent_color(w),
    }
}

/// A provider word's color in `/debug completion`: the history's for
/// the same kind (designer's debug-views v2).
fn sent_color(w: &str) -> ratatui::style::Color {
    match w {
        "user" => theme::accent(),
        "assistant" | "model" => theme::text(),
        "system" | "developer" | "request" | "params" | "instructions" => theme::syntax_number(),
        w if w.starts_with("tools") => theme::syntax_number(),
        w if w.starts_with("tool_use") || w.contains("function_call") && !w.ends_with("output") => theme::syntax_call(),
        "result · failed" => theme::error(),
        w if w.starts_with("result") || w == "tool" || w.ends_with("output") => theme::dim(),
        "thinking" | "reasoning" | "reasoning_text" | "summary_text" => theme::dim(),
        _ => theme::faint(),
    }
}

/// The role column: glyph and word, and its color.
pub(crate) fn role_label(it: &Item, agent_word: &str) -> (String, Style) {
    let st = Style::default().fg(kind_color(&it.role));
    let g = theme::glyph;
    let w = match &it.role {
        Role::You => format!("{} you", g(theme::G_YOU)),
        Role::Assistant => format!("{} {agent_word}", g(theme::G_MAIN)),
        Role::Thinking => format!("{} thinking", g(theme::G_THINK)),
        Role::Call => match it.tool.as_str() {
            "bash" => format!("{} bash", g(theme::G_BASH)),
            "run_typescript" => format!("{} ts", g(theme::G_TS)),
            "edit" => format!("{} edit", g(theme::G_PATCH)),
            "write_file" => format!("{} write", g(theme::G_PATCH)),
            "apply_patch" => format!("{} patch", g(theme::G_PATCH)),
            "read_file" => "⇄ read".to_string(),
            t => t.to_string(),
        },
        Role::Result { ok: true } => format!("  {} result", if theme::ascii_mode() { "`" } else { "└" }),
        Role::Result { ok: false } => format!("  {} result", g(theme::G_FAILED)),
        Role::Message => format!("{} message", g(theme::G_MSG)),
        Role::Injected => "⊕ bise".into(),
        Role::System => "§ system".into(),
        Role::Tools => "§ tools".into(),
        Role::Summary => format!("{} summary", g(theme::G_SUMMARY)),
        Role::Error => format!("{} error", g(theme::G_INTERRUPTED)),
        Role::Event => "· event".into(),
        Role::Sent(w) => sent_word(w),
    };
    (w, st)
}

/// A provider word as the role column says it: a call by its tool's
/// glyph and word, the rest as the provider wrote it.
fn sent_word(w: &str) -> String {
    let g = theme::glyph;
    match w.strip_prefix("tool_use · ") {
        Some("bash") => format!("{} bash", g(theme::G_BASH)),
        Some("run_typescript") => format!("{} run_typescript", g(theme::G_TS)),
        Some(t) => format!("⚙ {t}"),
        None => w.to_string(),
    }
}

/// The rail left of an open body, in its kind's color (none for events).
pub(super) fn rail(role: &Role) -> Span<'static> {
    if *role == Role::Event {
        return Span::raw("    ");
    }
    let r = if theme::ascii_mode() { "  | " } else { "  ▎ " };
    Span::styled(r, Style::default().fg(kind_color(role)))
}

/// The widest an entry draws: a body's 4-column indent and the code
/// measure. A wider screen leaves the rest empty.
pub(crate) const MEASURE: usize = 4 + crate::render::CODE_MAX + 1;

/// The assistant's word in the role column: the agent's name when it
/// fits (`:* main`), else `agent`.
pub(super) fn agent_word(name: &str) -> String {
    if name.chars().count() <= 7 { name.to_string() } else { "agent".into() }
}

pub(super) fn pad(s: &str, w: usize) -> String {
    let sw = s.width();
    if sw >= w {
        crate::render::fit_chars(s, w)
    } else {
        format!("{s}{}", " ".repeat(w - sw))
    }
}

/// The right column of a header: the tokens (model view) or the body's
/// size (history).
pub(super) fn size_label(it: &Item, mode: Mode) -> String {
    match (mode, it.tokens) {
        (Mode::Completion, Some((n, est))) => format!("{}{} tok", if est { "~" } else { "" }, model::short_num(n)),
        _ if it.bytes() > 0 => model::short_bytes(it.bytes()),
        _ => String::new(),
    }
}

/// A rule's row: `── words ───…`.
pub(super) fn rule_row(words: &str, width: usize, style: Style) -> Line<'static> {
    let h = if theme::ascii_mode() { "-" } else { "─" };
    let head = format!("{h}{h} {} ", words);
    let room = width.saturating_sub(head.width());
    Line::from(Span::styled(format!("{}{}", crate::render::fit_chars(&head, width), h.repeat(room)), style))
}

/// The rows of one entry at `width`: its header, then its body (open),
/// or its fold label.
pub(crate) fn entry_rows(it: &Item, width: usize, open: bool, mode: Mode, who: &str) -> Vec<Line<'static>> {
    let faint = Style::default().fg(theme::faint());
    if let Some(r) = &it.rule {
        let st = if r.contains("compacted") {
            Style::default().fg(kind_color(&Role::Summary))
        } else {
            faint
        };
        return vec![rule_row(r, width, st)];
    }
    let narrow = width < 80;
    let seq = if it.seq == 0 { String::new() } else { format!("#{}", it.seq) };
    let (role, rst) = role_label(it, who);
    let size = size_label(it, mode);
    let mut left = vec![Span::styled(format!("{:>7}  ", seq), faint)];
    if !narrow {
        left.push(Span::styled(format!("{:<8}  ", it.time), faint));
    }
    left.push(Span::styled(format!("{}  ", pad(&role, 10)), rst));
    let used: usize = left.iter().map(|s| s.content.width()).sum();
    let size = if narrow && width < 60 { String::new() } else { size };
    let room = width.saturating_sub(used + size.width() + if size.is_empty() { 0 } else { 2 });
    let head = crate::render::fit_chars(&it.head.replace(['\n', '\t'], " "), room);
    let fill = room.saturating_sub(head.width());
    left.push(Span::styled(head, Style::default().fg(theme::text())));
    if !size.is_empty() {
        left.push(Span::raw(" ".repeat(fill + 2)));
        left.push(Span::styled(size, faint));
    }
    let mut rows = vec![Line::from(left)];
    if matches!(it.body, Body::None) {
        return rows;
    }
    if !open {
        let t = it.body.text();
        rows.push(Line::from(Span::styled(
            format!(
                "    {} {} lines {} {}",
                theme::glyph("▸"),
                t.lines().count().max(1),
                if theme::ascii_mode() { "-" } else { "·" },
                model::short_bytes(t.len())
            ),
            faint,
        )));
        return rows;
    }
    let inner = body_width(width);
    if !it.meta.is_empty() {
        rows.push(Line::from(vec![rail(&it.role), Span::styled(it.meta.clone(), faint)]));
    }
    let body = body_rows(&it.body, inner, it.role == Role::Thinking);
    rows.extend(body.into_iter().map(|l| {
        let mut spans = vec![rail(&it.role)];
        spans.extend(l.spans);
        Line::from(spans)
    }));
    rows
}

/// The columns of a body under a `width` screen: indented 4.
pub(super) fn body_width(width: usize) -> usize {
    width.saturating_sub(5).max(16)
}

/// A body's rows at `width`: markdown rendered, code colored in a box
/// (at most the thread's code measure), no blank rows at the end.
pub(crate) fn body_rows(b: &Body, width: usize, thinking: bool) -> Vec<Line<'static>> {
    let mut rows = body_rows_all(b, width, thinking);
    while rows.last().is_some_and(|l| l.spans.iter().all(|s| s.content.trim().is_empty())) {
        rows.pop();
    }
    rows
}

pub(super) fn body_rows_all(b: &Body, width: usize, thinking: bool) -> Vec<Line<'static>> {
    let boxed = width.min(crate::render::CODE_MAX);
    match b {
        Body::None => Vec::new(),
        Body::Md(t) => {
            // prose at the prose measure, its tables and code to the code one
            let rows = crate::markdown::md_lines(t, width.min(crate::render::PROSE_MAX), width);
            if !thinking {
                return rows;
            }
            rows.into_iter()
                .map(|l| {
                    Line::from(
                        l.spans
                            .into_iter()
                            .map(|s| Span::styled(s.content, s.style.fg(theme::dim()).add_modifier(Modifier::ITALIC)))
                            .collect::<Vec<_>>(),
                    )
                })
                .collect()
        }
        Body::Code { lang, text } => code_box(lang, text, boxed),
        Body::Plain(t) => code_box("", t, boxed),
    }
}

/// `text` in a code box, its lines colored as `lang` (syntax.rs); a
/// plain box when `lang` is "" or unknown.
pub(super) fn code_box(lang: &str, text: &str, width: usize) -> Vec<Line<'static>> {
    let text = crate::sanitize::clean(text, crate::sanitize::TAB_CODE);
    let l = crate::syntax::lang_of(lang);
    let mut state = crate::syntax::State::Normal;
    let mut hl: Vec<Vec<Span<'static>>> = Vec::new();
    for line in text.trim_end_matches('\n').split('\n') {
        let line = line.trim_end_matches('\r');
        let Some(l) = l else {
            hl.push(vec![Span::styled(line.to_string(), Style::default().fg(theme::text()))]);
            continue;
        };
        let (runs, next) = crate::syntax::line(l, state, line);
        state = next;
        let mut spans = Vec::new();
        let mut rest = line;
        for (n, t) in runs {
            let b = rest.char_indices().nth(n).map(|(b, _)| b).unwrap_or(rest.len());
            spans.push(Span::styled(rest[..b].to_string(), crate::syntax::style(t)));
            rest = &rest[b..];
        }
        if !rest.is_empty() {
            spans.push(Span::styled(rest.to_string(), Style::default().fg(theme::text())));
        }
        hl.push(spans);
    }
    crate::codeblock::lines(lang, &hl, String::new(), width)
}

/// `line` with each match of `needle` (lowercase ASCII) in the find
/// highlight.
pub(super) fn mark(line: Line<'static>, needle: &str) -> Line<'static> {
    if needle.is_empty() {
        return line;
    }
    let text: String = line.spans.iter().map(|s| s.content.as_ref()).collect();
    let low = text.to_ascii_lowercase();
    let ranges: Vec<(usize, usize)> = low.match_indices(needle).map(|(b, m)| (b, b + m.len())).collect();
    if ranges.is_empty() {
        return line;
    }
    let hit = Style::default().fg(theme::bg()).bg(theme::accent());
    let mut out: Vec<Span<'static>> = Vec::new();
    let mut at = 0usize;
    for s in line.spans {
        let c = s.content.as_ref();
        let end = at + c.len();
        let mut cut = vec![at, end];
        for &(a, b) in &ranges {
            for x in [a, b] {
                if x > at && x < end && c.is_char_boundary(x - at) {
                    cut.push(x);
                }
            }
        }
        cut.sort();
        cut.dedup();
        for w in cut.windows(2) {
            let piece = &c[w[0] - at..w[1] - at];
            if piece.is_empty() {
                continue;
            }
            let inside = ranges.iter().any(|&(a, b)| w[0] >= a && w[1] <= b);
            out.push(Span::styled(piece.to_string(), if inside { s.style.patch(hit) } else { s.style }));
        }
        at = end;
    }
    Line::from(out)
}

/// The top bar (designer's debug-views v2): the agent and what the tab
/// shows on the left, the two tabs on the right, the active one in text;
/// under it, what is above (history) or how the rows were made
/// (completion); then the filter and a note.
pub(super) fn top_rows(v: &View, width: usize) -> Vec<Line<'static>> {
    let on = Style::default().fg(theme::text()).add_modifier(Modifier::BOLD);
    let off = Style::default().fg(theme::dim());
    let faint = Style::default().fg(theme::faint());
    let (h, c) = if v.mode == Mode::History { (on, off) } else { (off, on) };
    let (events, above) = v.events();
    let left = if v.mode == Mode::History {
        format!("/debug {} {} {} {} newest at the bottom", v.agent, dot(), count(events, "event", "events"), dot())
    } else {
        let ready: Vec<&bise_session::reqlog::Slot> = v.slots.iter().filter(|s| s.meta().is_some()).collect();
        match v.slot.and_then(|i| v.slots.get(i)).and_then(|s| s.meta().map(|m| (s, m))) {
            Some((s, m)) => {
                let k = ready.iter().position(|r| r.n == s.n).map_or(0, |k| k + 1);
                let model = v.comp_of.shown_as.clone().map(|m| format!("as {m}")).unwrap_or_else(|| m.model.clone());
                format!(
                    "/debug {} {} request {k} of {} {} {} {} {} {} {}",
                    v.agent,
                    dot(),
                    ready.len(),
                    dot(),
                    v.comp_of.family,
                    dot(),
                    model,
                    dot(),
                    model::short_bytes(v.comp_of.bytes as usize)
                )
            }
            None => format!("/debug {} {} no request kept yet", v.agent, dot()),
        }
    };
    let tabs = "history   completion";
    let room = width.saturating_sub(tabs.width() + 2);
    let left = crate::render::fit_chars(&left, room);
    let fill = room.saturating_sub(left.width());
    let mut rows = vec![Line::from(vec![
        Span::styled(left, faint),
        Span::raw(" ".repeat(fill + 2)),
        Span::styled("history", h),
        Span::raw("   "),
        Span::styled("completion", c),
    ])];
    let second = if v.mode == Mode::History {
        if above > 0 {
            format!("{} {} older events {} scroll up, or g for the top", theme::glyph("↑"), above, dot())
        } else {
            "the whole session".to_string()
        }
    } else if v.raw {
        "each row as its bytes went out (r: drawn)".to_string()
    } else if v.comp_of.shown_as.is_some() {
        "this request as that provider's family gets it: made by the agent's runtime, not sent".to_string()
    } else {
        format!("the body sent, since the last compaction {} kept for the last 8 requests", dot())
    };
    rows.push(Line::from(Span::styled(crate::render::fit_chars(&second, width), faint)));
    if !v.off.is_empty() {
        let mut keys: Vec<&String> = v.off.iter().collect();
        keys.sort();
        let keys: Vec<String> = keys.iter().map(|k| k.trim_start_matches("tool:").to_string()).collect();
        rows.push(Line::from(Span::styled(format!("hidden: {}", keys.join(" ")), faint)));
    }
    if !v.note.is_empty() {
        rows.push(Line::from(Span::styled(crate::render::fit_chars(&v.note, width), Style::default().fg(theme::error()))));
    }
    rows
}

/// `1 entry`, `2 entries`.
pub(super) fn count(n: usize, one: &str, many: &str) -> String {
    format!("{n} {}", if n == 1 { one } else { many })
}

pub(super) fn dot() -> &'static str {
    if theme::ascii_mode() {
        "-"
    } else {
        "·"
    }
}

/// The key bar, or the search field while typed in.
pub(super) fn key_row(v: &View, width: usize) -> Line<'static> {
    let dim = Style::default().fg(theme::dim());
    let text = Style::default().fg(theme::text());
    if let Some(s) = v.search.as_ref().filter(|s| s.typing) {
        let right = v.hit_label();
        let left = format!("/{}", s.text);
        let room = width.saturating_sub(left.width() + right.width() + 1);
        return Line::from(vec![
            Span::styled(left, text),
            Span::styled("█", Style::default().fg(theme::accent())),
            Span::raw(" ".repeat(room)),
            Span::styled(right, dim),
        ]);
    }
    let keys: &[(&str, &str)] = if v.picker.is_some() {
        &[("space", "show/hide"), ("a", "show all"), ("esc", "done")]
    } else if v.searching() {
        &[("/", "search"), ("n", "next"), ("N", "previous"), ("esc", "clear search")]
    } else if v.mode == Mode::Completion {
        &[
            ("[ ]", "request"),
            ("r", "raw json"),
            ("/", "search"),
            ("g", "top"),
            ("G", "bottom"),
            ("tab", "history"),
            ("space", "open"),
            ("ctrl+o", "open all"),
            ("esc", "close"),
        ]
    } else {
        &[
            ("/", "search"),
            ("f", "filter"),
            ("g", "top"),
            ("G", "bottom"),
            ("tab", "completion"),
            ("space", "open"),
            ("ctrl+o", "open all"),
            ("esc", "close"),
        ]
    };
    let right = v.hit_label();
    let room = if right.is_empty() { width } else { width.saturating_sub(right.width() + 3) };
    let key_w = |(k, w): &(&str, &str)| k.width() + 1 + w.width();
    // narrow: drop keys from the right, never the first nor the last
    let mut keys: Vec<(&str, &str)> = keys.to_vec();
    let total = |ks: &[(&str, &str)]| ks.iter().map(key_w).sum::<usize>() + 3 * ks.len().saturating_sub(1);
    while keys.len() > 2 && total(&keys) > room {
        keys.remove(keys.len() - 2);
    }
    let mut spans = Vec::new();
    for (n, (k, w)) in keys.iter().enumerate() {
        spans.push(Span::styled(format!("{k} "), text));
        let gap = if n + 1 < keys.len() { "   " } else { "" };
        spans.push(Span::styled(format!("{w}{gap}"), dim));
    }
    let used: usize = spans.iter().map(|s| s.content.width()).sum();
    if !right.is_empty() && used + right.width() < width {
        spans.push(Span::raw(" ".repeat(width - used - right.width())));
        spans.push(Span::styled(right, dim));
    }
    Line::from(spans)
}

/// The filter picker's rows (checkboxes like /approvals).
pub(super) fn picker_rows(v: &View, p: &Picker) -> Vec<Line<'static>> {
    let mut rows = vec![Line::from(Span::styled("show", Style::default().fg(theme::text()).add_modifier(Modifier::BOLD)))];
    for (k, r) in p.rows.iter().enumerate() {
        let on = !v.off.contains(r);
        let mark = if on { "[x]" } else { "[ ]" };
        let cur = if k == p.sel { theme::glyph(theme::G_YOU) } else { " " };
        let word = r.strip_prefix("tool:").map(|t| format!("tool {t}")).unwrap_or_else(|| r.clone());
        let st = if k == p.sel { Style::default().fg(theme::text()) } else { Style::default().fg(theme::dim()) };
        rows.push(Line::from(Span::styled(format!("{cur} {mark} {word}"), st)));
    }
    rows
}

/// The screen: the top bar, the entries from `top`, the key bar.
pub(crate) fn lines(v: &mut View, width: usize, height: usize) -> Vec<Line<'static>> {
    // the entries at the measure; the bars across the screen
    let ew = width.min(MEASURE);
    if v.width != ew {
        v.width = ew;
        v.cache.clear();
    }
    let top = top_rows(v, width);
    let body_h = height.saturating_sub(top.len() + 2).max(1);
    v.page = body_h;
    v.reveal(ew, body_h);
    let needle = v.search.as_ref().map(|s| s.text.to_ascii_lowercase()).unwrap_or_default();
    let mut out = top;
    out.push(Line::from(""));
    let mut body: Vec<Line<'static>> = Vec::new();
    let mut k = v.top.0;
    let mut skip = v.top.1;
    while body.len() < body_h && k < v.vis.len() {
        let sel = k == v.sel;
        let rows = v.rows(k, ew).to_vec();
        for (r, mut l) in rows.into_iter().enumerate() {
            if skip > 0 {
                skip -= 1;
                continue;
            }
            if body.len() >= body_h {
                break;
            }
            if r == 0 && sel {
                // the cursor: its header bold, a mark in the first column
                if let Some(first) = l.spans.first_mut() {
                    let c = first.content.to_string();
                    let c = format!("{}{}", theme::glyph(theme::G_YOU), c.chars().skip(1).collect::<String>());
                    *first = Span::styled(c, Style::default().fg(theme::accent()));
                }
                l = Line::from(l.spans.into_iter().map(|s| Span::styled(s.content, s.style.add_modifier(Modifier::BOLD))).collect::<Vec<_>>());
            }
            body.push(mark(l, &needle));
        }
        k += 1;
    }
    if v.vis.is_empty() {
        body.push(Line::from(Span::styled("nothing to show: f changes the filter", Style::default().fg(theme::dim()))));
    }
    while body.len() < body_h {
        body.push(Line::from(""));
    }
    out.extend(body);
    out.push(key_row(v, width));
    out
}

pub(crate) fn draw(app: &mut App, frame: &mut Frame) {
    let Some(v) = app.logview.as_mut() else { return };
    let full = frame.area();
    crate::pointer::region(full, crate::pointer::Shape::Default);
    frame.render_widget(Clear, full);
    if full.width < 30 || full.height < 8 {
        return;
    }
    let area = Rect { x: full.x + 1, y: full.y, width: full.width - 2, height: full.height };
    let rows = lines(v, area.width as usize, area.height as usize);
    frame.render_widget(Paragraph::new(rows), area);
    if let Some(p) = v.picker.clone() {
        let rows = picker_rows(v, &p);
        let w = rows.iter().map(|l| l.width()).max().unwrap_or(10) as u16 + 4;
        let h = (rows.len() as u16 + 2).min(full.height.saturating_sub(2));
        let r = Rect { x: full.x + full.width.saturating_sub(w + 2), y: full.y + 3, width: w.min(full.width), height: h };
        frame.render_widget(Clear, r);
        let inner = Rect { x: r.x + 2, y: r.y + 1, width: r.width.saturating_sub(4), height: r.height.saturating_sub(2) };
        frame.render_widget(
            ratatui::widgets::Block::default()
                .borders(ratatui::widgets::Borders::ALL)
                .border_style(Style::default().fg(theme::faint())),
            r,
        );
        frame.render_widget(Paragraph::new(rows), inner);
    }
    crate::textlayer::text(area);
}
