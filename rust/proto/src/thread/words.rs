//! The words a thread's rows show, made once (architect m_10476): the
//! hub's fold and the TUI both call these, so the window never rebuilds
//! a row's text. Pure std; a word that needs something outside this
//! crate (a provider's long name) takes it from the caller.

use super::lines::{self, Hub, Obs, TurnEnd};
use super::{Notice, NoticeLevel, ToolItem, ToolKind};

/// How long the model thought before a reply: the time since the line
/// before it (the reply comes one batch after the previous line); 0 when
/// either time is unknown (a replay).
pub fn thought_ms(prev_ms: u64, at_ms: u64) -> u64 {
    if prev_ms == 0 || at_ms == 0 {
        return 0;
    }
    at_ms.saturating_sub(prev_ms)
}

/// A tool call's duration: its result line's time minus its call line's;
/// None when either is unknown (0: a replay), as for a thinking.
pub fn tool_ms(call_ms: u64, result_ms: u64) -> Option<u64> {
    (call_ms != 0 && result_ms != 0).then(|| result_ms.saturating_sub(call_ms))
}

/// 3200 -> "3.2s", 42_000 -> "42s", 125_000 -> "2m5s"; 0 -> "".
pub fn think_time(ms: u64) -> String {
    if ms == 0 {
        String::new()
    } else if ms < 10_000 {
        format!("{}.{}s", ms / 1000, (ms % 1000) / 100)
    } else if ms < 60_000 {
        format!("{}s", ms / 1000)
    } else {
        format!("{}m{}s", ms / 60_000, (ms % 60_000) / 1000)
    }
}

/// A thinking row's head: "thought for 3.2s", "thought" (time unknown).
pub fn thought_for(ms: u64) -> String {
    match think_time(ms) {
        d if d.is_empty() => "thought".into(),
        d => format!("thought for {d}"),
    }
}

fn notice(level: NoticeLevel, text: String) -> Option<Notice> {
    Some(Notice { level, text, retry: None })
}

/// A runtime observation as the line he reads (info, warn, err), or None
/// when it is no notice (a reply, a tool step, the compaction rows,
/// usage, a completed turn, plumbing). `name`: a provider's long name
/// (see [`no_key`]). A failed turn says why; a stop someone asked for is
/// a warn, not a failure.
pub fn obs_notice(o: &Obs, name: &dyn Fn(&str, &str) -> String) -> Option<Notice> {
    use NoticeLevel::*;
    match o {
        Obs::NotificationReceived(t) => notice(Info, format!("notification : {t}")),
        Obs::NotificationDelivered(t) => notice(Info, format!("notification delivered to the model: {t}")),
        // H9: its data rides on the notice (one row per run of them)
        Obs::ProviderRetry(t) => Some(Notice { level: Warn, text: provider_retry(t), retry: lines::retry(t) }),
        Obs::HarnessRestarted(t) => notice(
            Err,
            format!("the harness crashed ({t}) and restarted — the current turn is interrupted, the history is restored up to the last model call"),
        ),
        // no key, or a ChatGPT plan line: the turn's end says it, once
        // (BISE-294; subscriptions)
        Obs::CandidateDiscarded(t) if no_key(t, name).is_some() || is_plan_line(t) => None,
        Obs::CandidateDiscarded(t) => notice(Warn, format!("candidate discarded: {t}")),
        Obs::CompactionFailed(t) => notice(Err, format!("compaction failed: {t}")),
        Obs::SessionRestored(t) => notice(Info, format!("session restored · {} messages", t.trim_end_matches(" messages"))),
        Obs::NullIteration => notice(Warn, "empty response from the model — retrying".into()),
        Obs::TurnDone(TurnEnd::Failed(why)) => Some(turn_failed(why, name)),
        Obs::TurnDone(TurnEnd::Interrupted { by: None }) => notice(Warn, "turn interrupted".into()),
        Obs::TurnDone(TurnEnd::Interrupted { by: Some(by) }) => notice(Warn, format!("turn interrupted by {by}")),
        Obs::TurnDone(TurnEnd::Other(t)) | Obs::TurnStalled(t) => notice(Err, format!("turn stopped: {t}")),
        _ => None,
    }
}

/// A turn that ended on `failed: <why>`: the ChatGPT plan's own lines (a
/// limit, plan use off, usage not checked, the sign-in expired) are a ▲
/// that says what to do, a missing key says which, else a ✗ with why.
pub fn turn_failed(why: &str, name: &dyn Fn(&str, &str) -> String) -> Notice {
    if is_plan_line(why) {
        return Notice { level: NoticeLevel::Warn, text: why.to_string(), retry: None };
    }
    match no_key(why, name) {
        Some(line) => Notice { level: NoticeLevel::Err, text: line, retry: None },
        None => Notice { level: NoticeLevel::Err, text: format!("turn failed: {why}"), retry: None },
    }
}

/// `core rejected: <why>`: right after an interrupt the in-flight
/// completion has no turn to land on (BR-003, expected plumbing, an
/// info); anything else is an error.
pub fn rejected(r: &str) -> Notice {
    if r == "no pending completion" || r == "no pending tool result" {
        return Notice { level: NoticeLevel::Info, text: "in-flight response dropped (turn interrupted)".into(), retry: None };
    }
    // his queued message, taken back before delivery (sb-core's unqueue)
    if r == "taken_back" {
        return Notice { level: NoticeLevel::Info, text: "taken back".into(), retry: None };
    }
    Notice { level: NoticeLevel::Err, text: r.to_string(), retry: None }
}

/// A hub line that reads as a notice: a warning, a spawn (`✚`), computer
/// use, a direct message (`⇄`).
pub fn hub_notice(h: &Hub) -> Option<Notice> {
    match h {
        Hub::Warn(t) => notice(NoticeLevel::Warn, t.clone()),
        Hub::Spawn(t) => notice(NoticeLevel::Info, format!("✚ {t}")),
        Hub::Computer(t) => notice(NoticeLevel::Info, t.clone()),
        Hub::Direct(t) => notice(NoticeLevel::Info, format!("⇄ {t}")),
        // a message he routed by hand (`you → @docs : thanks`, no item):
        // the TUI's `→ …` info line
        Hub::Other { kind, text } if kind == "route" => notice(NoticeLevel::Info, format!("→ {text}")),
        // any other kind (`info`: '@t1 archived · its worktree removed',
        // or a known kind's line that doesn't parse): its words, the
        // TUI's info line (sb.rs hub_ev); a landed line that doesn't
        // parse says nothing
        Hub::Other { kind, .. } if kind == "landed" => None,
        Hub::Other { kind, text } if kind == "card-closed" => notice(NoticeLevel::Info, format!("card {text} ")),
        Hub::Other { text, .. } => notice(NoticeLevel::Info, text.clone()),
        _ => None,
    }
}

/// 950 -> "950", 42_310 -> "42k", 1_250_000 -> "1.2M".
pub fn tokens(n: u64) -> String {
    if n < 1000 {
        n.to_string()
    } else if n < 1_000_000 {
        format!("{}k", (n + 500) / 1000)
    } else {
        let tenths = (n + 50_000) / 100_000;
        if tenths.is_multiple_of(10) {
            format!("{}M", tenths / 10)
        } else {
            format!("{}.{}M", tenths / 10, tenths % 10)
        }
    }
}

/// `used` of `window` in percent, rounded (0 for no window).
pub fn percent(used: u64, window: u64) -> u64 {
    if window == 0 {
        return 0;
    }
    // saturating: a corrupt token count never overflows (debug panics)
    used.saturating_mul(100).saturating_add(window / 2) / window
}

/// The context gauge in full (the divider while a turn holds, the feed's
/// usage line): "42k / 200k tokens · 21%", or "42k tokens" without a
/// known window.
pub fn context_label(used: u64, window: Option<u64>) -> String {
    match window {
        Some(w) => format!("{} / {} tokens · {}%", tokens(used), tokens(w), percent(used, w)),
        None => format!("{} tokens", tokens(used)),
    }
}

/// The context gauge at rest (BISE-303, the divider): "42k · 21%", or
/// "42k" without a known window. `window`: the model's, from the catalog
/// (the caller's).
pub fn context_words(used: u64, window: Option<u64>) -> String {
    match window {
        Some(w) => format!("{} · {}%", tokens(used), percent(used, w)),
        None => tokens(used),
    }
}

/// Money spent in USD, the one way bise says it: `$4.12`, two decimals;
/// `<$0.01` under a cent, never `$0.0000` (designer m_18932; the TUI's
/// usage line, `/usage`, the desktop's settings). Nothing spent: `$0.00`.
pub fn usd(v: f64) -> String {
    if v > 0.0 && v < 0.005 { "<$0.01".to_string() } else { format!("${:.2}", v) }
}

/// An estimate from catalog prices: `~$4.12`; under a cent `<$0.01`
/// (already a bound, no `~`). `/usage`'s cells and title.
pub fn usd_estimate(v: f64) -> String {
    let m = usd(v);
    if m.starts_with('<') { m } else { format!("~{m}") }
}

/// A usage sum's words (`/usage`, `usage/read`, designer m_18789):
/// `~$1.23 · 1.2M` (an estimate; tokens in + out); `— · 40k` when none of
/// its calls is priced; `your ChatGPT plan · 40k` when they all ran on a
/// plan; `—` for no call at all. A sum partly priced says its priced part.
pub fn usage_words(cost_usd: f64, priced: bool, plan_only: bool, input: u64, output: u64, calls: u64) -> String {
    if calls == 0 {
        return "—".to_string();
    }
    let money = match (priced, plan_only) {
        (true, _) => usd_estimate(cost_usd),
        (false, true) => "your ChatGPT plan".to_string(),
        (false, false) => "—".to_string(),
    };
    format!("{money} · {}", tokens(input.saturating_add(output)))
}

/// `1 file`, `9 files` (the TUI's diff view, a landed row).
pub fn files_word(n: u64) -> String {
    if n == 1 { "1 file".to_string() } else { format!("{n} files") }
}

/// A landed row's words (site/m/artifacts D): `3 files +42 −18`; a side
/// with no lines is left out.
pub fn landed(files: u64, add: u64, del: u64) -> String {
    let mut w = files_word(files);
    if add > 0 {
        w.push_str(&format!(" +{add}"));
    }
    if del > 0 {
        w.push_str(&format!(" −{del}"));
    }
    w
}

/// An artifact's kind as its chip says it: `PR`, `file` (no kind),
/// else the kind (`page`, `image`).
pub fn kind_word(kind: &str) -> String {
    match kind {
        "pr" | "PR" => "PR".to_string(),
        "" => "file".to_string(),
        k => k.to_string(),
    }
}

/// A gate's card answered, folded (approvals-design.md §9): yes or no,
/// the sentence, the words under it. `how`: `allowed`, `outside`,
/// `outside-always`, anything else a no (with his note).
pub fn approval(how: &str, who: &str, what: &str, note: &str) -> (bool, String, String) {
    let what = what.trim();
    match how {
        "allowed" => (true, format!("you allowed {who}: {what}"), String::new()),
        "outside" => (true, format!("you let {who} run it outside the sandbox: {what}"), String::new()),
        "outside-always" => (true, format!("you always let {what} run outside the sandbox here"), String::new()),
        _ => (false, format!("you said no to {who}: {what}"), note.trim().to_string()),
    }
}

/// The columns an answer stays on its line within (BISE-307, designer).
pub const ANSWER_ON_THE_LINE: usize = 30;

/// The sentence of an answer to `who` and the words under it (BISE-307):
/// a short one-line answer stays on the line (`you answered perf:
/// both`), a longer one goes under it, whole. `width`: the caller's
/// display width of a string (the TUI's unicode width).
pub fn answered_split(who: &str, words: &str, width: &dyn Fn(&str) -> usize) -> (String, String) {
    let w = words.trim();
    if !w.contains('\n') && width(w) <= ANSWER_ON_THE_LINE {
        (format!("you answered {who}: {w}"), String::new())
    } else {
        (format!("you answered {who}"), w.to_string())
    }
}

/// The row of what he did on a page (page-answer-row, architect m_20833):
/// the head, what it answered (a card's question, "" none) and his words
/// under it. One answer to a card reads as any card answer (`you answered
/// main` · its question, his words); a start asks for an agent; anything
/// else names the page, his notes one per line. Never the hub's template.
pub fn page_answer(p: &crate::parts::PageSaid<'_>, width: &dyn Fn(&str) -> usize) -> (String, String, String) {
    let (to, title, notes) = (p.to, p.title, p.notes);
    if let [n] = notes {
        if !n.asked.is_empty() {
            let (head, note) = answered_split(to, &page_note_words(n, false), width);
            return (head, n.asked.trim().to_string(), note);
        }
    }
    // a note is not an answer (designer m_20985): what he sent, the page
    // as its ↗ link
    let head = match (notes.iter().all(|n| n.kind == "start"), notes.len()) {
        (true, _) => format!("you asked {to} for an agent on ↗ {title}"),
        (false, 1) => format!("you sent {to} a note on ↗ {title}"),
        (false, n) => format!("you sent {to} {n} notes on ↗ {title}"),
    };
    let lines: Vec<String> = notes.iter().map(|n| page_note_words(n, true)).filter(|l| !l.is_empty()).collect();
    (head, String::new(), lines.join("\n"))
}

/// One note's words: the option he picked, his note, his mark (`✓ done`,
/// `♡ keep`), an edit as `"old" → "new"`; `on`: the words it is on in
/// front (`"Revenue": use March`).
pub fn page_note_words(n: &crate::parts::PageNote, on: bool) -> String {
    let text = n.text.trim();
    let quote = one_line(&n.quote, 60);
    let mark = match n.kind.as_str() {
        "edit" => return format!("\"{quote}\" → \"{}\"", one_line(text, 60)),
        "tick" if text.is_empty() || text == "done" => "✓ done",
        "keep" => "♡ keep",
        "drop" => "✗ drop",
        "unsure" => "~ not sure",
        "approve" => "✓ approve",
        "skip" => "skip",
        _ => text,
    };
    match on && !quote.is_empty() {
        true => format!("\"{quote}\": {mark}"),
        false => mark.to_string(),
    }
}

/// The gauge's compact form (the TUI's task list, the window's sidebar):
/// "21%", or "42k" without a known window.
pub fn short_words(used: u64, window: Option<u64>) -> String {
    match window {
        Some(w) => format!("{}%", percent(used, w)),
        None => tokens(used),
    }
}

/// The first non-empty line, clipped to `max` characters (with `…`).
pub fn one_line(s: &str, max: usize) -> String {
    let l = s.lines().map(str::trim).find(|l| !l.is_empty()).unwrap_or("");
    if l.chars().count() <= max {
        return l.to_string();
    }
    let mut out: String = l.chars().take(max.saturating_sub(1)).collect();
    out.push('…');
    out
}

/// The longest a scheduled task's name is (designer m_14531): past it,
/// [`name_fit`] keeps the words that fit.
pub const NAME_MAX: usize = 32;

/// A scheduled task's plain name when no model named it (designer
/// m_15602, architect m_14532: the one fallback, for the hub's every_name,
/// its rows and an old hub's lines). A label, not the question: the
/// first words of its instruction up to its first `:`, `?`, `;`, `.`,
/// `,` or `(` (at most 5), without a leading `tag:` or its agent's own
/// name (the row shows it beside), paths (`/`, `~`, `$`), flags (`-x`)
/// or quotes, cut at a word past [`NAME_MAX`], never with `…`.
pub fn timer_fallback(text: &str, agent: &str) -> String {
    let mut words = text.split_whitespace().peekable();
    // `amb-core: read …` or `amb-core read …`: who it wakes, said again
    let is_tag = |w: &str| w.len() > 1 && w.ends_with(':') && !w[..w.len() - 1].contains(':');
    if words.peek().is_some_and(|w| is_tag(w) || (!agent.is_empty() && w.eq_ignore_ascii_case(agent))) {
        words.next();
    }
    let quote = |c: char| matches!(c, '"' | '\'' | '`' | '«' | '»' | '“' | '”' | ')' | ']');
    let mut kept: Vec<String> = Vec::new();
    for w in words {
        if w.starts_with(['(', '[']) {
            break;
        }
        if w.contains('/') || w.starts_with(['~', '$', '-']) {
            continue;
        }
        let w: String = w.chars().filter(|c| !quote(*c)).collect();
        let bare = w.trim_end_matches([',', ';', ':', '.', '?', '!']);
        if !agent.is_empty() && bare.eq_ignore_ascii_case(agent) {
            // its agent's name, wherever it sits (designer m_15921), and a
            // `for` / `on` it leaves dangling: `check the build`
            if kept.last().is_some_and(|k| k == "for" || k == "on") {
                kept.pop();
            }
        } else if !bare.is_empty() {
            kept.push(bare.to_string());
        }
        if bare.len() < w.len() || kept.len() == 5 {
            break;
        }
    }
    let name = name_fit(&kept.join(" "));
    if name.is_empty() {
        name_fit(&one_line(text, 200))
    } else {
        name
    }
}

/// A name without its agent's name in front (designer m_15602: the row
/// already shows it): `answer-line build check` on answer-line's row is
/// `build check`; a name that is only the agent's name stays.
pub fn name_without_agent(name: &str, agent: &str) -> String {
    let rest = (!agent.is_empty())
        .then(|| name.strip_prefix(agent))
        .flatten()
        .filter(|r| r.starts_with([' ', ':']))
        .map(|r| r.trim_start_matches([' ', ':']).trim());
    match rest {
        Some(r) if !r.is_empty() => r.to_string(),
        _ => name.to_string(),
    }
}

/// A name on one line, at most [`NAME_MAX`] characters, never cut inside
/// a word and never with `…` (designer m_15602: a label): past it, the
/// words that fit (a first word longer than that is cut, the only way to
/// show it).
pub fn name_fit(name: &str) -> String {
    let one = name.split_whitespace().collect::<Vec<_>>().join(" ");
    if one.chars().count() <= NAME_MAX {
        return one;
    }
    let mut out = String::new();
    for w in one.split(' ') {
        let n = out.chars().count() + usize::from(!out.is_empty()) + w.chars().count();
        if n > NAME_MAX {
            break;
        }
        if !out.is_empty() {
            out.push(' ');
        }
        out.push_str(w);
    }
    if out.is_empty() {
        out = one.chars().take(NAME_MAX).collect();
    }
    out
}

/// The tools entry's counted words: "read 6 files, ran 4 commands".
pub fn summary(items: &[ToolItem]) -> String {
    let n = |k: ToolKind| items.iter().filter(|i| i.kind == k).count();
    let s = |n: usize, one: &str, many: &str| if n == 1 { one.to_string() } else { format!("{n} {many}") };
    let mut parts = Vec::new();
    let (r, e, x, q, o) = (n(ToolKind::Read), n(ToolKind::Edit), n(ToolKind::Run), n(ToolKind::Search), n(ToolKind::Other));
    if r > 0 {
        parts.push(format!("read {}", s(r, "1 file", "files")));
    }
    if e > 0 {
        parts.push(format!("edited {}", s(e, "1 file", "files")));
    }
    if x > 0 {
        parts.push(format!("ran {}", s(x, "1 command", "commands")));
    }
    if q > 0 {
        parts.push(format!("searched {}", s(q, "once", "times")));
    }
    if o > 0 {
        parts.push(s(o, "1 other step", "other steps"));
    }
    parts.join(", ")
}

/// A model call that failed and waits to retry (`provider_retry: 2/10 ·
/// provider 529 (transient) · retry in 4s`), as the user reads it while
/// the call waits.
pub fn provider_retry(t: &str) -> String {
    match lines::retry(t) {
        // 2/10 failed: the plan is attempt 3/10 after the pause
        Some(r) => format!(
            "model call failed (attempt {a}/{m}): {why} · retry {n}/{m} in {s}s",
            a = r.attempt,
            m = r.max,
            why = r.why,
            n = r.attempt.saturating_add(1),
            s = r.wait_ms / 1000
        ),
        None => format!("model call failed: {}", t),
    }
}

/// The openings of the runtime's ChatGPT plan lines (bend/runtime, the
/// designer's final words): matched on these, not the whole line.
pub const PLAN_LINES: [&str; 4] = [
    "your ChatGPT plan's limit for bise is reached.",
    "ChatGPT plan use is off for bise.",
    "ChatGPT couldn't check your plan's usage.",
    "your ChatGPT sign-in expired.",
];

/// A turn ended on one of the ChatGPT plan's lines.
pub fn is_plan_line(t: &str) -> bool {
    PLAN_LINES.iter().any(|p| t.starts_with(p))
}

/// The plan line that says the sign-in expired.
pub fn is_expired_line(t: &str) -> bool {
    t.starts_with(PLAN_LINES[3])
}

/// The runtime's words for a model whose provider has no key (BISE-294,
/// runtime/provider.bend model_call.key: `no openrouter key yet
/// (OPENROUTER_API_KEY is not set): /provider sets it up`), and the older
/// runtime's bare `OPENROUTER_API_KEY is not set`, as the designer's line:
/// `turn stopped: no OpenRouter key yet. /provider sets it up.` `name`:
/// a provider's long name from its id or its key's variable (the
/// catalog's, which this crate doesn't depend on).
pub fn no_key(why: &str, name: &dyn Fn(&str, &str) -> String) -> Option<String> {
    let why = why.trim();
    let name = if let Some(rest) = why.strip_prefix("no ") {
        let (id, _) = rest.split_once(" key yet (")?;
        why.contains(" is not set)").then(|| name(id, ""))?
    } else {
        let var = why.strip_suffix(" is not set")?;
        (var.ends_with("_KEY") && !var.contains(' ')).then(|| name("", var))?
    };
    Some(format!("turn stopped: no {} key yet. /provider sets it up.", name))
}

// ---- event-wake: an agent waiting on an event (designer's page
// event-wake). Its live line, its row's age, and the line of a watch's
// end; never the accent, only a non-zero rc in red.

/// A version switch's status line (the window's one line under its title
/// bar, architect m_20569): `reloading bise on <to>` while it runs, `✓
/// reloaded on <to>` once the new hub is up (and when its probation
/// passed), `▲ couldn't reload: <why>` when it rolled back. None: a phase
/// this version doesn't know. The window decides how long it shows.
pub fn switch_line(r: &crate::rows::SwitchRow) -> Option<(String, NoticeLevel)> {
    use crate::rows::SwitchPhase::*;
    Some(match r.phase {
        Reloading => (format!("reloading bise on {}", r.to), NoticeLevel::Info),
        Up | Passed => (format!("✓ reloaded on {}", r.to), NoticeLevel::Info),
        RolledBack => (format!("▲ couldn't reload: {}", r.reason.as_deref().unwrap_or("the new version failed")), NoticeLevel::Warn),
        Unknown => return None,
    })
}

/// How long something that runs now has run (designer's
/// agent-waiting-states, the time rule: what runs now is a duration,
/// never a start on the clock): `40 s`, `3 min`, `2 h`, `2 d`; `short`
/// (the TUI's): `40s`, `3m`, `2h`, `2d`. Callers add their own `for` /
/// `running for`.
pub fn wait_len(ms: u64, short: bool) -> String {
    let s = ms / 1000;
    let (n, unit, tight) = match s {
        0..=59 => (s, "s", "s"),
        60..=3599 => (s / 60, "min", "m"),
        3600..=86_399 => (s / 3600, "h", "h"),
        _ => (s / 86_400, "d", "d"),
    };
    if short { format!("{n}{tight}") } else { format!("{n} {unit}") }
}

/// How long a watch waited, in its end's line: `45s`, `2m04s`, `1h00m`,
/// `24h`, `30h15m`.
pub fn wake_dur(ms: u64) -> String {
    let s = ms / 1000;
    match s {
        0..=59 => format!("{}s", s),
        60..=3599 => format!("{}m{:02}s", s / 60, s % 60),
        _ if s % 3600 / 60 == 0 && s >= 86_400 => format!("{}h", s / 3600),
        _ => format!("{}h{:02}m", s / 3600, s % 3600 / 60),
    }
}

/// What a watch waits for, as a sentence's object: `cargo test`, a
/// file's `build.rc to appear`; a note names the thing itself (`the
/// reindex`, designer m_17730).
pub fn watch_label(kind: crate::rows::WatchKind, what: &str, noted: bool) -> String {
    match kind {
        crate::rows::WatchKind::File if !noted => format!("{} to appear", what),
        _ => what.to_string(),
    }
}

/// What a watch waits for, as the end of `continues when …` or `if …`
/// (agent-waiting-states): `cargo bench ends`, `build.rc appears`; a
/// note says the event itself (`the nightly gate goes red`).
pub fn watch_event(kind: crate::rows::WatchKind, what: &str, noted: bool) -> String {
    match kind {
        _ if noted => what.to_string(),
        crate::rows::WatchKind::File => format!("{} appears", what),
        _ => format!("{} ends", what),
    }
}

const WEEKDAYS: [&str; 7] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTHS: [&str; 12] = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/// An instant on the local clock: its day number and `08:07`. `off`: its
/// own offset (seconds east of UTC), so a DST change between two instants
/// never moves a day.
fn local_day(ms: u64, off: i32) -> (i64, String) {
    let s = (ms / 1000) as i64 + i64::from(off);
    (s.div_euclid(86_400), format!("{:02}:{:02}", s.rem_euclid(86_400) / 3600, s.rem_euclid(3600) / 60))
}

/// A day out of the near ones: its weekday within 6 days (`fri 08:07`),
/// else its date, day then month (`5 oct 08:07`, designer m_22812).
fn far_day(day: i64, gap: i64, hm: &str) -> String {
    if gap <= 6 {
        // day 0 (1970-01-01) was a thursday
        return format!("{} {}", WEEKDAYS[(day + 4).rem_euclid(7) as usize], hm);
    }
    let (_, m, d) = civil(day);
    format!("{} {} {}", d, MONTHS[(m - 1) as usize], hm)
}

/// What's ahead, on the clock (agent-waiting-states, the time rule): the
/// clock part alone, the caller says `until` / `next` / `→`: `08:07`
/// today, `tomorrow 08:07`, `fri 08:07` within 6 days, `5 oct 08:07`
/// beyond. An instant already past reads as today's clock. Its TS twin is
/// apps/desktop/src/thread/wake.ts `clockAhead`; both read
/// fixtures/wait_words.json.
pub fn clock_ahead(at_ms: u64, at_off_s: i32, now_ms: u64, now_off_s: i32) -> String {
    let ((ad, hm), (nd, _)) = (local_day(at_ms, at_off_s), local_day(now_ms, now_off_s));
    match ad - nd {
        gap if gap <= 0 => hm,
        1 => format!("tomorrow {}", hm),
        gap => far_day(ad, gap, &hm),
    }
}

/// A clock that's past, only in a hover or a detail and always relative
/// (`set yesterday 08:07`, never `tue 08:07` alone): `at 08:07` today
/// (designer m_23038: `set at 08:07`), `yesterday 08:07`, `tue 08:07`
/// within 6 days, `5 oct 08:07` beyond. TS twin: wake.ts `clockPast`.
pub fn clock_past(at_ms: u64, at_off_s: i32, now_ms: u64, now_off_s: i32) -> String {
    let ((ad, hm), (nd, _)) = (local_day(at_ms, at_off_s), local_day(now_ms, now_off_s));
    match nd - ad {
        gap if gap <= 0 => format!("at {}", hm),
        1 => format!("yesterday {}", hm),
        gap => far_day(ad, gap, &hm),
    }
}

/// A day number (days since 1970-01-01) as its year, month (1-12) and day
/// (Howard Hinnant's civil_from_days).
fn civil(z: i64) -> (i64, i64, i64) {
    let z = z + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (yoe + era * 400 + i64::from(m <= 2), m, d)
}

/// A pause's line (agent-waiting-states, his pick A): its turn ended, it
/// continues when an event comes (a watch it set with `resumes`) or
/// another agent answers. In parts: `state` (`continues when`, whole),
/// `note` (`cargo bench ends`, `search answers`: the only part a surface
/// cuts, on a word, with `…`), `who` (the agent it waits on, its name
/// opens it; empty for a watch), `more` (` and 1 more`), then ` · ` and
/// `dur`, whole (`running for 3 min` for a command or a pid, `1 min` for a
/// reply, `for 3 min` else; the TUI's `3m`). `len` is the bare duration
/// the head chip and the right bar's row end on (`3 min`, `3m`). `title`
/// lists every pause, oldest first, one a line. What runs now is a
/// duration, never a start on the clock.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct PauseLine {
    pub state: String,
    pub note: String,
    pub who: String,
    pub more: String,
    pub dur: String,
    pub len: String,
    pub title: String,
}

/// An agent's pause line at `now_ms`; None: nothing it continues on (an
/// alarm is no pause and says nothing here, see [`alarms`]). A reply it
/// waits on (`waiting_on` an agent) runs since its status; its watches
/// that resume it count only while it is idle. TS twin: wake.ts
/// `pauseLine`; both read fixtures/wait_words.json.
pub fn pause_line(a: &crate::rows::Agent, now_ms: u64, short: bool) -> Option<PauseLine> {
    use crate::rows::{Status, WaitingOn};
    let state = "continues when".to_string();
    if let Some(WaitingOn::Agent { name }) = &a.waiting_on {
        let len = wait_len(now_ms.saturating_sub(a.since_ms), short);
        let note = format!("{} answers", name);
        let title = format!("{} {} · {}", state, note, len);
        return Some(PauseLine { state, note, who: name.clone(), more: String::new(), dur: len.clone(), len, title });
    }
    if a.status != Status::Idle {
        return None;
    }
    pause_of(&a.watching, now_ms, short)
}

/// The watch half of [`pause_line`]: the line of an idle agent's watches
/// that resume it (the TUI's agent isn't a rows::Agent); None: none.
pub fn pause_of(watching: &[crate::rows::AgentWatch], now_ms: u64, short: bool) -> Option<PauseLine> {
    use crate::rows::{AgentWatch, WatchKind};
    let state = "continues when".to_string();
    let mut ws: Vec<&AgentWatch> = watching.iter().filter(|w| w.resumes).collect();
    ws.sort_by_key(|w| (w.since_ms, w.id));
    let first = *ws.first()?;
    let len = |w: &AgentWatch| wait_len(now_ms.saturating_sub(w.since_ms), short);
    let dur = |w: &AgentWatch| match w.kind {
        _ if short => len(w),
        WatchKind::Bg | WatchKind::Pid => format!("running for {}", len(w)),
        _ => format!("for {}", len(w)),
    };
    let event = |w: &AgentWatch| watch_event(w.kind, &w.what, w.noted);
    let more = match ws.len() - 1 {
        0 => String::new(),
        n => format!(" and {} more", n),
    };
    let title = ws.iter().map(|w| format!("{} {} · {}", state, event(w), dur(w))).collect::<Vec<_>>().join("\n");
    Some(PauseLine { note: event(first), who: String::new(), more, dur: dur(first), len: len(first), title, state })
}

/// An alarm in the right bar's `scheduled & watching` (agent-waiting-states
/// A): its agent is free, bise wakes it if the event comes. `note`: `if
/// the nightly gate goes red` (a surface cuts it on a word); `end`: when
/// it stops watching, the clock part alone (`08:07`, `tomorrow 08:07`; the
/// desktop says `until 08:07`, the TUI `→08:07`), empty when the hub
/// doesn't say; `title`, the hover: `bise wakes main if <event> · set
/// yesterday 08:07 · stops watching at 08:07`.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Alarm {
    pub id: u64,
    pub note: String,
    pub end: String,
    pub title: String,
}

/// An agent's alarms (its watches that don't resume it), oldest first,
/// whatever its status. `off` gives each instant's offset (seconds east
/// of UTC). TS twin: wake.ts `alarms`.
pub fn alarms(a: &crate::rows::Agent, now_ms: u64, off: &dyn Fn(u64) -> i32) -> Vec<Alarm> {
    alarms_of(&a.name, &a.watching, now_ms, off)
}

/// [`alarms`] from an agent's name and watches (the TUI's agent isn't a
/// rows::Agent).
pub fn alarms_of(name: &str, watching: &[crate::rows::AgentWatch], now_ms: u64, off: &dyn Fn(u64) -> i32) -> Vec<Alarm> {
    let mut ws: Vec<&crate::rows::AgentWatch> = watching.iter().filter(|w| !w.resumes).collect();
    ws.sort_by_key(|w| (w.since_ms, w.id));
    ws.into_iter()
        .map(|w| {
            let event = watch_event(w.kind, &w.what, w.noted);
            let set = clock_past(w.since_ms, off(w.since_ms), now_ms, off(now_ms));
            let end = w.until_ms.map(|u| clock_ahead(u, off(u), now_ms, off(now_ms))).unwrap_or_default();
            let mut title = format!("bise wakes {} if {} · set {}", name, event, set);
            if !end.is_empty() {
                // `at 08:07`, `tomorrow at 08:07`, `fri at 08:07` (designer m_23038)
                let at = match end.rsplit_once(' ') {
                    Some((day, hm)) => format!("{} at {}", day, hm),
                    None => format!("at {}", end),
                };
                title.push_str(&format!(" · stops watching {}", at));
            }
            Alarm { id: w.id, note: format!("if {}", event), end, title }
        })
        .collect()
}

/// What bise tells an agent when the user stopped its watch (the
/// window's `wake_stop`): `the user stopped watch #3 (cargo test): it
/// won't wake you`.
pub fn watch_stopped(id: u64, what: &str) -> String {
    format!("the user stopped watch #{id} ({what}): it won't wake you")
}

/// A wake entry's head, in parts (` · ` between them), each with whether
/// it is an error (only a non-zero rc): `cargo test ended`, `rc 0`,
/// `after 2m04s`; `the reindex still running after 1h00m`; `stopped
/// waiting for the reindex`; `stopped waiting for npm run dev after 24h`.
pub fn wake_head(f: &super::WakeFold) -> Vec<(String, bool)> {
    use super::WakeEv;
    let after = wake_dur(f.after_ms);
    match f.ev {
        WakeEv::Ended => {
            let verb = if f.kind == crate::rows::WatchKind::File && !f.noted { "appeared" } else { "ended" };
            let mut v = vec![(format!("{} {}", f.what, verb), false)];
            if let Some(rc) = f.rc {
                v.push((format!("rc {}", rc), rc != 0));
            }
            v.push((format!("after {}", after), false));
            v
        }
        WakeEv::Still => vec![(format!("{} still running after {}", f.what, after), false)],
        WakeEv::Stopped => vec![(format!("stopped waiting for {}", watch_label(f.kind, &f.what, f.noted)), false)],
        WakeEv::Expired => vec![(format!("stopped waiting for {} after {}", watch_label(f.kind, &f.what, f.noted), after), false)],
        WakeEv::Unknown => vec![(f.what.clone(), false)],
    }
}

/// A wake's folded output: `its last 3 lines`, `its last line`; None
/// without one.
pub fn wake_tail(f: &super::WakeFold) -> Option<String> {
    match f.tail.len() {
        0 => None,
        1 => Some("its last line".into()),
        n => Some(format!("its last {} lines", n)),
    }
}

#[cfg(test)]
mod tests {
    /// page-answer-row: his answer on a page reads as a card answer, his
    /// words alone; a note, a tick, an edit, a start in their own words.
    #[test]
    fn a_page_answer_reads_as_his_words() {
        use super::*;
        use crate::parts::{PageNote, PageSaid};
        let w = |s: &str| s.chars().count();
        let note = |kind: &str, text: &str, quote: &str| PageNote { block: "b".into(), kind: kind.into(), text: text.into(), quote: quote.into(), ..PageNote::default() };
        let said = |notes: &[PageNote]| page_answer(&PageSaid { to: "main", title: "efforts", notes }, &w);
        // his pick on a question that had a card: the card answer's row
        let pick = PageNote { card: 516, asked: "Est-ce que bise lit les listes dans l'API ?".into(), ..note("pick", "la table maintenant, la lecture de l'API juste après", "") };
        assert_eq!(said(std::slice::from_ref(&pick)), ("you answered main".into(), "Est-ce que bise lit les listes dans l'API ?".into(), "la table maintenant, la lecture de l'API juste après".into()));
        let short = PageNote { text: "xhigh".into(), ..pick };
        assert_eq!(said(&[short]).0, "you answered main: xhigh");
        // a note, a tick, an edit, a keep: the page named, his words one per line
        let notes = [note("note", "shorter", "Revenue grew"), note("tick", "done", ""), note("edit", "Q3", "Q2"), note("keep", "", "")];
        assert_eq!(said(&notes[..1]).0, "you sent main a note on ↗ efforts");
        assert_eq!(said(&notes), ("you sent main 4 notes on ↗ efforts".into(), String::new(), "\"Revenue grew\": shorter\n✓ done\n\"Q2\" → \"Q3\"\n♡ keep".into()));
        // a start: he asked for an agent
        assert_eq!(said(&[note("start", "do it", "ideas")]).0, "you asked main for an agent on ↗ efforts");
        // never the hub's template
        assert!(!said(&notes).2.contains("sb page publish"));
    }

    #[test]
    fn the_waiting_words_are_designers() {
        use super::*;
        use crate::rows::WatchKind;
        use crate::thread::{WakeEv, WakeFold};
        // what a watch waits for, after `continues when` / `if`; a note says it itself
        assert_eq!(watch_event(WatchKind::Bg, "cargo bench", false), "cargo bench ends");
        assert_eq!(watch_event(WatchKind::File, "build.rc", false), "build.rc appears");
        assert_eq!(watch_event(WatchKind::File, "the nightly gate goes red", true), "the nightly gate goes red");
        let f = |ev, kind, what: &str, rc, after_ms| WakeFold { id: 1, ev, kind, what: what.into(), noted: false, rc, after_ms, tail: Vec::new(), msg: None, agent: String::new() };
        let n = |ev| WakeFold { noted: true, ..f(ev, WatchKind::File, "the reindex", Some(101), 0) };
        let head_n = |x: &WakeFold| wake_head(x).into_iter().map(|(t, _)| t).collect::<Vec<_>>().join(" · ");
        assert_eq!(head_n(&n(WakeEv::Ended)), "the reindex ended · rc 101 · after 0s");
        assert_eq!(head_n(&n(WakeEv::Stopped)), "stopped waiting for the reindex");
        let head = |f: &WakeFold| wake_head(f).into_iter().map(|(t, _)| t).collect::<Vec<_>>().join(" · ");
        assert_eq!(head(&f(WakeEv::Ended, WatchKind::Bg, "cargo test", Some(0), 124_000)), "cargo test ended · rc 0 · after 2m04s");
        let red = f(WakeEv::Ended, WatchKind::Bg, "cargo test", Some(101), 190_000);
        assert_eq!(wake_head(&red)[1], ("rc 101".to_string(), true), "only a non-zero rc is red");
        assert!(!wake_head(&f(WakeEv::Ended, WatchKind::Bg, "x", Some(0), 1))[1].1);
        assert_eq!(head(&f(WakeEv::Ended, WatchKind::File, "build.rc", Some(1), 5_000)), "build.rc appeared · rc 1 · after 5s");
        assert_eq!(head(&f(WakeEv::Ended, WatchKind::Pid, "pid 4242", None, 5_000)), "pid 4242 ended · after 5s");
        assert_eq!(head(&f(WakeEv::Still, WatchKind::Pid, "the reindex", None, 3_600_000)), "the reindex still running after 1h00m");
        assert_eq!(head(&f(WakeEv::Stopped, WatchKind::Pid, "the reindex", None, 9)), "stopped waiting for the reindex");
        assert_eq!(head(&f(WakeEv::Expired, WatchKind::Bg, "npm run dev", None, 86_400_000)), "stopped waiting for npm run dev after 24h");
        let mut t = f(WakeEv::Ended, WatchKind::Bg, "x", Some(0), 1);
        assert_eq!(wake_tail(&t), None);
        t.tail = vec!["a".into(), "b".into(), "c".into()];
        assert_eq!(wake_tail(&t).as_deref(), Some("its last 3 lines"));
    }

    use super::*;

    /// The switch's status line per phase (architect m_20569, amb-home
    /// m_20570): the window draws these words, never its own.
    #[test]
    fn a_switch_says_one_line_per_phase() {
        use crate::rows::{SwitchPhase::*, SwitchRow};
        let r = |phase, reason: Option<&str>| SwitchRow { phase, to: "f7178b72".into(), from: Some("2065c746".into()), reason: reason.map(String::from), at_ms: 1 };
        assert_eq!(switch_line(&r(Reloading, None)), Some(("reloading bise on f7178b72".into(), NoticeLevel::Info)));
        assert_eq!(switch_line(&r(Up, None)), Some(("✓ reloaded on f7178b72".into(), NoticeLevel::Info)));
        assert_eq!(switch_line(&r(Passed, None)), Some(("✓ reloaded on f7178b72".into(), NoticeLevel::Info)));
        assert_eq!(switch_line(&r(RolledBack, Some("the hub died"))), Some(("▲ couldn't reload: the hub died".into(), NoticeLevel::Warn)));
        assert_eq!(switch_line(&r(Unknown, None)), None);
    }

    #[test]
    fn a_retry_says_the_next_attempt() {
        assert_eq!(provider_retry("2/10 · provider 529 (transient) · retry in 4s"), "model call failed (attempt 2/10): provider 529 (transient) · retry 3/10 in 4s");
        assert_eq!(provider_retry("odd"), "model call failed: odd");
        // H9: the words now come from lines::retry's struct; the runtime's
        // own line (bend LAWS provider_retry_line) reads as it did before
        assert_eq!(provider_retry("1/10 · provider 529 (transient) · retry in 1s"), "model call failed (attempt 1/10): provider 529 (transient) · retry 2/10 in 1s");
        let r = lines::retry("1/10 · provider 529 (transient) · retry in 1s").unwrap();
        assert_eq!((r.attempt, r.max, r.why.as_str(), r.wait_ms, r.end), (1, 10, "provider 529 (transient)", 1_000, None));
        // not that shape: no data, the words say the line as it came
        for odd in ["odd", "2/10 · a · b · retry in 4s", "x/10 · 529 · retry in 4s", "2/10 · 529 · retry soon"] {
            assert_eq!(lines::retry(odd), None, "{odd}");
            assert_eq!(provider_retry(odd), format!("model call failed: {odd}"));
        }
        let n = obs_notice(&lines::Obs::ProviderRetry("2/10 · 529 · retry in 4s".into()), &|_, k| k.to_string()).unwrap();
        assert_eq!(n.retry.map(|r| r.attempt), Some(2), "the notice carries its data");
    }

    #[test]
    fn a_missing_key_names_its_provider() {
        let name = |id: &str, var: &str| if id.is_empty() { format!("<{var}>") } else { id.to_uppercase() };
        assert_eq!(no_key("no openrouter key yet (OPENROUTER_API_KEY is not set): /provider sets it up", &name).as_deref(), Some("turn stopped: no OPENROUTER key yet. /provider sets it up."));
        assert_eq!(no_key("MISTRAL_API_KEY is not set", &name).as_deref(), Some("turn stopped: no <MISTRAL_API_KEY> key yet. /provider sets it up."));
        assert_eq!(no_key("the network is down", &name), None);
        assert!(is_plan_line("your ChatGPT sign-in expired. run /provider") && is_expired_line("your ChatGPT sign-in expired."));
    }

    /// designer m_15602: a label, not the question: the first words up to
    /// the first `:`, `?`, `(`…, no tag, no agent name, path, flag or
    /// quote, never `…` (the user's screenshot's instructions).
    #[test]
    fn a_timer_without_a_name_gets_a_label_from_its_words() {
        let f = timer_fallback;
        assert_eq!(f("check /Users/g/.bise/hubs/h/agents/art-seen/tmp/res and rc (tui_artifacts repro)", "art-seen"), "check and rc");
        assert_eq!(f("amb-win: read /Users/g/tmp/b1land.out (test:land f...", "amb-win"), "read");
        assert_eq!(f("amb-core: streaming bench: queue empty? (pgrep -fl 'heavy-run|lockf'; uptime", "amb-core"), "streaming bench");
        assert_eq!(f("standing rule (main m_7436, m_9222), battery mode", "ambient-lead"), "standing rule");
        assert_eq!(f("bise desktop drive: check designer (desktop-ds), ambient-lead's plan", "main"), "bise desktop drive");
        assert_eq!(f("answer-line build check every run", "answer-line"), "build check every run", "its agent's name goes");
        // designer m_15921: wherever it sits, with the `for` / `on` before it
        assert_eq!(f("check the build for answer-line", "answer-line"), "check the build");
        assert_eq!(f("run the bench on amb-core then report", "amb-core"), "run the bench then report");
        assert_eq!(f("check the build for answer-line", ""), "check the build for answer-line", "no agent: kept");
        assert_eq!(f("is the queue empty? then run it", ""), "is the queue empty");
        assert_eq!(f("/a/b /c", ""), "/a/b /c", "nothing left: the instruction's own first line");
        assert_eq!(f("supercalifragilisticexpialidocious-and-more-words-here", ""), "supercalifragilisticexpialidocio", "a first word past 32: cut, the only way");
        for s in ["ship it", "x"] {
            assert_eq!(f(s, "w"), s);
        }
        for s in ["check /Users/g/x and rc (repro)", "amb-core: streaming bench: queue empty? (pgrep"] {
            let n = f(s, "amb-core");
            assert!(!n.contains(['…', '?', '(', ':']) && n.split(' ').count() <= 5, "{n}");
        }
    }

    #[test]
    fn a_name_never_repeats_its_agent() {
        assert_eq!(name_without_agent("answer-line build check", "answer-line"), "build check");
        assert_eq!(name_without_agent("amb-core: streaming bench", "amb-core"), "streaming bench");
        assert_eq!(name_without_agent("amb-core", "amb-core"), "amb-core", "only its name: kept");
        assert_eq!(name_without_agent("amb-corebench", "amb-core"), "amb-corebench", "a word that starts the same: kept");
        assert_eq!(name_without_agent("build check", ""), "build check");
    }

    #[test]
    fn a_name_is_cut_at_a_word() {
        assert_eq!(name_fit("amb-core streaming bench"), "amb-core streaming bench");
        assert_eq!(name_fit("check the desktop drive and the plan of ambient-lead"), "check the desktop drive and the");
        assert!(name_fit("check the desktop drive and the plan of ambient-lead").chars().count() <= NAME_MAX);
        assert_eq!(name_fit("  two\n words "), "two words");
    }

    #[test]
    fn one_line_and_the_summary() {
        assert_eq!(summary(&[]), "");
        assert_eq!(one_line("  \nabcdef", 4), "abc…");
    }

    /// desktop-status-line: the wait's words, read from the fixture the
    /// desktop's TS twin (thread/wake.test.ts) reads too (architect m_22744).
    #[test]
    fn wait_words_follow_the_fixture() {
        use super::*;
        let fx: serde_json::Value = serde_json::from_str(include_str!("../../fixtures/wait_words.json")).unwrap();
        let n = |v: &serde_json::Value, k: &str| v[k].as_u64().unwrap();
        let o = |v: &serde_json::Value, k: &str| v[k].as_i64().unwrap() as i32;
        let s = |v: &serde_json::Value, k: &str| v[k].as_str().unwrap().to_string();
        for c in fx["len"].as_array().unwrap() {
            assert_eq!(wait_len(n(c, "ms"), false), s(c, "long"), "{}", c["ms"]);
            assert_eq!(wait_len(n(c, "ms"), true), s(c, "short"), "{}", c["ms"]);
        }
        for (key, f) in [("ahead", clock_ahead as fn(u64, i32, u64, i32) -> String), ("past", clock_past)] {
            for c in fx[key].as_array().unwrap() {
                assert_eq!(f(n(c, "at_ms"), o(c, "at_off_s"), n(c, "now_ms"), o(c, "now_off_s")), s(c, "clock"), "{key}: {}", c["why"]);
            }
        }
        // an agent row from the fixture's few fields, the rest an idle agent's
        let agent = |v: &serde_json::Value| -> crate::rows::Agent {
            let mut a = serde_json::json!({"name": "main", "main": false, "status": "idle", "archived": false, "title": "", "purpose": "", "since_ms": 0, "waits": 0, "watching": []});
            for (k, x) in v.as_object().unwrap() {
                a[k] = x.clone();
            }
            serde_json::from_value(a).unwrap()
        };
        for c in fx["pauses"].as_array().unwrap() {
            let got = pause_line(&agent(&c["agent"]), n(c, "now_ms"), c["short"].as_bool().unwrap());
            let want = (!c["want"].is_null()).then(|| {
                let w = &c["want"];
                PauseLine { state: s(w, "state"), note: s(w, "note"), who: s(w, "who"), more: s(w, "more"), dur: s(w, "dur"), len: s(w, "len"), title: s(w, "title") }
            });
            assert_eq!(got, want, "{}", c["why"]);
        }
        for c in fx["alarms"].as_array().unwrap() {
            let off = o(c, "off_s");
            let got = alarms(&agent(&c["agent"]), n(c, "now_ms"), &|_| off);
            let want: Vec<Alarm> = c["want"].as_array().unwrap().iter().map(|w| Alarm { id: n(w, "id"), note: s(w, "note"), end: s(w, "end"), title: s(w, "title") }).collect();
            assert_eq!(got, want, "{}", c["why"]);
        }
    }
}
